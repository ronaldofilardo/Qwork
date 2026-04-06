# ====================================================================
# MIGRAR DADOS PROD (neondb) → NOVO BANCO (neondb_v2)
# Data: 05/04/2026
# Branch: feature/v2
# ====================================================================
# ESTRATÉGIA: Opção B — DB Novo + Migrar Dados
#   1. Backup do PROD atual
#   2. Dump schema do STAGING (já em 1143)
#   3. Criar neondb_v2 e aplicar schema
#   4. Exportar dados do PROD por tabela
#   5. Transformar e importar dados no neondb_v2
#   6. Resetar sequences
#   7. Popular schema_migrations
#   8. Verificação final
#
# PRÉ-REQUISITOS:
#   - STAGING em migration 1143 (executar apply-migrations-staging-v6.ps1 antes)
#   - psql e pg_dump disponíveis no PATH
#   - neondb_v2 criado no Neon Dashboard (mesmo projeto)
#   - Variáveis NEON_PROD_PASSWORD definida
#
# COLUNAS REMOVIDAS (PROD 1101 → STAGING 1143):
#   - clinicas: pagamento_confirmado, data_liberacao_login, plano_id
#   - entidades: pagamento_confirmado, data_liberacao_login, plano_id
#   - contratos: plano_id, valor_personalizado
#   - lotes_avaliacao: contratante_id
#
# TABELAS NÃO MIGRADAS (legacy):
#   - contratos_planos, payment_links, confirmacao_identidade
#   - _migration_issues, migration_guidelines, fk_migration_audit
#   - policy_expression_backups, schema_migrations (populada manualmente)
# ====================================================================

param(
    [switch]$DryRun,
    [switch]$SkipBackup,
    [switch]$SkipSchemaDump,
    [string]$TargetDb = "neondb_v2"
)

$ErrorActionPreference = "Stop"

# ====================================================================
# CONFIGURAÇÃO
# ====================================================================
$NEON_HOST = "ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech"
$NEON_POOLER = "ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech"
$NEON_USER = "neondb_owner"
$PROD_DB = "neondb"
$STAGING_DB = "neondb_staging"
$NEW_DB = $TargetDb
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$WORK_DIR = "C:\apps\QWork\backups\migration_$TIMESTAMP"
$MIGRATIONS_DIR = "C:\apps\QWork\database\migrations"

if ($env:NEON_PROD_PASSWORD) {
    $env:PGPASSWORD = $env:NEON_PROD_PASSWORD
} else {
    Write-Host "ERRO: Variavel de ambiente NEON_PROD_PASSWORD nao definida." -ForegroundColor Red
    Write-Host "  Defina com: `$env:NEON_PROD_PASSWORD = 'sua_senha'" -ForegroundColor Yellow
    exit 1
}

# Forçar SSL para Neon (psql 17: PGSSLCERTMODE=allow necessário pois Neon não solicita cert cliente)
$env:PGSSLMODE = "require"
$env:PGSSLCERTMODE = "allow"

# Criar diretório de trabalho
New-Item -ItemType Directory -Path $WORK_DIR -Force | Out-Null

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  MIGRAÇÃO PROD → $NEW_DB" -ForegroundColor Cyan
Write-Host "  Source: $PROD_DB (PROD, migration 1101)" -ForegroundColor Gray
Write-Host "  Schema: $STAGING_DB (STAGING, migration 1143)" -ForegroundColor Gray
Write-Host "  Target: $NEW_DB" -ForegroundColor Gray
Write-Host "  Work dir: $WORK_DIR" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

if ($DryRun) {
    Write-Host "MODO DRY-RUN — Nenhuma operacao destrutiva sera executada" -ForegroundColor Yellow
    Write-Host ""
}

# ====================================================================
# FASE 1: BACKUP DO PROD ATUAL
# ====================================================================
Write-Host "FASE 1: Backup do PROD atual" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

