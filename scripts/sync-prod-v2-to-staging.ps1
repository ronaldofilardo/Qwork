# ====================================================================
# SYNC neondb_v2 (PROD) → neondb_staging — Phase 3
# Data: 24/04/2026
# Branch: feature/v2
# ====================================================================
# Copia dados reais do PROD (neondb_v2) para neondb_staging.
# PRÉ-REQUISITO: apply-migrations-staging-v8.ps1 já executado com sucesso.
#
# ABORDAGEM:
#   - Detecção dinâmica de colunas comuns (evita incompatibilidade de schema)
#   - Import em ordem hierárquica (respeita FKs)
#   - Casos especiais: funcionarios (ultima_avaliacao_id=NULL), resultados
#     (trigger disable), laudos (pre-truncate), leads_representante
#     (valor_negociado default)
#   - Colunas novas no staging (1200-1203) ficam com DEFAULT (correto)
#   - Reset sequences automático no final
#   - schema_migrations do staging preservado (contém 1146-1203)
#
# SEGURANÇA: neondb_v2 NÃO é modificado. Apenas neondb_staging é alterado.
#
# Pré-requisito:
#   - psql no PATH
#   - NEON_PROD_PASSWORD: senha de neondb_v2 (source)
#   - NEON_STAGING_PASSWORD: senha de neondb_staging (target)
#   (Ambas são o mesmo valor se compartilham o owner no mesmo projeto Neon)
#
# Uso:
#   $env:NEON_PROD_PASSWORD    = 'senha_prod'
#   $env:NEON_STAGING_PASSWORD = 'senha_staging'
#   .\scripts\sync-prod-v2-to-staging.ps1 -DryRun   # verificar antes
#   .\scripts\sync-prod-v2-to-staging.ps1           # executar
# ====================================================================

param([switch]$DryRun)

# Garantir que pipe para processos externos use UTF-8 (evita corrupção de chars multi-byte)
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$PROD_CONN    = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&sslcertmode=allow"
$STAGING_CONN = "postgresql://neondb_owner:$($env:NEON_STAGING_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow"
$TIMESTAMP    = (Get-Date -Format "yyyyMMdd_HHmmss")
$DUMPS        = "C:\apps\QWork\backups\sync_dumps_$TIMESTAMP"

if (-not $env:NEON_PROD_PASSWORD) {
    Write-Host "ERRO: NEON_PROD_PASSWORD nao definida" -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_PROD_PASSWORD = 'senha'" -ForegroundColor Yellow
    exit 1
}
if (-not $env:NEON_STAGING_PASSWORD) {
    Write-Host "AVISO: NEON_STAGING_PASSWORD nao definida — usando NEON_PROD_PASSWORD como fallback" -ForegroundColor Yellow
    $env:NEON_STAGING_PASSWORD = $env:NEON_PROD_PASSWORD
    $STAGING_CONN = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow"
}

$env:PGSSLMODE     = "require"
$env:PGSSLCERTMODE = "allow"

$ok = 0; $skip = 0; $err = 0; $errors = @()

