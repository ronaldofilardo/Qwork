# ====================================================================
# APLICAR MIGRATIONS v2 NO BANCO DE DESENVOLVIMENTO LOCAL
# Data: 17/03/2026
# Branch: feature/v2
# Target: nr-bps_db (PostgreSQL local)
#
# Todas as migrations usam IF NOT EXISTS — são idempotentes (seguro re-executar).
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$env:PGPASSWORD = "123456"
$PG_USER = "postgres"
$PG_DB = "nr-bps_db"
$PG_HOST = "localhost"
$PG_PORT = "5432"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  APLICAR MIGRATIONS v2 -> DEV LOCAL (nr-bps_db)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# Verificar banco
$dbCheck = psql -U $PG_USER -h $PG_HOST -p $PG_PORT -d postgres -t -c "SELECT 1 FROM pg_database WHERE datname='$PG_DB';" 2>&1
if ($dbCheck -notmatch "1") {
    Write-Host "ERRO: Banco $PG_DB nao encontrado em $PG_HOST`:$PG_PORT" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Banco $PG_DB encontrado em $PG_HOST`:$PG_PORT" -ForegroundColor Green
Write-Host ""

# Ordem completa das migrations da feature/v2
$migrations = @(
    # Sistema de Comissionamento (500-510)
    "500_sistema_comissionamento.sql",
    "501_add_valor_servico_lotes_avaliacao.sql",
    "501_recreate_views.sql",
    "502_ajustes_comissionamento.sql",
    "503_percentual_comissao_por_representante.sql",
    "504_view_only.sql",
    "504_vinculos_comissao_suporte_clinica.sql",
    "505_corrigir_vinculos_comissao_constraint.sql",
    "505_status_comissao_revision.sql",
    "505_comissoes_laudo_suporte_clinica.sql",
    "506_comissoes_fixes_e_retroativas.sql",
    "510_representante_login_unificado.sql",

    # Representantes: convites, dados bancários, leads (520-532)
    "520_representante_convites_senha.sql",
    "521_dados_bancarios_status.sql",
    "522_fix_view_solicitacoes_emissao_entidade.sql",
    "523_lead_valor_negociado.sql",
    "524_v_solicitacoes_emissao_valor_negociado.sql",
    "525_fix_view_solicitacoes_emissao_entidade_v2.sql",
    "526_representantes_aceites_politica.sql",
    "526_vinculos_comissao_valor_negociado.sql",
    "527_representantes_aceites_politica_prod.sql",
    "528_primeira_senha_grandfathering.sql",
    "530_comissoes_parcelamento.sql",
    "531_comissoes_geradas_count.sql",
    "531_drop_lote_rep_unico_index.sql",
    "532_parcela_confirmada_em.sql",

    # Representantes: leads/cadastro (600)
    "600_representantes_cadastro_leads.sql",
    "600_create_funcionarios_relationships.sql",

    # Sincronização estrutura prod/dev (1016-1019)
    "1016_sync_prod_dois_fluxos_distintos.sql",
    "1017_fn_cpf_em_uso_cross_table.sql",
    "1017_rename_contratante_id_to_tomador_id.sql",
    "1018_compat_views_tomadors.sql",
    "1019_drop_compat_views_tomadors.sql",

    # Arquivo remoto
    "1102b_add_arquivo_remoto_columns_safe.sql",

    # Fixes auxiliares
    "fix_audit_function_cpf.sql",
    "DEV_SYNC_505_506.sql"
)

Write-Host "Migrations a aplicar: $($migrations.Count)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed  = 0
$skipped = 0
$errors  = @()

foreach ($migration in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $migration

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $migration (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  DRY   $migration" -ForegroundColor Yellow
        continue
    }

    Write-Host "  ...   $migration" -ForegroundColor Gray
    $output = psql -U $PG_USER -h $PG_HOST -p $PG_PORT -d $PG_DB -f $filePath 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERRO  $migration" -ForegroundColor Red
        Write-Host "        $output" -ForegroundColor DarkRed
        $failed++
        $errors += $migration
    } else {
        Write-Host "  OK    $migration" -ForegroundColor Green
        $success++
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  RESULTADO" -ForegroundColor Cyan
Write-Host "  OK:      $success" -ForegroundColor Green
Write-Host "  ERRO:    $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  SKIP:    $skipped" -ForegroundColor DarkGray
Write-Host "====================================================================" -ForegroundColor Cyan

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "Migrations com erro:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