if ($SkipBackup) {
    Write-Host "  SKIP (flag -SkipBackup)" -ForegroundColor Yellow
} else {
    $backupFile = "$WORK_DIR\prod_backup_$TIMESTAMP.dump"
    $schemaFile = "$WORK_DIR\prod_schema_$TIMESTAMP.sql"
    $dataFile = "$WORK_DIR\prod_data_$TIMESTAMP.sql"

    Write-Host "  [1/3] Backup completo (formato custom)..." -ForegroundColor Cyan
    if (-not $DryRun) {
        pg_dump -h $NEON_HOST -U $NEON_USER -d $PROD_DB -F c -f $backupFile 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Falha no backup completo" }
        $size = [math]::Round((Get-Item $backupFile).Length / 1MB, 2)
        Write-Host "    OK ($size MB)" -ForegroundColor Green
    }

    Write-Host "  [2/3] Schema only..." -ForegroundColor Cyan
    if (-not $DryRun) {
        pg_dump -h $NEON_HOST -U $NEON_USER -d $PROD_DB --schema-only -f $schemaFile 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Host "    WARN: possivel problema" -ForegroundColor Yellow }
        else { Write-Host "    OK" -ForegroundColor Green }
    }

    Write-Host "  [3/3] Data only..." -ForegroundColor Cyan
    if (-not $DryRun) {
        pg_dump -h $NEON_HOST -U $NEON_USER -d $PROD_DB --data-only -f $dataFile 2>&1
        if ($LASTEXITCODE -ne 0) { Write-Host "    WARN: possivel problema" -ForegroundColor Yellow }
        else { Write-Host "    OK" -ForegroundColor Green }
    }
}
Write-Host ""

# ====================================================================
# FASE 2: DUMP SCHEMA DO STAGING
# ====================================================================
Write-Host "FASE 2: Dump schema do STAGING (migration 1143)" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

$stagingSchemaFile = "$WORK_DIR\staging_schema_1143.sql"

if ($SkipSchemaDump) {
    Write-Host "  SKIP (flag -SkipSchemaDump)" -ForegroundColor Yellow
} else {
    Write-Host "  Exportando schema de $STAGING_DB..." -ForegroundColor Cyan
    if (-not $DryRun) {
        pg_dump -h $NEON_POOLER -U $NEON_USER -d $STAGING_DB --schema-only -f $stagingSchemaFile 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Falha ao exportar schema do STAGING" }
        Write-Host "    OK" -ForegroundColor Green
    }
}
Write-Host ""

# ====================================================================
# FASE 3: APLICAR SCHEMA NO NOVO BANCO
# ====================================================================
Write-Host "FASE 3: Aplicar schema no $NEW_DB" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

Write-Host "  Aplicando schema do STAGING em $NEW_DB..." -ForegroundColor Cyan
if (-not $DryRun) {
    $output = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -f $stagingSchemaFile 2>&1
    $schemaErrors = $output | Where-Object { $_ -match "^ERROR:" -and $_ -notmatch "already exists" }
    if ($schemaErrors) {
        Write-Host "    WARN: Alguns erros ao aplicar schema (possivelmente existentes):" -ForegroundColor Yellow
        $schemaErrors | Select-Object -First 5 | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkYellow }
    } else {
        Write-Host "    OK" -ForegroundColor Green
    }

    # Verificação rápida
    $tableCount = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT count(*) FROM pg_tables WHERE schemaname='public';" 2>&1
    $tableCountStr = ($tableCount | Where-Object { $_ -is [string] } | Select-Object -First 1)?.Trim()
    Write-Host "    Tabelas criadas: $tableCountStr" -ForegroundColor Gray
}
Write-Host ""

# ====================================================================
# FASE 4: MIGRAR DADOS
# ====================================================================
Write-Host "FASE 4: Migrar dados do PROD → $NEW_DB" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

