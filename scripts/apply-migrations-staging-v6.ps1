# ====================================================================
# APLICAR MIGRATIONS v6 NO BANCO STAGING — INCREMENTAL (1137-1143)
# Data: 05/04/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica as 9 migrations pendentes após v4 (1134-1136).
# Pré-requisito: v4 já aplicado (migrations até 1136).
# Todas as migrations são idempotentes (IF EXISTS / IF NOT EXISTS).
# ====================================================================
# ORDEM CRÍTICA:
#   1137a laudos_storage_protection  → Tabela + RLS + triggers proteção laudos
#   1137b remover_colunas_pagamento  → Drop colunas legacy + recria views
#   1138  cleanup_final_planos       → Drop final planos + recria views
#   1139  fix_not_null_constraints   → usuario_tipo + NOT NULL constraints
#   1140a fix_seq_vendedor           → Corrige sequência vendedores
#   1140b recalcular_lotes_stuck     → Recalcula lotes travados (one-time)
#   1141  link_disponibilizado_em    → Atualiza view v_solicitacoes_emissao
#   1142  fix_fn_next_lote_id        → Null guard no alocador de lote_id
#   1143  drop_liberado_por_fkey     → Remove FK problemática lotes_avaliacao
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"  # Use pooler for better SSL/connection stability
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"
$NEON_SSLMODE = "require"  # Neon requires SSL

# Ler senha de variável de ambiente (OBRIGATÓRIO)
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} else {
    Write-Host "ERRO: Variavel de ambiente NEON_STAGING_PASSWORD nao definida." -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_STAGING_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    exit 1
}

# Forçar SSL para Neon (psql 17: PGSSLCERTMODE=allow necessário pois Neon não solicita cert cliente)
$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC INCREMENTAL STAGING v6 — Migrations 1137-1143" -ForegroundColor Cyan
Write-Host "  Target: $NEON_DB @ $NEON_HOST" -ForegroundColor Gray
Write-Host "  Pre-requisito: v4 aplicado (1134-1136)" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhuma migration sera aplicada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# Migrations pendentes (ordem importa!)
# ====================================================================
$migrations = @(
    # 1137a: Proteção de storage para laudos (tabela append-only + RLS + triggers)
    "1137_laudos_storage_protection.sql",

    # 1137b: Remover colunas legacy pagamento_confirmado e data_liberacao_login
    "1137_remover_colunas_pagamento_cadastro.sql",

    # 1138: Cleanup final do sistema de planos (idempotente)
    "1138_cleanup_final_planos_system.sql",

    # 1139: Fix NOT NULL constraints + adiciona usuario_tipo em funcionarios
    "1139_fix_not_null_constraints.sql",

    # 1140a: Corrige sequência seq_vendedor_codigo (evita colisão)
    "1140_fix_seq_vendedor_codigo_duplicatas.sql",

    # 1140b: Recalcula lotes stuck em 'ativo' (one-time, idempotente na prática)
    "1140_recalcular_lotes_stuck_70_porcento.sql",

    # 1141: Atualiza view v_solicitacoes_emissao com link_disponibilizado_em
    "1141_add_link_disponibilizado_em_to_view.sql",

    # 1142: Fix fn_next_lote_id() retornando NULL quando lote_id_allocator vazia
    "1142_fix_fn_next_lote_id_null_guard.sql",

    # 1143: Drop FK liberado_por → entidades_senhas(cpf) (causa violation para RH)
    "1143_drop_liberado_por_fkey.sql"
)

Write-Host "Total de migrations: $($migrations.Count)" -ForegroundColor Yellow
Write-Host ""

$success = 0
$failed = 0
$skipped = 0
$warnings = 0
$errors = @()
$warningList = @()

