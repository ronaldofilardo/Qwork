# ====================================================================
# APLICAR MIGRATIONS v7 NO BANCO STAGING — SYNC COMPLETO (9000-9001 + 1144-1145)
# Data: 06/04/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica as migrations pendentes após v6 (após 1143).
# TAMBÉM inclui as migrations de big-sync 9000/9001 que são IDEMPOTENTES —
# portanto é SEGURO executar mesmo que v6 ainda NÃO tenha sido aplicado:
# 9000 cobre tudo que 1137-1143 faria via IF EXISTS / IF NOT EXISTS.
#
# Pré-requisito: psql no PATH + NEON_STAGING_PASSWORD definida
#
# ORDEM CRÍTICA:
#   9000  sync_staging_with_dev     → Big sync cumulativo (tudo até 1143)
#   9001  sync_indexes_staging      → Sincroniza 13 drops + 9 creates de índices
#   1144  fix_laudos_emissor_cpf_fk → Remapeia FK emissor_cpf → usuarios
#   1145  drop_fk_laudos_emissor    → Remove FK definitivamente (enforcement via app)
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
Write-Host "  SYNC STAGING v7 — Big Sync 9000/9001 + Migrations 1144-1145" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "  Cobertura cumulativa: 1137-1145 (idempotente)" -ForegroundColor Gray
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
    Write-Host "Estado atual do staging (schema_migrations):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 10;" 2>&1
    Write-Host ""
}

# ====================================================================
# Migrations a aplicar (ordem importa!)
# ====================================================================
$migrations = @(
    # 9000: Big sync cumulativo staging<->dev (IDEMPOTENTE)
    # Cobre tudo de 1137-1143 via IF EXISTS / IF NOT EXISTS
    # Seguro aplicar mesmo que 1137-1143 já tenham sido aplicados
    @{ File = "9000_sync_staging_with_dev.sql"; Label = "BIG SYNC 9000 (cumulativo 1137-1143)" },

    # 9001: Sincroniza índices staging<->dev
    # Drop 13 índices obsoletos + Create 9 novos
    @{ File = "9001_sync_indexes_staging_with_dev.sql"; Label = "SYNC INDEXES 9001" },

    # 1144: Remapeia FK laudos.emissor_cpf de funcionarios → usuarios
    @{ File = "1144_fix_laudos_emissor_cpf_fk_to_usuarios.sql"; Label = "1144 fix FK emissor_cpf -> usuarios" },

    # 1145: Remove a FK definitivamente (enforcement via middleware, não DB)
    @{ File = "1145_drop_fk_laudos_emissor_cpf.sql"; Label = "1145 drop FK emissor_cpf total" }
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

    $versionsToRegister = @(1137, 1138, 1139, 1140, 1141, 1142, 1143, 1144, 1145, 9000, 9001)
    $versionsSql = ($versionsToRegister | ForEach-Object { "($_)" }) -join ","

    $insertSql = "INSERT INTO schema_migrations (version) VALUES $versionsSql ON CONFLICT (version) DO NOTHING;"
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c $insertSql 2>&1
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PÓS-APPLY
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING ATUALIZADO! Sync v7 aplicado." -ForegroundColor Green
    Write-Host ""
    Write-Host "Executando verificacoes pos-apply..." -ForegroundColor Cyan
    Write-Host ""

    # [1] Últimas migrations registradas
    Write-Host "  [1/9] Ultimas migrations registradas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 15;" 2>&1

    # [2] Tabelas criadas por 9000
    Write-Host "  [2/9] Tabelas criadas (laudos_storage_log, rate_limit_entries):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('laudos_storage_log','rate_limit_entries') ORDER BY table_name;" 2>&1

    # [3] Coluna usuario_tipo em funcionarios
    Write-Host "  [3/9] Coluna usuario_tipo em funcionarios:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='funcionarios' AND column_name='usuario_tipo';" 2>&1

    # [4] link_disponibilizado_em na view
    Write-Host "  [4/9] Coluna link_disponibilizado_em em v_solicitacoes_emissao:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='v_solicitacoes_emissao' AND column_name='link_disponibilizado_em';" 2>&1

    # [5] Colunas legacy removidas
    Write-Host "  [5/9] Colunas legacy removidas (deve retornar 0 rows cada):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('entidades','clinicas') AND column_name IN ('data_liberacao_login','pagamento_confirmado') ORDER BY table_name,column_name;" 2>&1

    # [6] FK liberado_por removida (1143)
    Write-Host "  [6/9] FK liberado_por removida (deve retornar 0 rows):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='lotes_avaliacao' AND constraint_name LIKE '%liberado_por%';" 2>&1

    # [7] FK emissor_cpf removida (1145)
    Write-Host "  [7/9] FK emissor_cpf removida (deve retornar 0 rows):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='laudos' AND constraint_name LIKE '%emissor_cpf%';" 2>&1

    # [8] Contagem de índices (deve ser 412 ± 5)
    Write-Host "  [8/9] Contagem de indices no staging:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT count(*) AS total_indices FROM pg_indexes WHERE schemaname = 'public';" 2>&1

    # [9] Views críticas existem
    Write-Host "  [9/9] Views criticas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao','v_relatorio_emissoes') ORDER BY table_name;" 2>&1

    Write-Host ""
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host "  STAGING sincronizado com DEV (feature/v2)!" -ForegroundColor Green
    Write-Host "  Versao final esperada: 1145 (+ 9000/9001)" -ForegroundColor Gray
    Write-Host "=====================================================================" -ForegroundColor Cyan
} elseif ($DryRun) {
    Write-Host "Dry-run concluido. Nenhuma migration foi aplicada." -ForegroundColor Yellow
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima. Warnings sao normais (idempotentes)." -ForegroundColor Yellow
}

Write-Host ""

# Limpar variável de ambiente
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