# --- Grupo A: Tabelas migração direta (sem mudanças de colunas) ---
$directTables = @(
    "funcionarios",
    "empresas_clientes",
    "avaliacoes",
    "respostas",
    "laudos",
    "usuarios",
    "pagamentos",
    "representantes",
    "vinculos_comissao",
    "comissoes_laudo",
    "leads_representante",
    "funcionarios_clinicas",
    "funcionarios_entidades",
    "avaliacao_resets",
    "fila_emissao",
    "clinicas_senhas",
    "entidades_senhas",
    "notificacoes",
    "notificacoes_admin",
    "tokens_retomada_pagamento",
    "aceites_termos_usuario",
    "aceites_termos_entidade",
    "analise_estatistica",
    "asaas_pagamentos",
    "clinica_configuracoes",
    "emissao_queue",
    "laudo_arquivos_remotos",
    "laudo_downloads",
    "laudo_generation_jobs",
    "logs_admin",
    "lote_id_allocator",
    "mfa_codes",
    "notificacoes_traducoes",
    "pdf_jobs",
    "permissions",
    "questao_condicoes",
    "recibos",
    "relatorio_templates",
    "representantes_cadastro_leads",
    "resultados",
    "role_permissions",
    "roles",
    "session_logs",
    "templates_contrato",
    "webhook_logs",
    "comissionamento_auditoria"
)

# --- Grupo A-Audit: Auditoria (últimos 5 dias) ---
$auditTables = @(
    "audit_logs",
    "auditoria",
    "auditoria_geral",
    "auditoria_laudos",
    "auditoria_recibos",
    "audit_access_denied"
)

# --- Grupo B: Tabelas com colunas removidas (SELECT explícito) ---
# Estes são tratados individualmente abaixo

# --- Grupo C: NÃO migrar ---
$skipTables = @(
    "contratos_planos",
    "payment_links",
    "confirmacao_identidade",
    "_migration_issues",
    "migration_guidelines",
    "fk_migration_audit",
    "policy_expression_backups",
    "schema_migrations",
    "clinicas_empresas"  # legacy view/table
)

$totalSuccess = 0
$totalSkip = 0
$totalError = 0
$errorTables = @()

# Desabilitar triggers durante import para evitar side-effects
Write-Host "  Desabilitando triggers no $NEW_DB..." -ForegroundColor Cyan
if (-not $DryRun) {
    psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c "SET session_replication_role = 'replica';" 2>&1 | Out-Null
}

# --- Grupo B: Tabelas com colunas a excluir ---
Write-Host ""
Write-Host "  [Grupo B] Tabelas com transformacao de colunas:" -ForegroundColor Yellow

# B1: clinicas (excluir pagamento_confirmado, data_liberacao_login, plano_id)
Write-Host "    clinicas (19 rows, excluindo pagamento_confirmado/data_liberacao_login/plano_id)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    $dumpFile = "$WORK_DIR\data_clinicas.sql"
    # Usar COPY via query SQL que exclui colunas dropped
    $query = @"
COPY (
  SELECT id, nome, cnpj, inscricao_estadual, email, telefone,
    endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf,
    responsavel_cargo, responsavel_email, responsavel_celular,
    cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
    status, motivo_rejeicao, observacoes_reanalise, ativa,
    criado_em, atualizado_em, aprovado_em, aprovado_por_cpf,
    numero_funcionarios_estimado, data_primeiro_pagamento,
    contrato_aceito, tipo, entidade_id,
    cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket,
    cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url,
    contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket,
    contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url,
    doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket,
    doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url
  FROM clinicas
) TO STDOUT WITH (FORMAT csv, HEADER true)
"@
    psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c $query > $dumpFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
        $importQuery = @"
COPY clinicas (id, nome, cnpj, inscricao_estadual, email, telefone,
  endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf,
  responsavel_cargo, responsavel_email, responsavel_celular,
  cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
  status, motivo_rejeicao, observacoes_reanalise, ativa,
  criado_em, atualizado_em, aprovado_em, aprovado_por_cpf,
  numero_funcionarios_estimado, data_primeiro_pagamento,
  contrato_aceito, tipo, entidade_id,
  cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket,
  cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url,
  contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket,
  contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url,
  doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket,
  doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url)
FROM STDIN WITH (FORMAT csv, HEADER true)
"@
        Get-Content $dumpFile | psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $importQuery 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green; $totalSuccess++ }
        else { Write-Host " ERRO" -ForegroundColor Red; $totalError++; $errorTables += "clinicas" }
    } else {
        Write-Host " SKIP (vazia ou erro)" -ForegroundColor Yellow; $totalSkip++
    }
}

