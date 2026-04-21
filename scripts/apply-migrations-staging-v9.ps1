# ====================================================================
# APLICAR MIGRATIONS v9 NO BANCO STAGING — 1200-1209
# Data: 16/04/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica as migrations pendentes após v8 (após 1149).
#
# ORDEM CRÍTICA:
#   1200  taxa_manutencao_schema                      → Taxa manutenção R$250, colunas entidades/clinicas/empresas_clientes
#   1201  pagamentos_link_token                        → Token de link de pagamento em lotes
#   1202  audit_delecoes_tomador                       → Auditoria de deleções de tomador
#   1203  percentual_comissao_comercial                → Percentual comissão comercial em representantes
#   1204a custo_fixo_por_representante                 → Custo fixo por representante
#   1204b remove_proposta_comercial_colunas            → Remove colunas proposta_comercial obsoletas
#   1205  view_solicitacoes_emissao_modelo_comissao    → View com modelo de comissão
#   1206  fix_trg_reject_prohibited_roles_use_perfil   → Fix trigger de roles proibidas
#   1207  sync_v_solicitacoes_emissao_valor_negociado  → Sync view com valor negociado/vinculo
#   1208  consolidar_view_emissao_custo_fixo           → Consolida view emissão com custo fixo
#   1209  comissao_comercial_vinculos_pf_removal       → Comissão comercial em vinculos + remoção PF
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha de variável de ambiente (OBRIGATÓRIO)
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} else {
    Write-Host "ERRO: Variavel de ambiente NEON_STAGING_PASSWORD nao definida." -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_STAGING_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    exit 1
}

# Forçar SSL para Neon
$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC STAGING v9 — Migrations 1200-1209" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "  Cobertura: 1200-1209 (apos v8 que cobriu ate 1149)" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PRÉ-APPLY: estado atual do staging
# ====================================================================
if (-not $DryRun) {
    Write-Host "Estado atual do staging (schema_migrations - ultimas 15):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 15;" 2>&1
    Write-Host ""
}

# ====================================================================
# Migrations a aplicar (ordem importa! 1204a antes de 1204b)
# ====================================================================
$migrations = @(
    @{ File = "1200_taxa_manutencao_schema.sql";                          Label = "1200 taxa_manutencao_schema" },
    @{ File = "1201_pagamentos_link_token.sql";                           Label = "1201 pagamentos_link_token" },
    @{ File = "1202_audit_delecoes_tomador.sql";                          Label = "1202 audit_delecoes_tomador" },
    @{ File = "1203_percentual_comissao_comercial.sql";                   Label = "1203 percentual_comissao_comercial" },
    @{ File = "1204a_custo_fixo_por_representante.sql";                    Label = "1204a custo_fixo_por_representante" },
    @{ File = "1204b_remove_proposta_comercial_colunas.sql";               Label = "1204b remove_proposta_comercial_colunas" },
    @{ File = "1205_view_solicitacoes_emissao_modelo_comissao.sql";       Label = "1205 view_solicitacoes_emissao_modelo_comissao" },
    @{ File = "1206_fix_trg_reject_prohibited_roles_use_perfil.sql";      Label = "1206 fix_trg_reject_prohibited_roles_use_perfil" },
    @{ File = "1207_sync_v_solicitacoes_emissao_valor_negociado_vinculo.sql"; Label = "1207 sync_v_solicitacoes_emissao_valor_negociado_vinculo" },
    @{ File = "1208_consolidar_view_emissao_custo_fixo.sql";              Label = "1208 consolidar_view_emissao_custo_fixo" },
    @{ File = "1209_comissao_comercial_vinculos_pf_removal.sql";          Label = "1209 comissao_comercial_vinculos_pf_removal" }
)

Write-Host "Total de migrations: $($migrations.Count)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed  = 0
$skipped = 0
$warnings = 0
$errors = @()
$warningList = @()

foreach ($m in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $m.File

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $($m.Label) (arquivo nao encontrado)" -ForegroundColor DarkGray
        $skipped++
        continue
    }

    if ($DryRun) {
        Write-Host "  >> SERIA aplicada: $($m.Label)" -ForegroundColor Cyan
        continue
    }

    Write-Host "  >> Aplicando: $($m.Label)..." -ForegroundColor Cyan -NoNewline

    $output   = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        $hasError = $output | Where-Object { $_ -match "^ERROR:" }
        if ($hasError) {
            $isIdempotent = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop" }
            if ($isIdempotent) {
                Write-Host " WARN (ja aplicada, ok)" -ForegroundColor Yellow
                $warnings++
                $warningList += $m.Label
            } else {
                Write-Host " ERRO (exit=0)" -ForegroundColor Red
                $outputStr = ($output | Where-Object { $_ -match "ERROR:" }) -join " | "
                Write-Host "     $outputStr" -ForegroundColor DarkRed
                $failed++
                $errors += $m.Label
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $success++
        }
    } else {
        $isIdempotent = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop|violates" }
        if ($isIdempotent) {
            Write-Host " WARN (ja aplicada, ok)" -ForegroundColor Yellow
            $warnings++
            $warningList += $m.Label
        } else {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = ($output | Where-Object { $_ -match "ERROR:|psql:" }) -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $m.Label
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Resultado:" -ForegroundColor White
Write-Host "  OK Sucesso:   $success" -ForegroundColor Green
Write-Host "  WARN (skip):  $warnings" -ForegroundColor Yellow
Write-Host "  ERRO:         $failed" -ForegroundColor Red
Write-Host "  Skip (N/A):   $skipped" -ForegroundColor Gray

if ($warningList.Count -gt 0) {
    Write-Host ""
    Write-Host "  Warnings (idempotentes, OK):" -ForegroundColor Yellow
    $warningList | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com ERRO (requer atencao):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

# ====================================================================
# REGISTRAR VERSIONS NO schema_migrations (idempotente)
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "Registrando versoes em schema_migrations..." -ForegroundColor Cyan

    $versionsToRegister = @(1200, 1201, 1202, 1203, 1204, 1205, 1206, 1207, 1208, 1209)
    $versionsSql = ($versionsToRegister | ForEach-Object { "($_)" }) -join ","

    $insertSql = "INSERT INTO schema_migrations (version) VALUES $versionsSql ON CONFLICT (version) DO NOTHING;"
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c $insertSql 2>&1
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PÓS-APPLY
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING ATUALIZADO! Sync v9 aplicado." -ForegroundColor Green
    Write-Host ""
    Write-Host "Executando verificacoes pos-apply..." -ForegroundColor Cyan
    Write-Host ""

    # [1] Últimas migrations registradas
    Write-Host "  [1/5] Ultimas migrations registradas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 20;" 2>&1

    # [2] Colunas taxa_manutencao em entidades
    Write-Host "  [2/5] Colunas taxa_manutencao em entidades:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='entidades' AND column_name LIKE '%manutencao%' ORDER BY column_name;" 2>&1

    # [3] Coluna percentual_comissao_comercial em representantes
    Write-Host "  [3/5] Coluna percentual_comissao_comercial em representantes:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='representantes' AND column_name='percentual_comissao_comercial';" 2>&1

    # [4] View v_solicitacoes_emissao existe
    Write-Host "  [4/5] View v_solicitacoes_emissao:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT viewname FROM pg_views WHERE viewname = 'v_solicitacoes_emissao';" 2>&1

    # [5] Coluna percentual_comissao_comercial em vinculos_comissao (1209)
    Write-Host "  [5/5] Coluna percentual_comissao_comercial em vinculos_comissao:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='vinculos_comissao' AND column_name='percentual_comissao_comercial';" 2>&1
}