# ====================================================================
# HELPER: obtém colunas comuns entre neondb_v2 (source) e neondb_staging
#         Exclui colunas GENERATED ALWAYS do target
# ====================================================================
function GetCommonCols($table) {
    $prodCols = psql $PROD_CONN -t -c "
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='$table' AND table_schema='public'
        ORDER BY ordinal_position
    " 2>&1
    $stagCols = psql $STAGING_CONN -t -c "
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name='$table' AND table_schema='public' AND is_generated='NEVER'
        ORDER BY ordinal_position
    " 2>&1

    $prodSet = @($prodCols | Where-Object { $_ -is [string] -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
    $stagSet = @($stagCols | Where-Object { $_ -is [string] -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })

    # Interseção: colunas que existem em AMBOS, na ordem do source (prod)
    $common = $prodSet | Where-Object { $stagSet -contains $_ }
    return $common -join ", "
}

# ====================================================================
# HELPER: prepara staging para import (sem superuser)
#   1. Drop dinâmico de CHECK constraints (incompatíveis com dados PROD)
#   2. DISABLE TRIGGER ALL (desativa FK triggers — table owner pode fazer)
#   3. Widening de VARCHAR estreitas para TEXT (evita truncation errors)
# ====================================================================
function Prepare-StagingForImport {
    Write-Host "Preparando staging para import (constraints, triggers, VARCHARs)..." -ForegroundColor Yellow

    # 1. Drop CHECK constraints dinamicamente
    psql $STAGING_CONN -c @'
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I',
                       r.table_name, r.constraint_name);
    END LOOP;
END; $$;
'@ 2>&1 | Out-Null

    # 2. Disable triggers em todas as tabelas (desativa FKs — owner pode fazer)
    psql $STAGING_CONN -c @'
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I DISABLE TRIGGER ALL', r.tablename);
    END LOOP;
END; $$;
'@ 2>&1 | Out-Null

    # 3. Widen VARCHAR estreitas (<=100) para TEXT — evita 'value too long' errors
    #    Precisa dropar views dependentes primeiro (PostgreSQL não permite ALTER TYPE em colunas usadas por views)
    Write-Host "  Dropando views dependentes para widen VARCHARs..." -ForegroundColor DarkGray

    # Salvar DDLs das views antes de dropar
    $script:viewDefs = @{}
    $viewNames = psql $STAGING_CONN -t -c "SELECT viewname FROM pg_views WHERE schemaname='public' ORDER BY viewname;" 2>&1 |
        Where-Object { $_ -is [string] -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() }

    foreach ($vn in $viewNames) {
        $def = psql $STAGING_CONN -t -c "SELECT pg_get_viewdef('$vn', true);" 2>&1 | Out-String
        $script:viewDefs[$vn] = $def.Trim()
    }

    # Drop todas as views (CASCADE)
    foreach ($vn in $viewNames) {
        psql $STAGING_CONN -c "DROP VIEW IF EXISTS $vn CASCADE;" 2>&1 | Out-Null
    }

    # Agora widen sem bloqueio de views
    $widenResult = psql $STAGING_CONN -c @'
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND data_type = 'character varying'
        AND character_maximum_length IS NOT NULL
        AND character_maximum_length <= 100
        AND table_name NOT IN ('schema_migrations','_migration_issues','migration_guidelines')
    LOOP
        EXECUTE format('ALTER TABLE %I ALTER COLUMN %I TYPE TEXT',
                       r.table_name, r.column_name);
    END LOOP;
END; $$;
'@ 2>&1
    if ($widenResult -match "ERROR:") {
        Write-Host "  AVISO widen: $($widenResult | Where-Object { $_ -match 'ERROR:' } | Select-Object -First 1)" -ForegroundColor Yellow
    }

    # Recriar views
    foreach ($vn in $viewNames) {
        $def = $script:viewDefs[$vn]
        if ($def) {
            psql $STAGING_CONN -c "CREATE OR REPLACE VIEW $vn AS $def" 2>&1 | Out-Null
        }
    }

    Write-Host "  Staging preparado OK (CHECK dropped, triggers disabled, VARCHARs widened, views recriadas)" -ForegroundColor Green
}

# ====================================================================
# HELPER: restaura triggers após import (CHECK constraints ficam removidas —
#         staging pode ter dados que violam constraints de migrations 1204+)
# ====================================================================
function Restore-StagingAfterImport {
    Write-Host "Re-habilitando triggers em neondb_staging..." -ForegroundColor Yellow

    psql $STAGING_CONN -c @'
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE TRIGGER ALL', r.tablename);
    END LOOP;
END; $$;
'@ 2>&1 | Out-Null

    Write-Host "  Triggers re-habilitados OK" -ForegroundColor Green
    Write-Host "  NOTA: CHECK constraints foram removidas (staging tem dados de PROD pre-1204)" -ForegroundColor DarkGray
}

# ====================================================================
# HELPER PRINCIPAL: dump + import de uma tabela
# ====================================================================
function MigrateTable($table, $customDumpSql = $null, $customImportSql = $null) {
    Write-Host "  $table..." -ForegroundColor Cyan -NoNewline

    if ($DryRun) { Write-Host " DRY-RUN" -ForegroundColor Yellow; return }

    $dumpFile = "$DUMPS\data_$table.csv"

    # ---- DUMP ----
    if (-not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -lt 5) {
        if ($customDumpSql) {
            psql $PROD_CONN -c $customDumpSql > $dumpFile 2>&1
        } else {
            $cols = GetCommonCols $table
            if (-not $cols) {
                Write-Host " SKIP (sem colunas comuns ou tabela nao existe no source)" -ForegroundColor Yellow
                $script:skip++; return
            }
            psql $PROD_CONN -c "COPY (SELECT $cols FROM $table) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
        }
        if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dumpFile) -or (Get-Item $dumpFile -ErrorAction SilentlyContinue).Length -lt 5) {
            $firstLine = Get-Content $dumpFile -ErrorAction SilentlyContinue | Select-Object -First 1
            Write-Host " SKIP DUMP — $firstLine" -ForegroundColor Yellow
            $script:skip++; return
        }
    }

    $sz = (Get-Item $dumpFile).Length

    # ---- IMPORT ----
    # SET session context + forçar UTF-8 para preservar multi-byte chars do CSV
    $setCtx = "SET client_encoding='UTF8'; SET app.current_user_cpf = '00000000000'; SET app.current_user_perfil = 'admin';"

    if ($customImportSql) {
        $result = Get-Content $dumpFile -Encoding UTF8 | psql $STAGING_CONN -c $setCtx -c $customImportSql 2>&1
    } else {
        $stagCols = GetCommonCols $table
        $result = Get-Content $dumpFile -Encoding UTF8 | psql $STAGING_CONN -c $setCtx -c "COPY $table ($stagCols) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    }

    $importExit = $LASTEXITCODE
    $fkErrors = $result | Where-Object { $_ -match "ERROR:" -and $_ -notmatch "permission denied to set parameter" }

    if ($fkErrors) {
        Write-Host " ERRO: $($fkErrors | Select-Object -First 1)" -ForegroundColor Red
        $script:err++; $script:errors += $table
    } elseif ($importExit -eq 0) {
        $rows = ($result | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -Last 1)
        Write-Host " OK ($rows rows, $sz bytes)" -ForegroundColor Green
        $script:ok++
    } else {
        # exit≠0 mas sem ERROR (pode ser permission denied em SET param — inofensivo)
        $hasSetError = $result | Where-Object { $_ -match "permission denied to set parameter" }
        if ($hasSetError) {
            $rows = ($result | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -Last 1)
            Write-Host " OK (SET param warn, $rows rows, $sz bytes)" -ForegroundColor Green
            $script:ok++
        } else {
            Write-Host " WARN exit=$importExit" -ForegroundColor Yellow
            $script:skip++
        }
    }
}