# B2: entidades (excluir pagamento_confirmado, data_liberacao_login, plano_id)
Write-Host "    entidades (14 rows, excluindo pagamento_confirmado/data_liberacao_login/plano_id)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    $dumpFile = "$WORK_DIR\data_entidades.sql"
    $query = @"
COPY (
  SELECT id, nome, cnpj, inscricao_estadual, email, telefone,
    endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf,
    responsavel_cargo, responsavel_email, responsavel_celular,
    cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
    status, motivo_rejeicao, observacoes_reanalise, ativa,
    criado_em, atualizado_em, aprovado_em, aprovado_por_cpf,
    numero_funcionarios_estimado, data_primeiro_pagamento,
    contrato_aceito, tipo,
    cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket,
    cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url,
    contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket,
    contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url,
    doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket,
    doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url
  FROM entidades
) TO STDOUT WITH (FORMAT csv, HEADER true)
"@
    psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c $query > $dumpFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
        $importQuery = @"
COPY entidades (id, nome, cnpj, inscricao_estadual, email, telefone,
  endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf,
  responsavel_cargo, responsavel_email, responsavel_celular,
  cartao_cnpj_path, contrato_social_path, doc_identificacao_path,
  status, motivo_rejeicao, observacoes_reanalise, ativa,
  criado_em, atualizado_em, aprovado_em, aprovado_por_cpf,
  numero_funcionarios_estimado, data_primeiro_pagamento,
  contrato_aceito, tipo,
  cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket,
  cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url,
  contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket,
  contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url,
  doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket,
  doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url)
FROM STDIN WITH (FORMAT csv, HEADER true)
"@
        Get-Content $dumpFile | psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $importQuery 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green; $totalSuccess++ }
        else { Write-Host " ERRO" -ForegroundColor Red; $totalError++; $errorTables += "entidades" }
    } else {
        Write-Host " SKIP (vazia ou erro)" -ForegroundColor Yellow; $totalSkip++
    }
}

# B3: contratos (excluir plano_id, valor_personalizado)
Write-Host "    contratos (34 rows, excluindo plano_id/valor_personalizado)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    $dumpFile = "$WORK_DIR\data_contratos.sql"
    $query = @"
COPY (
  SELECT id, numero_funcionarios, valor_total, status, aceito,
    pagamento_confirmado, conteudo, criado_em, atualizado_em,
    aceito_em, ip_aceite, data_aceite, hash_contrato,
    conteudo_gerado, data_pagamento, criado_por_cpf,
    entidade_id, tomador_id, tipo_tomador
  FROM contratos
) TO STDOUT WITH (FORMAT csv, HEADER true)
"@
    psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c $query > $dumpFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
        $importQuery = @"
COPY contratos (id, numero_funcionarios, valor_total, status, aceito,
  pagamento_confirmado, conteudo, criado_em, atualizado_em,
  aceito_em, ip_aceite, data_aceite, hash_contrato,
  conteudo_gerado, data_pagamento, criado_por_cpf,
  entidade_id, tomador_id, tipo_tomador)
FROM STDIN WITH (FORMAT csv, HEADER true)
"@
        Get-Content $dumpFile | psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $importQuery 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green; $totalSuccess++ }
        else { Write-Host " ERRO" -ForegroundColor Red; $totalError++; $errorTables += "contratos" }
    } else {
        Write-Host " SKIP (vazia ou erro)" -ForegroundColor Yellow; $totalSkip++
    }
}

# B4: lotes_avaliacao (excluir contratante_id)
Write-Host "    lotes_avaliacao (56 rows, excluindo contratante_id)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    $dumpFile = "$WORK_DIR\data_lotes_avaliacao.sql"
    $query = @"
COPY (
  SELECT id, clinica_id, empresa_id, descricao, tipo, status,
    liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf,
    numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em,
    finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em,
    valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em,
    link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em
  FROM lotes_avaliacao
) TO STDOUT WITH (FORMAT csv, HEADER true)
"@
    psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c $query > $dumpFile 2>&1
    if ($LASTEXITCODE -eq 0 -and (Test-Path $dumpFile) -and (Get-Item $dumpFile).Length -gt 0) {
        $importQuery = @"
COPY lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status,
  liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf,
  numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em,
  finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em,
  valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em,
  link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em)
