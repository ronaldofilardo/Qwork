# ====================================================================
# APLICAR MIGRATIONS v5 NO BANCO STAGING — INCREMENTAL (1137-1141)
# Data: 05/04/2026
# Branch: feature/v2
# Target: neondb_staging (Neon)
# ====================================================================
# Este script aplica as 7 migrations pendentes após v4 (1134-1136).
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
# ====================================================================

param(
    [switch]$DryRun  # Modo dry-run: apenas lista, não aplica
)

$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$NEON_DB = "neondb_staging"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

# Ler senha de variável de ambiente ou usar fallback
if ($env:NEON_STAGING_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_STAGING_PASSWORD
} else {
    $env:PGPASSWORD = "REDACTED_NEON_PASSWORD"
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC INCREMENTAL STAGING v5 — Migrations 1137-1141" -ForegroundColor Cyan
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
    "1137b_laudos_storage_protection.sql",

    # 1137b: Remover colunas legacy pagamento_confirmado e data_liberacao_login
    #   - Drop colunas de entidades e clinicas
    #   - Recria views tomadores e v_relatorio_emissoes
    "1137a_remover_colunas_pagamento_cadastro.sql",

    # 1138: Cleanup final do sistema de planos (idempotente)
    #   - Drop tables, enums, views legadas
    #   - Recria views tomadores e v_relatorio_emissoes
    "1138_cleanup_final_planos_system.sql",

    # 1139: Fix NOT NULL constraints + adiciona usuario_tipo em funcionarios
    #   - Adiciona coluna usuario_tipo (enum) com defaults inferidos
    #   - Corrige constraints NULL em clinicas, entidades, empresas_clientes
    #   - Corrige constraints NULL em lotes_avaliacao, avaliacoes
    "1139a_fix_not_null_constraints.sql",

    # 1140a: Corrige sequência seq_vendedor_codigo (evita colisão)
    "1140a_fix_seq_vendedor_codigo_duplicatas.sql",

    # 1140b: Recalcula lotes stuck em 'ativo' (one-time, idempotente na prática)
    #   - Reafirma trigger com fórmula correta (inclui inativadas)
    #   - Bulk UPDATE de lotes que deveriam estar 'concluido'
    "1140b_recalcular_lotes_stuck_70_porcento.sql",

    # 1141: Atualiza view v_solicitacoes_emissao com link_disponibilizado_em
    #   - Coluna adicionada na tabela em 1131, mas view estava desatualizada
    "1141_add_link_disponibilizado_em_to_view.sql"
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
    Write-Host "STAGING ATUALIZADO! Migrations 1137-1141 aplicadas." -ForegroundColor Green
    Write-Host ""
    Write-Host "Executando verificacoes pos-apply..." -ForegroundColor Cyan
    Write-Host ""

    # Verificar migrations registradas
    Write-Host "  [1/6] Ultimas migrations registradas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 15;" 2>&1

    # Verificar coluna usuario_tipo
    Write-Host "  [2/6] Coluna usuario_tipo em funcionarios:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='funcionarios' AND column_name='usuario_tipo';" 2>&1

    # Verificar link_disponibilizado_em na view
    Write-Host "  [3/6] Coluna link_disponibilizado_em em v_solicitacoes_emissao:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='v_solicitacoes_emissao' AND column_name='link_disponibilizado_em';" 2>&1

    # Verificar data_liberacao_login removida
    Write-Host "  [4/6] data_liberacao_login removida de entidades (deve retornar 0 rows):" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT column_name FROM information_schema.columns WHERE table_name='entidades' AND column_name='data_liberacao_login';" 2>&1

    # Verificar views existem
    Write-Host "  [5/6] Views criticas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT table_name FROM information_schema.views WHERE table_schema='public' AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao','v_relatorio_emissoes') ORDER BY table_name;" 2>&1

    # Verificar funções existem
    Write-Host "  [6/6] Funcoes criticas:" -ForegroundColor Gray
    psql -h $NEON_HOST -U $NEON_USER -d $NEON_DB -c "SELECT proname FROM pg_proc WHERE proname IN ('fn_recalcular_status_lote_on_avaliacao_update','validar_lote_pre_laudo','calcular_valor_total_lote','pode_acessar_tomador') ORDER BY proname;" 2>&1

    Write-Host ""
    Write-Host "URL: https://staging.qwork.app.br" -ForegroundColor Cyan
} elseif ($DryRun) {
    Write-Host "Dry-run concluido. Nenhuma migration foi aplicada." -ForegroundColor Yellow
} elseif ($failed -gt 0) {
    Write-Host "Verifique os erros acima. Warnings sao normais (idempotentes)." -ForegroundColor Yellow
}

Write-Host ""

# Limpar variável de ambiente
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
