# ====================================================================
# APLICAR MIGRATIONS v2 NO BANCO STAGING
# Data: 12/03/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica todas as migrations novas da feature/v2 que
# ainda não existem no banco staging.
# Todas as migrations usam IF NOT EXISTS — são idempotentes (seguro re-executar).
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_PASSWORD = "REDACTED_NEON_PASSWORD"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

$env:PGPASSWORD = $NEON_PASSWORD

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  APLICAR MIGRATIONS v2 -> STAGING (neondb_staging)" -ForegroundColor Cyan
Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# Lista ordenada das migrations novas na feature/v2 (vs main)
# Ordem: primeiro por número, depois as que têm sufixos (a, b, etc.)
# As DEV_SYNC e fix_* vêm por último
$migrations = @(
    # Security / Cleanup (baixo número, mas novas na v2)
    "211_fix_security_critical.sql",
    "308_remove_perfil_cadastro_super_legado.sql",
    "309_emissor_granular_rls_laudos.sql",

    # Sistema de Comissionamento (500-510)
    "500_sistema_comissionamento.sql",
    "501_add_valor_servico_lotes_avaliacao.sql",
    "502_ajustes_comissionamento.sql",
    "503_percentual_comissao_por_representante.sql",
    "504_view_only.sql",
    "504_vinculos_comissao_suporte_clinica.sql",
    "505_corrigir_vinculos_comissao_constraint.sql",
    "505_status_comissao_revision.sql",
    "505_comissoes_laudo_suporte_clinica.sql",
    "506_comissoes_fixes_e_retroativas.sql",
    "510_representante_login_unificado.sql",

    # Representantes: convites, dados bancários, leads (520-600)
    "520_representante_convites_senha.sql",
    "521_dados_bancarios_status.sql",
    "522_fix_view_solicitacoes_emissao_entidade.sql",
    "523_lead_valor_negociado.sql",
    "524_v_solicitacoes_emissao_valor_negociado.sql",
    "525_fix_view_solicitacoes_emissao_entidade_v2.sql",
    "526_representantes_aceites_politica.sql",
    "527_representantes_aceites_politica_prod.sql",
    "528_primeira_senha_grandfathering.sql",
    "600_representantes_cadastro_leads.sql",

    # Sincronização PROD / Refactoring (1016-1017)
    "1016_sync_prod_dois_fluxos_distintos.sql",
    "1017_fn_cpf_em_uso_cross_table.sql",
    "1017_rename_contratante_id_to_tomador_id.sql",

    # Arquivo remoto (1102b)
    "1102b_add_arquivo_remoto_columns_safe.sql",

    # Fixes auxiliares (por último)
    "fix_audit_function_cpf.sql",
    "DEV_SYNC_505_506.sql"
)

Write-Host "Migrations a aplicar: $($migrations.Count)" -ForegroundColor Yellow
Write-Host "   Banco:    $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host ""

$success = 0
$failed = 0
$skipped = 0
$errors = @()

foreach ($migration in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $migration

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $migration" -ForegroundColor Gray
        Write-Host "        (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $migration" -ForegroundColor Cyan
        continue
    }

    Write-Host "  >> Aplicando: $migration..." -ForegroundColor Cyan -NoNewline

    $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $success++
    } else {
        # Verificar se é só WARNING (não erro crítico)
        $hasError = $output | Where-Object { $_ -match "^(psql:|ERROR)" }
        if ($hasError) {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = $output -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $migration
        } else {
            Write-Host " WARN (continua)" -ForegroundColor Yellow
            $success++
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
  Write-Host "  Resultado:" -ForegroundColor White
  Write-Host "  OK Sucesso: $success" -ForegroundColor Green
  Write-Host "  ERRO:       $failed" -ForegroundColor Red
  Write-Host "  Skip:       $skipped" -ForegroundColor Gray

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com erro:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING PRONTO PARA TESTES!" -ForegroundColor Green
    Write-Host "URL Preview: https://qwork-git-feature-v2-ronaldofilardos-projects.vercel.app" -ForegroundColor Cyan
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima antes de testar." -ForegroundColor Yellow
}
Write-Host ""