FROM STDIN WITH (FORMAT csv, HEADER true)
"@
        Get-Content $dumpFile | psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $importQuery 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green; $totalSuccess++ }
        else { Write-Host " ERRO" -ForegroundColor Red; $totalError++; $errorTables += "lotes_avaliacao" }
    } else {
        Write-Host " SKIP (vazia ou erro)" -ForegroundColor Yellow; $totalSkip++
    }
}

# --- Grupo A: Tabelas diretas ---
Write-Host ""
Write-Host "  [Grupo A] Tabelas migracao direta:" -ForegroundColor Yellow

foreach ($table in $directTables) {
    Write-Host "    $table..." -ForegroundColor Cyan -NoNewline

    if ($DryRun) {
        Write-Host " DRY-RUN" -ForegroundColor Yellow
        continue
    }

    $dumpFile = "$WORK_DIR\data_$table.sql"

    # Verificar se tabela existe no PROD
    $exists = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -c "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='$table');" 2>&1
    if ($exists.Trim() -ne "t") {
        Write-Host " SKIP (nao existe no PROD)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    # Verificar se tabela existe no destino
    $existsDest = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='$table');" 2>&1
    if ($existsDest.Trim() -ne "t") {
        Write-Host " SKIP (nao existe no destino)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    # Verificar contagem
    $count = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -c "SELECT count(*) FROM `"$table`";" 2>&1
    if ($count.Trim() -eq "0") {
        Write-Host " SKIP (0 rows)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    # Export via pg_dump --column-inserts (ignora colunas extras graciosamente)
    pg_dump -h $NEON_HOST -U $NEON_USER -d $PROD_DB --data-only --column-inserts --table="public.$table" -f $dumpFile 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " ERRO (dump)" -ForegroundColor Red
        $totalError++
        $errorTables += $table
        continue
    }

    # Import
    $output = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -f $dumpFile 2>&1
    $importErrors = $output | Where-Object { $_ -match "^ERROR:" -and $_ -notmatch "duplicate key|already exists" }
    if ($importErrors) {
        Write-Host " ERRO (import)" -ForegroundColor Red
        $importErrors | Select-Object -First 2 | ForEach-Object { Write-Host "      $_" -ForegroundColor DarkRed }
        $totalError++
        $errorTables += $table
    } else {
        Write-Host " OK ($($count.Trim()) rows)" -ForegroundColor Green
        $totalSuccess++
    }
}

# --- Grupo A-Audit: Auditoria (últimos 5 dias) ---
Write-Host ""
Write-Host "  [Grupo A-Audit] Tabelas de auditoria (ultimos 5 dias):" -ForegroundColor Yellow

foreach ($table in $auditTables) {
    Write-Host "    $table..." -ForegroundColor Cyan -NoNewline

    if ($DryRun) {
        Write-Host " DRY-RUN" -ForegroundColor Yellow
        continue
    }

    # Verificar se tabela existe no PROD
    $exists = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -c "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='$table');" 2>&1
    if ($exists.Trim() -ne "t") {
        Write-Host " SKIP (nao existe no PROD)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    $existsDest = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='$table');" 2>&1
    if ($existsDest.Trim() -ne "t") {
        Write-Host " SKIP (nao existe no destino)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    # Detectar coluna de timestamp (criado_em, created_at, timestamp)
    $tsCol = psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='$table' AND column_name IN ('criado_em','created_at','timestamp','data') ORDER BY ordinal_position LIMIT 1;" 2>&1
    $tsCol = $tsCol.Trim()

    $dumpFile = "$WORK_DIR\data_audit_$table.sql"

    if ($tsCol) {
        # Exportar apenas últimos 5 dias
        $query = "COPY (SELECT * FROM `"$table`" WHERE `"$tsCol`" >= CURRENT_DATE - INTERVAL '5 days') TO STDOUT WITH (FORMAT csv, HEADER true)"
        psql -h $NEON_HOST -U $NEON_USER -d $PROD_DB -c $query > $dumpFile 2>&1
    } else {
        # Sem timestamp → exportar tudo via column-inserts
        pg_dump -h $NEON_HOST -U $NEON_USER -d $PROD_DB --data-only --column-inserts --table="public.$table" -f $dumpFile 2>&1
    }

    if ($LASTEXITCODE -ne 0 -or -not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -eq 0) {
        Write-Host " SKIP (vazia ou erro)" -ForegroundColor DarkGray
        $totalSkip++
        continue
    }

    if ($tsCol) {
        # Obter colunas do destino para COPY FROM
        $cols = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_name='$table' AND table_schema='public';" 2>&1
        $importQuery = "COPY `"$table`" ($($cols.Trim())) FROM STDIN WITH (FORMAT csv, HEADER true)"
        Get-Content $dumpFile | psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $importQuery 2>&1
    } else {
        psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -f $dumpFile 2>&1
    }

    if ($LASTEXITCODE -eq 0) {
        Write-Host " OK" -ForegroundColor Green
        $totalSuccess++
    } else {
        Write-Host " ERRO" -ForegroundColor Red
        $totalError++
        $errorTables += $table
    }
}

# Reabilitar triggers
Write-Host ""
Write-Host "  Reabilitando triggers no $NEW_DB..." -ForegroundColor Cyan
if (-not $DryRun) {
    psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c "SET session_replication_role = 'origin';" 2>&1 | Out-Null
}

Write-Host ""
Write-Host "  Resultado Fase 4:" -ForegroundColor White
Write-Host "    Sucesso: $totalSuccess" -ForegroundColor Green
Write-Host "    Skip:    $totalSkip" -ForegroundColor Yellow
Write-Host "    Erro:    $totalError" -ForegroundColor Red
if ($errorTables.Count -gt 0) {
    Write-Host "    Tabelas com erro:" -ForegroundColor Red
    $errorTables | ForEach-Object { Write-Host "      - $_" -ForegroundColor DarkRed }
}
Write-Host ""

# ====================================================================
# FASE 5: RESETAR SEQUENCES
# ====================================================================
Write-Host "FASE 5: Resetar sequences" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

if (-not $DryRun) {
    $seqResetSql = @"
DO \$\$
DECLARE
  r RECORD;
  max_val BIGINT;
BEGIN
  FOR r IN
    SELECT
      t.oid::regclass::text AS table_name,
      a.attname AS column_name,
      pg_get_serial_sequence(t.oid::regclass::text, a.attname) AS seq_name
    FROM pg_class t
    JOIN pg_attribute a ON a.attrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relkind = 'r'
      AND pg_get_serial_sequence(t.oid::regclass::text, a.attname) IS NOT NULL
  LOOP
    EXECUTE format('SELECT COALESCE(max(%I), 0) FROM %s', r.column_name, r.table_name) INTO max_val;
    IF max_val > 0 THEN
      PERFORM setval(r.seq_name, max_val);
      RAISE NOTICE 'Sequence % -> %', r.seq_name, max_val;
    END IF;
  END LOOP;
END \$\$;
"@
    Write-Host "  Resetando todas sequences automaticamente..." -ForegroundColor Cyan
    psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $seqResetSql 2>&1
    Write-Host "    OK" -ForegroundColor Green
}
Write-Host ""

# ====================================================================
# FASE 6: POPULAR schema_migrations
# ====================================================================
Write-Host "FASE 6: Popular schema_migrations" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

if (-not $DryRun) {
    # Gerar lista de versões baseada nos arquivos de migration existentes
    $versions = Get-ChildItem -Path $MIGRATIONS_DIR -Filter "*.sql" |
        Where-Object { $_.Name -match "^(\d+)" } |
        ForEach-Object { [regex]::Match($_.Name, "^(\d+)").Groups[1].Value } |
        Sort-Object { [int]$_ } -Unique

    $insertValues = ($versions | ForEach-Object { "($_, false)" }) -join ",`n  "
    $insertSql = "INSERT INTO schema_migrations (version, dirty) VALUES`n  $insertValues`nON CONFLICT (version) DO NOTHING;"

    Write-Host "  Inserindo $($versions.Count) versoes em schema_migrations..." -ForegroundColor Cyan
    psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -c $insertSql 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "    OK" -ForegroundColor Green }
    else { Write-Host "    ERRO" -ForegroundColor Red }
}
Write-Host ""

