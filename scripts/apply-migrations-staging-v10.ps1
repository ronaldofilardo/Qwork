# ====================================================================
# APLICAR MIGRATIONS v10 NO BANCO STAGING — 1212-1220
# Data: 2026-04-27
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Migrations pendentes (gap detectado por inspeção):
#   1212  consolidar_comissoes_remove_sistema_antigo  → Drop repasses_split, ciclos_comissao_mensal + asaas cols
#   1213  usuarios_asaas_wallet_id                    → usuarios.asaas_wallet_id
#   1218  rls_config_tables                           → RLS em clinica_configuracoes, templates_contrato, etc.
#   1219  fix_rls_policies_rbac                       → Corrigir policies RLS quebradas
#   1220  add_gestor_to_perfil_enum                   → Adiciona 'gestor' ao perfil_usuario_enum
#
# IGNORADAS (já aplicadas): 1214, 1215, 1217, 1221a, 1221b, 1222
# IGNORADAS (PROD TEMPLATE): 1216
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} elseif ($env:PGPASSWORD) {
    # já definido
} else {
    Write-Host "ERRO: Defina NEON_STAGING_PASSWORD ou PGPASSWORD." -ForegroundColor Red
    exit 1
}

$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC STAGING v10 — Migrations 1212-1220 (gap fix)" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# Migrations a aplicar em ordem
$migrations = @(
    @{ file = "1212_consolidar_comissoes_remove_sistema_antigo.sql"; desc = "Consolida comissões, remove repasses_split e ciclos_comissao_mensal" }
    @{ file = "1213_usuarios_asaas_wallet_id.sql";                   desc = "Adiciona usuarios.asaas_wallet_id" }
    @{ file = "1218_rls_config_tables.sql";                          desc = "Habilita RLS em tabelas de configuração" }
    @{ file = "1219_fix_rls_policies_rbac.sql";                      desc = "Corrige policies RLS quebradas + adiciona policies ausentes" }
    @{ file = "1220_add_gestor_to_perfil_enum.sql";                  desc = "Adiciona 'gestor' ao perfil_usuario_enum" }
)

$errors = @()

foreach ($m in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $m.file
    if (-not (Test-Path $filePath)) {
        Write-Host "  [SKIP] $($m.file) — arquivo não encontrado" -ForegroundColor Yellow
        continue
    }

    Write-Host "  [$( if ($DryRun) { 'DRY' } else { 'RUN' } )] $($m.file)" -ForegroundColor White
    Write-Host "         $($m.desc)" -ForegroundColor Gray

    if (-not $DryRun) {
        $output = psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -f $filePath 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  [ERRO] Falha ao aplicar $($m.file)" -ForegroundColor Red
            Write-Host $output -ForegroundColor Red
            $errors += $m.file
        } else {
            Write-Host "  [ OK ] Aplicado com sucesso" -ForegroundColor Green
            if ($output) { Write-Host $output -ForegroundColor Gray }
        }
    }
    Write-Host ""
}

Write-Host "====================================================================" -ForegroundColor Cyan

if ($DryRun) {
    Write-Host "  Dry-run concluido. $($migrations.Count) migrations listadas." -ForegroundColor Yellow
} elseif ($errors.Count -eq 0) {
    Write-Host "  CONCLUIDO: $($migrations.Count) migrations aplicadas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "  CONCLUIDO COM ERROS: $($errors.Count) migrations falharam:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "====================================================================" -ForegroundColor Cyan