# ====================================================================
# INÍCIO
# ====================================================================
Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  SYNC PROD → STAGING (neondb_v2 → neondb_staging)" -ForegroundColor Cyan
Write-Host "  Source : neondb_v2   @ ep-divine-sky-acuderi7-pooler" -ForegroundColor Gray
Write-Host "  Target : neondb_staging @ ep-divine-sky-acuderi7-pooler" -ForegroundColor Gray
Write-Host "  Dumps  : $DUMPS" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN -- Nenhum dado sera modificado" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# VERIFICAÇÃO PRÉ-SYNC: confirmar que staging tem migration 1203
# ====================================================================
if (-not $DryRun) {
    Write-Host "Verificando pre-requisitos..." -ForegroundColor Gray
    $maxMigration = psql $STAGING_CONN -t -c "SELECT MAX(version) FROM schema_migrations WHERE version < 9000;" 2>&1
    $maxMigration = ($maxMigration | Where-Object { $_ -match "\d+" } | ForEach-Object { $_.Trim() } | Select-Object -First 1)
    Write-Host "  Max migration em neondb_staging: $maxMigration" -ForegroundColor Gray
    if ([int]$maxMigration -lt 1203) {
        Write-Host ""
        Write-Host "ERRO: neondb_staging esta na migration $maxMigration, esperado >= 1203" -ForegroundColor Red
        Write-Host "Execute primeiro: .\scripts\apply-migrations-staging-v8.ps1" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "  Pre-requisito OK ($maxMigration >= 1203)" -ForegroundColor Green
    Write-Host ""

    # Criar dir de dumps
    New-Item -ItemType Directory -Path $DUMPS -Force | Out-Null
    Write-Host "  Dumps dir: $DUMPS" -ForegroundColor DarkGray
    Write-Host ""
}

# ====================================================================
# PREPARAR STAGING (drop CHECK constraints, disable triggers, widen VARCHARs)
# ====================================================================
if (-not $DryRun) {
    Prepare-StagingForImport
    Write-Host ""
}

# ====================================================================
# TRUNCAR (staging — ordem inversa para evitar FK violations)
# ====================================================================
Write-Host "TRUNCANDO neondb_staging (exceto schema_migrations e metadados)..." -ForegroundColor Magenta
if (-not $DryRun) {
    $truncResult = psql $STAGING_CONN -c @'
DO $$ BEGIN
  EXECUTE (
    SELECT 'TRUNCATE TABLE ' || string_agg(quote_ident(tablename), ', ') || ' RESTART IDENTITY CASCADE'
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT IN (
      'schema_migrations', '_migration_issues', 'migration_guidelines',
      'policy_expression_backups', 'fk_migration_audit'
    )
  );
END $$;
'@ 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }
    else { Write-Host "  WARN: $($truncResult | Select-Object -First 1)" -ForegroundColor Yellow }
}
Write-Host ""

# ====================================================================
# IMPORTAR — ordem hierárquica (respeita FKs)
# ====================================================================
Write-Host "IMPORTANDO (ordem hierarquica):" -ForegroundColor Magenta
Write-Host ""

Write-Host "  [L0] Raiz (sem FKs):" -ForegroundColor Yellow
MigrateTable "roles"
MigrateTable "permissions"
MigrateTable "role_permissions"
MigrateTable "notificacoes_traducoes"
# templates_contrato: filtrar tipo_template valido no staging (padrao/lote)
$tplCols = GetCommonCols "templates_contrato"
if ($tplCols -and -not $DryRun) {
    MigrateTable "templates_contrato" `
        "COPY (SELECT $tplCols FROM templates_contrato WHERE tipo_template IN ('padrao', 'lote')) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY templates_contrato ($tplCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "templates_contrato"
}
MigrateTable "relatorio_templates"
MigrateTable "representantes"

Write-Host ""
Write-Host "  [L1] Entidades / Clinicas / Empresas:" -ForegroundColor Yellow
# entidades: coluna dinamica (neondb_v2 pode ou nao ter colunas de 1200)
$entCols = GetCommonCols "entidades"
if ($entCols -and -not $DryRun) {
    MigrateTable "entidades" `
        "COPY (SELECT $entCols FROM entidades) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY entidades ($entCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "entidades"
}

$clinCols = GetCommonCols "clinicas"
if ($clinCols -and -not $DryRun) {
    MigrateTable "clinicas" `
        "COPY (SELECT $clinCols FROM clinicas) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY clinicas ($clinCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "clinicas"
}

$empCols = GetCommonCols "empresas_clientes"
if ($empCols -and -not $DryRun) {
    MigrateTable "empresas_clientes" `
        "COPY (SELECT $empCols FROM empresas_clientes) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY empresas_clientes ($empCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "empresas_clientes"
}

Write-Host ""
Write-Host "  [L2] Dependentes de clinicas/entidades:" -ForegroundColor Yellow

# funcionarios: ultima_avaliacao_id DEVE ser NULL durante import (FK circular com avaliacoes)
# usuario_tipo: se existir em neondb_v2 (esperado), é copiado normalmente;
#               se não existir, o GetCommonCols não inclui e a coluna fica com DEFAULT
$funcCols = GetCommonCols "funcionarios"
if ($funcCols -and -not $DryRun) {
    # Substituir ultima_avaliacao_id por NULL no SELECT para evitar FK circular
    $funcColsArray = $funcCols -split ", "
    $funcSelectCols = $funcColsArray | ForEach-Object {
        if ($_ -eq "ultima_avaliacao_id") { "NULL::integer AS ultima_avaliacao_id" }
        elseif ($_ -eq "ultima_avaliacao_data_conclusao") { "NULL::timestamp AS ultima_avaliacao_data_conclusao" }
        elseif ($_ -eq "ultima_avaliacao_status") { "NULL::text AS ultima_avaliacao_status" }
        else { "f.$_" }
    }
    $funcSelectStr = $funcSelectCols -join ", "
    MigrateTable "funcionarios" `
        "COPY (SELECT $funcSelectStr FROM funcionarios f) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY funcionarios ($funcCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "funcionarios"
}

MigrateTable "clinicas_senhas"
MigrateTable "entidades_senhas"
MigrateTable "usuarios"
MigrateTable "aceites_termos_entidade"
MigrateTable "lote_id_allocator"
MigrateTable "comissionamento_auditoria"

# leads_representante: valor_negociado pode ser NOT NULL em staging (default 0)
# Se não existir no source, o default cobre. Se existir, copia normalmente.
Write-Host "  leads_representante (valor_negociado fix)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    # Temporariamente define DEFAULT 0 para linhas sem valor
    psql $STAGING_CONN -c "ALTER TABLE leads_representante ALTER COLUMN valor_negociado SET DEFAULT 0;" 2>&1 | Out-Null
    $lrCols = GetCommonCols "leads_representante"
    $dumpFile = "$DUMPS\data_leads_representante.csv"
    if ($lrCols) {
        psql $PROD_CONN -c "COPY (SELECT $lrCols FROM leads_representante) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
        $r = Get-Content $dumpFile -Encoding UTF8 | psql $STAGING_CONN -c "SET client_encoding='UTF8'; SET app.current_user_cpf = '00000000000'; SET app.current_user_perfil = 'admin';" -c "COPY leads_representante ($lrCols) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    }
    psql $STAGING_CONN -c "ALTER TABLE leads_representante ALTER COLUMN valor_negociado DROP DEFAULT;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0 -or ($r | Select-String "COPY \d+")) {
        $rows = ($r | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -Last 1)
        Write-Host " OK ($rows rows)" -ForegroundColor Green; $ok++
    } else {
        Write-Host " ERRO: $($r | Select-Object -First 1)" -ForegroundColor Red; $err++; $errors += "leads_representante"
    }
} else {
    Write-Host " DRY-RUN" -ForegroundColor Yellow
}

MigrateTable "vinculos_comissao"

# contratos: colunas dinamicas (plano_id/valor_personalizado já removidas em neondb_v2)
$contCols = GetCommonCols "contratos"
if ($contCols -and -not $DryRun) {
    MigrateTable "contratos" `
        "COPY (SELECT $contCols FROM contratos) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY contratos ($contCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "contratos"
}

Write-Host ""
Write-Host "  [L3] Dependentes de funcionarios/empresas:" -ForegroundColor Yellow
MigrateTable "funcionarios_clinicas"
MigrateTable "funcionarios_entidades"

# pagamentos: colunas dinamicas (tipo_cobranca/empresa_id/link_pagamento_token podem nao existir no source)
$pagCols = GetCommonCols "pagamentos"
if ($pagCols -and -not $DryRun) {
    MigrateTable "pagamentos" `
        "COPY (SELECT $pagCols FROM pagamentos) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY pagamentos ($pagCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "pagamentos"
}

MigrateTable "notificacoes"
MigrateTable "notificacoes_admin"
MigrateTable "session_logs"
MigrateTable "aceites_termos_usuario"
MigrateTable "mfa_codes"

# lotes_avaliacao: coluna dinamica
$loteCols = GetCommonCols "lotes_avaliacao"
if ($loteCols -and -not $DryRun) {
    MigrateTable "lotes_avaliacao" `
        "COPY (SELECT $loteCols FROM lotes_avaliacao) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY lotes_avaliacao ($loteCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
} elseif ($DryRun) {
    MigrateTable "lotes_avaliacao"
}

Write-Host ""
Write-Host "  [L4] Dependentes de lotes/avaliacoes:" -ForegroundColor Yellow

# laudos: trigger em lotes_avaliacao auto-cria laudos ao inserir → truncar antes de importar laudos
if (-not $DryRun) {
    psql $STAGING_CONN -c "TRUNCATE TABLE laudos RESTART IDENTITY CASCADE;" 2>&1 | Out-Null
    Write-Host "  laudos pre-truncated (trigger cleanup)" -ForegroundColor DarkGray
}

MigrateTable "avaliacoes"
MigrateTable "respostas"

# laudos: excluir órfãos (lote_id não existe em lotes_avaliacao — dado inválido em PROD)
$laudosCols = GetCommonCols "laudos"
MigrateTable "laudos" `
    "COPY (SELECT $laudosCols FROM laudos WHERE lote_id IN (SELECT id FROM lotes_avaliacao)) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY laudos ($laudosCols) FROM STDIN WITH (FORMAT csv, HEADER true)"

# resultados: trigger 'trigger_resultado_immutability' bloqueia INSERT para avaliacoes concluidas
# Precisa DISABLE/ENABLE como owner (funciona sem superuser)
Write-Host "  resultados (disable trigger imutabilidade)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    psql $STAGING_CONN -c "ALTER TABLE resultados DISABLE TRIGGER trigger_resultado_immutability;" 2>&1 | Out-Null
    $resCols = GetCommonCols "resultados"
    $dumpFile = "$DUMPS\data_resultados.csv"
    if ($resCols) {
        psql $PROD_CONN -c "COPY (SELECT $resCols FROM resultados) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
        $r = Get-Content $dumpFile -Encoding UTF8 | psql $STAGING_CONN -c "SET client_encoding='UTF8';" -c "COPY resultados ($resCols) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    }
    psql $STAGING_CONN -c "ALTER TABLE resultados ENABLE TRIGGER trigger_resultado_immutability;" 2>&1 | Out-Null
    $fkErr = $r | Where-Object { $_ -match "ERROR:" }
    if ($fkErr) {
        Write-Host " ERRO: $($fkErr | Select-Object -First 1)" -ForegroundColor Red
        $err++; $errors += "resultados"
    } else {
        $rows = ($r | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -Last 1)
        Write-Host " OK ($rows rows)" -ForegroundColor Green; $ok++
    }
} else {
    Write-Host " DRY-RUN" -ForegroundColor Yellow
}

MigrateTable "avaliacao_resets"
MigrateTable "comissoes_laudo"
MigrateTable "recibos"
MigrateTable "laudo_arquivos_remotos"
MigrateTable "laudo_downloads"
MigrateTable "laudo_generation_jobs"
MigrateTable "pdf_jobs"
MigrateTable "webhook_logs"
MigrateTable "logs_admin"
MigrateTable "tokens_retomada_pagamento"
MigrateTable "questao_condicoes"
MigrateTable "representantes_cadastro_leads"
MigrateTable "creditos_manutencao"          # tabela nova 1200, pode estar vazia no source
MigrateTable "audit_delecoes_tomador"        # tabela nova 1202, pode estar vazia no source
MigrateTable "rate_limit_entries"            # tabela nova 1147, tipicamente vazia em prod

Write-Host ""
Write-Host "  [Audit] Auditoria (dados recentes apenas — 30 dias):" -ForegroundColor Yellow
foreach ($tbl in @("auditoria","auditoria_geral","auditoria_laudos","auditoria_recibos")) {
    $cols = GetCommonCols $tbl
    if ($cols -and -not $DryRun) {
        $dumpFile = "$DUMPS\data_audit_$tbl.csv"
        psql $PROD_CONN -c "COPY (SELECT $cols FROM $tbl WHERE criado_em >= NOW() - INTERVAL '30 days') TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
        if ((Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -ge 5) {
            $r = Get-Content $dumpFile -Encoding UTF8 | psql $STAGING_CONN -c "SET client_encoding='UTF8';" -c "COPY $tbl ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
            $rows = ($r | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -Last 1)
            Write-Host "  $tbl... OK ($rows rows)" -ForegroundColor Green; $ok++
        } else {
            Write-Host "  $tbl... SKIP (vazia ou sem dados recentes)" -ForegroundColor DarkGray; $skip++
        }
    } elseif ($DryRun) {
        Write-Host "  $tbl... DRY-RUN" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Resultado Import: OK=$ok  SKIP=$skip  ERRO=$err" -ForegroundColor White
if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Host "  FALHOU: $_" -ForegroundColor Red }
    Write-Host ""
    Write-Host "ATENCAO: Erros acima requerem investigacao antes de prosseguir." -ForegroundColor Red
}
Write-Host ""

if ($err -gt 0) {
    Write-Host "ABORTANDO sequences reset e schema_migrations copy devido a erros." -ForegroundColor Red
    exit 1
}

# ====================================================================
# RESETAR SEQUENCES (baseado em MAX(id) de cada tabela)
# ====================================================================
Write-Host "RESETANDO SEQUENCES em neondb_staging..." -ForegroundColor Magenta
if (-not $DryRun) {
    psql $STAGING_CONN -c @'
DO $$
DECLARE
    r        RECORD;
    max_val  BIGINT;
    seq_name TEXT;
BEGIN
    FOR r IN
        SELECT s.sequence_schema, s.sequence_name, c.table_name, c.column_name
        FROM information_schema.sequences s
        JOIN information_schema.columns c
            ON c.column_default LIKE '%' || s.sequence_name || '%'
            AND c.table_schema = 'public'
        WHERE s.sequence_schema = 'public'
    LOOP
        seq_name := r.sequence_schema || '.' || r.sequence_name;
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_val;
        IF max_val > 0 THEN
            EXECUTE format('SELECT setval(%L, %s)', seq_name, max_val);
        END IF;
    END LOOP;
END;
$$;
'@ 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }
    else { Write-Host "  WARN — sequences podem precisar de ajuste manual" -ForegroundColor Yellow }
}
Write-Host ""

# ====================================================================
# RESTAURAR TRIGGERS (re-habilita FKs após import)
# ====================================================================
if (-not $DryRun) {
    Restore-StagingAfterImport
    Write-Host ""
}

# ====================================================================
# PRESERVAR schema_migrations DO STAGING (não sobrescrever — já tem 1146-1203)
# ====================================================================
Write-Host "Verificando schema_migrations em neondb_staging (nao sobrescreve)..." -ForegroundColor Magenta
if (-not $DryRun) {
    $stgMax = psql $STAGING_CONN -t -c "SELECT MAX(version) FROM schema_migrations WHERE version < 9000;" 2>&1
    $stgMax = ($stgMax | Where-Object { $_ -match "\d+" } | ForEach-Object { $_.Trim() } | Select-Object -First 1)
    Write-Host "  Max migration em neondb_staging: $stgMax" -ForegroundColor Gray

    if ([int]$stgMax -lt 1203) {
        Write-Host "  AVISO: Max migration $stgMax < 1203 — execute apply-migrations-staging-v8.ps1 novamente" -ForegroundColor Yellow
    } else {
        Write-Host "  OK ($stgMax >= 1203)" -ForegroundColor Green
    }
}
Write-Host ""

# ====================================================================
# VERIFICAÇÃO FINAL
# ====================================================================
Write-Host "VERIFICACAO FINAL — row counts:" -ForegroundColor Magenta
if (-not $DryRun) {
    Write-Host ""
    Write-Host "  neondb_v2 (PROD):" -ForegroundColor Gray
    psql $PROD_CONN -c "
        SELECT 'clinicas'            AS tabela, count(*) FROM clinicas        UNION ALL
        SELECT 'entidades',           count(*) FROM entidades                 UNION ALL
        SELECT 'empresas_clientes',   count(*) FROM empresas_clientes         UNION ALL
        SELECT 'funcionarios',        count(*) FROM funcionarios              UNION ALL
        SELECT 'lotes_avaliacao',     count(*) FROM lotes_avaliacao           UNION ALL
        SELECT 'avaliacoes',          count(*) FROM avaliacoes                UNION ALL
        SELECT 'laudos',              count(*) FROM laudos                    UNION ALL
        SELECT 'contratos',           count(*) FROM contratos                 UNION ALL
        SELECT 'pagamentos',          count(*) FROM pagamentos                UNION ALL
        SELECT 'usuarios',            count(*) FROM usuarios
        ORDER BY 1;
    " 2>&1

    Write-Host ""
    Write-Host "  neondb_staging (TARGET):" -ForegroundColor Gray
    psql $STAGING_CONN -c "
        SELECT 'clinicas'            AS tabela, count(*) FROM clinicas        UNION ALL
        SELECT 'entidades',           count(*) FROM entidades                 UNION ALL
        SELECT 'empresas_clientes',   count(*) FROM empresas_clientes         UNION ALL
        SELECT 'funcionarios',        count(*) FROM funcionarios              UNION ALL
        SELECT 'lotes_avaliacao',     count(*) FROM lotes_avaliacao           UNION ALL
        SELECT 'avaliacoes',          count(*) FROM avaliacoes                UNION ALL
        SELECT 'laudos',              count(*) FROM laudos                    UNION ALL
        SELECT 'contratos',           count(*) FROM contratos                 UNION ALL
        SELECT 'pagamentos',          count(*) FROM pagamentos                UNION ALL
        SELECT 'usuarios',            count(*) FROM usuarios
        ORDER BY 1;
    " 2>&1
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
if ($err -eq 0) {
    Write-Host "  SYNC CONCLUIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "  neondb_staging agora tem dados reais de neondb_v2 (PROD)" -ForegroundColor Gray
    Write-Host "  Schema: migration 1203 (feature/v2 completo)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  Proximo passo: execute verify-staging-sync.sql para validacao completa:" -ForegroundColor Yellow
    Write-Host "  psql STAGING_CONN -f scripts/verify-staging-sync.sql" -ForegroundColor DarkYellow
} else {
    Write-Host "  SYNC CONCLUIDO COM $err ERROS — revise acima" -ForegroundColor Red
}
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""
exit 0