foreach ($migration in $migrations) {
    $filePath = Join-Path $MIGRATIONS_DIR $migration

    if (-not (Test-Path $filePath)) {
        Write-Host "  SKIP  $migration (arquivo nao encontrado)" -ForegroundColor DarkGray
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
        $hasError = $output | Where-Object { $_ -match "^ERROR:" }
        if ($hasError) {
            $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop" }
            if ($isAlreadyExists) {
                Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
                $warnings++
                $warningList += $migration
            } else {
                Write-Host " ERRO (exit=0)" -ForegroundColor Red
                $outputStr = ($output | Where-Object { $_ -match "ERROR:" }) -join " | "
                Write-Host "     $outputStr" -ForegroundColor DarkRed
                $failed++
                $errors += $migration
            }
        } else {
            Write-Host " OK" -ForegroundColor Green
            $success++
        }
    } else {
        $isAlreadyExists = $output | Where-Object { $_ -match "already exists|does not exist|duplicate key|could not create unique|cannot drop|violates" }
        if ($isAlreadyExists) {
            Write-Host " WARN (ja aplicada)" -ForegroundColor Yellow
            $warnings++
            $warningList += $migration
        } else {
            Write-Host " ERRO" -ForegroundColor Red
            $outputStr = ($output | Where-Object { $_ -match "ERROR:|psql:" }) -join " | "
            Write-Host "     $outputStr" -ForegroundColor DarkRed
            $failed++
            $errors += $migration
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
    Write-Host "  Warnings (ja aplicadas, OK):" -ForegroundColor Yellow
    $warningList | ForEach-Object { Write-Host "    - $_" -ForegroundColor DarkYellow }
}

if ($errors.Count -gt 0) {
    Write-Host ""
    Write-Host "  Migrations com ERRO (requer atencao):" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
}

Write-Host ""

# ====================================================================
# VERIFICAÇÃO PÓS-APPLY
# ====================================================================
if ($failed -eq 0 -and -not $DryRun) {
    Write-Host "STAGING ATUALIZADO! Migrations 1137-1143 aplicadas." -ForegroundColor Green
    Write-Host ""
    Write-Host "Executando verificacoes pos-apply..." -ForegroundColor Cyan
    Write-Host ""

    # Verificar migrations registradas
    Write-Host "  [1/8] Ultimas migrations registradas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 15;" 2>&1

    # Verificar coluna usuario_tipo
    Write-Host "  [2/8] Coluna usuario_tipo em funcionarios:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='funcionarios' AND column_name='usuario_tipo';" 2>&1

    # Verificar link_disponibilizado_em na view
    Write-Host "  [3/8] Coluna link_disponibilizado_em em v_solicitacoes_emissao:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='v_solicitacoes_emissao' AND column_name='link_disponibilizado_em';" 2>&1

    # Verificar data_liberacao_login removida
    Write-Host "  [4/8] data_liberacao_login removida de entidades (deve retornar 0 rows):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='entidades' AND column_name='data_liberacao_login';" 2>&1

    # Verificar views existem
    Write-Host "  [5/8] Views criticas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao','v_relatorio_emissoes') ORDER BY table_name;" 2>&1

    # Verificar funções existem
    Write-Host "  [6/8] Funcoes criticas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT proname FROM pg_proc WHERE proname IN ('fn_recalcular_status_lote_on_avaliacao_update','validar_lote_pre_laudo','calcular_valor_total_lote','pode_acessar_tomador','fn_next_lote_id') ORDER BY proname;" 2>&1

    # Verificar fn_next_lote_id (1142)
    Write-Host "  [7/8] fn_next_lote_id existe:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT proname FROM pg_proc WHERE proname='fn_next_lote_id';" 2>&1

    # Verificar FK liberado_por removida (1143)
    Write-Host "  [8/8] FK liberado_por removida (deve retornar 0 rows):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name='lotes_avaliacao' AND constraint_name LIKE '%liberado_por%';" 2>&1

    Write-Host ""
} elseif ($DryRun) {
    Write-Host "Dry-run concluido. Nenhuma migration foi aplicada." -ForegroundColor Yellow
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima. Warnings sao normais (idempotentes)." -ForegroundColor Yellow
}

Write-Host ""

# Limpar variável de ambiente
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