# ====================================================================
# FASE 7: VERIFICAÇÃO FINAL
# ====================================================================
Write-Host "FASE 7: Verificacao final" -ForegroundColor Magenta
Write-Host "====================================================================" -ForegroundColor DarkGray

if (-not $DryRun) {
    # Contagens esperadas
    $expectedCounts = @{
        "clinicas" = 19
        "entidades" = 14
        "empresas_clientes" = 20
        "funcionarios" = 124
        "avaliacoes" = 148
        "respostas" = 3173
        "lotes_avaliacao" = 56
        "laudos" = 45
        "contratos" = 34
        "pagamentos" = 36
        "usuarios" = 32
    }

    $allOk = $true
    foreach ($entry in $expectedCounts.GetEnumerator()) {
        $actual = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT count(*) FROM $($entry.Key);" 2>&1
        $actualNum = [int]$actual.Trim()
        $expected = $entry.Value

        if ($actualNum -eq $expected) {
            Write-Host "    $($entry.Key): $actualNum OK" -ForegroundColor Green
        } else {
            Write-Host "    $($entry.Key): $actualNum (esperado $expected) DIVERGENTE" -ForegroundColor Red
            $allOk = $false
        }
    }

    Write-Host ""

    # Verificar tabelas legacy ausentes
    Write-Host "  Tabelas legacy (devem estar ausentes):" -ForegroundColor Gray
    $legacy = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('contratos_planos','payment_links');" 2>&1
    if ($legacy.Trim() -eq "") {
        Write-Host "    contratos_planos, payment_links: AUSENTES (OK)" -ForegroundColor Green
    } else {
        Write-Host "    PROBLEMA: $($legacy.Trim()) ainda existem" -ForegroundColor Red
        $allOk = $false
    }

    # Verificar schema_migrations
    $lastVersion = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT version FROM schema_migrations ORDER BY version DESC LIMIT 1;" 2>&1
    Write-Host "  Ultima migration: $($lastVersion.Trim())" -ForegroundColor Gray

    # Verificar FKs
    $invalidFks = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT count(*) FROM pg_constraint WHERE contype='f' AND NOT convalidated;" 2>&1
    Write-Host "  FKs invalidas: $($invalidFks.Trim())" -ForegroundColor Gray

    # Verificar RLS policies
    $policyCount = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT count(*) FROM pg_policies;" 2>&1
    Write-Host "  RLS policies: $($policyCount.Trim())" -ForegroundColor Gray

    # Verificar views
    $views = psql -h $NEON_POOLER -U $NEON_USER -d $NEW_DB -t -c "SELECT string_agg(table_name, ', ') FROM information_schema.views WHERE table_schema='public' AND table_name IN ('tomadores','gestores','v_solicitacoes_emissao','v_relatorio_emissoes');" 2>&1
    Write-Host "  Views criticas: $($views.Trim())" -ForegroundColor Gray

    Write-Host ""
    if ($allOk) {
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host "  MIGRACAO CONCLUIDA COM SUCESSO!" -ForegroundColor Green
        Write-Host "====================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  Proximo passo:" -ForegroundColor Cyan
        Write-Host "    1. Trocar DATABASE_URL no Vercel Dashboard (Production)" -ForegroundColor Gray
        Write-Host "       De: .../$PROD_DB?..." -ForegroundColor DarkGray
        Write-Host "       Para: .../$NEW_DB?..." -ForegroundColor DarkGray
        Write-Host "    2. Trigger Redeploy no Vercel" -ForegroundColor Gray
        Write-Host "    3. Smoke test: login admin, RH, emissor, representante" -ForegroundColor Gray
        Write-Host "    4. Manter $PROD_DB antigo por 2 semanas (fallback)" -ForegroundColor Gray
    } else {
        Write-Host "====================================================================" -ForegroundColor Yellow
        Write-Host "  MIGRACAO CONCLUIDA COM DIVERGENCIAS — verificar acima" -ForegroundColor Yellow
        Write-Host "====================================================================" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Dry-run concluido. Nenhuma operacao foi executada." -ForegroundColor Yellow
}

Write-Host ""

# Limpar variável de ambiente
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
