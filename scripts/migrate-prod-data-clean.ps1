# ====================================================================
# MIGRAR DADOS PROD → neondb_v2 (versão limpa/corrigida)
# Data: 05/04/2026
# ====================================================================
# Pressupostos:
#   - neondb_v2 JÁ tem schema aplicado (71 tabelas)
#   - neondb_v2 pode ter dados parciais (serão truncados)
#   - session_replication_role = 'replica' é usado para desabilitar FKs
#   - Endpoint DIRETO usado para neondb_v2 (evita search_path vazio do pooler)
#   - Ordem de import respeita dependências entre tabelas
# ====================================================================

param([switch]$DryRun)

$PROD = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&sslcertmode=allow"
$V2   = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&sslcertmode=allow"
$BACKUPS = "C:\apps\QWork\backups\data_dumps_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

if (-not $env:NEON_PROD_PASSWORD) {
    Write-Host "ERRO: NEON_PROD_PASSWORD nao definida" -ForegroundColor Red; exit 1
}

New-Item -ItemType Directory -Path $BACKUPS -Force | Out-Null

$ok = 0; $skip = 0; $err = 0; $errors = @()

function DumpAndImport($label, $dumpSql, $importSql, $file) {
    $filepath = "$BACKUPS\$file"
    Write-Host "  $label..." -NoNewline -ForegroundColor Cyan

    if ($DryRun) { Write-Host " DRY-RUN" -ForegroundColor Yellow; return }

    # Dump from PROD
    psql $PROD -c $dumpSql > $filepath 2>&1
    $dumpExit = $LASTEXITCODE
    $sz = (Get-Item $filepath -ErrorAction SilentlyContinue).Length
    if ($dumpExit -ne 0 -or $sz -lt 10) {
        $errLine = Get-Content $filepath -ErrorAction SilentlyContinue | Select-Object -First 1
        Write-Host " SKIP DUMP (exit=$dumpExit, sz=$sz - $errLine)" -ForegroundColor Yellow
        $script:skip++; return
    }

    # Import to neondb_v2 via direct endpoint with FK/trigger disable in SAME session
    $importOutput = Get-Content $filepath | psql $V2 -c "SET session_replication_role = 'replica'" -c $importSql 2>&1
    if ($LASTEXITCODE -eq 0) {
        $rows = ($importOutput | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })
        Write-Host " OK ($rows rows)" -ForegroundColor Green
        $script:ok++
    } else {
        $errMsg = ($importOutput | Where-Object { $_ -match "ERROR:" } | Select-Object -First 1)
        Write-Host " IMPORT FALHOU: $errMsg" -ForegroundColor Red
        $script:err++; $script:errors += $label
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  MIGRAÇÃO DADOS PROD → neondb_v2 (limpa, com FK disable)" -ForegroundColor Cyan
Write-Host "  Backups: $BACKUPS" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# ====================================================================
# PASSO 1: Truncar todas as tabelas em neondb_v2
# ====================================================================
Write-Host "TRUNCATING tabelas em neondb_v2..." -ForegroundColor Magenta
if (-not $DryRun) {
    psql $V2 -c "
        SET session_replication_role = 'replica';
        TRUNCATE TABLE clinicas, entidades, contratos, lotes_avaliacao,
            funcionarios, empresas_clientes, avaliacoes, respostas, laudos, usuarios,
            pagamentos, representantes, vinculos_comissao, comissoes_laudo,
            leads_representante, funcionarios_clinicas, funcionarios_entidades,
            avaliacao_resets, fila_emissao, clinicas_senhas, entidades_senhas,
            notificacoes, notificacoes_admin, tokens_retomada_pagamento,
            aceites_termos_usuario, aceites_termos_entidade, analise_estatistica,
            lote_id_allocator, mfa_codes, notificacoes_traducoes, pdf_jobs,
            permissions, questao_condicoes, recibos, relatorio_templates,
            representantes_cadastro_leads, resultados, role_permissions, roles,
            session_logs, templates_contrato, webhook_logs, comissionamento_auditoria
        RESTART IDENTITY CASCADE;
    " 2>&1 | Out-Null
    Write-Host "  OK - todas truncadas" -ForegroundColor Green
}
Write-Host ""

# ====================================================================
# PASSO 2: Importar em ordem correta (respeitando FKs hierárquicas)
# ====================================================================
Write-Host "IMPORTANDO DADOS (ordem: pai → filho):" -ForegroundColor Magenta

# Helper para tabelas simples (mesmas colunas PROD e V2)
function Import($tbl) {
    DumpAndImport $tbl `
        "COPY (SELECT * FROM $tbl) TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY $tbl FROM STDIN WITH (FORMAT csv, HEADER true)" `
        "data_$tbl.csv"
}

# ─── NÍVEL 0: Tabelas raiz (sem FKs para outras tabelas migradas) ───
Write-Host "  [L0] Tabelas raiz:" -ForegroundColor Yellow

DumpAndImport "clinicas" `
    "COPY (SELECT id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url FROM clinicas) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY clinicas (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM STDIN WITH (FORMAT csv, HEADER true)" `
    "data_clinicas.csv"

DumpAndImport "entidades" `
    "COPY (SELECT id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url FROM entidades) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY entidades (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM STDIN WITH (FORMAT csv, HEADER true)" `
    "data_entidades.csv"

Import "empresas_clientes"
Import "representantes"
Import "roles"
Import "permissions"
Import "role_permissions"
Import "notificacoes_traducoes"
Import "templates_contrato"
Import "relatorio_templates"

Write-Host "  [L1] Dependentes diretos de clinicas/entidades:" -ForegroundColor Yellow

Import "funcionarios"
Import "clinicas_senhas"
Import "entidades_senhas"
Import "usuarios"
Import "vinculos_comissao"
Import "leads_representante"
Import "aceites_termos_entidade"
Import "lote_id_allocator"
Import "comissionamento_auditoria"

DumpAndImport "contratos" `
    "COPY (SELECT id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador FROM contratos) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY contratos (id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador) FROM STDIN WITH (FORMAT csv, HEADER true)" `
    "data_contratos.csv"

Write-Host "  [L2] Dependentes de funcionarios/empresas:" -ForegroundColor Yellow

Import "funcionarios_clinicas"
Import "funcionarios_entidades"
Import "avaliacoes"
Import "pagamentos"
Import "notificacoes"
Import "notificacoes_admin"
Import "session_logs"
Import "aceites_termos_usuario"
Import "mfa_codes"

DumpAndImport "lotes_avaliacao" `
    "COPY (SELECT id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico FROM lotes_avaliacao) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico) FROM STDIN WITH (FORMAT csv, HEADER true)" `
    "data_lotes_avaliacao.csv"

Write-Host "  [L3] Dependentes de lotes/avaliacoes:" -ForegroundColor Yellow

Import "respostas"
Import "laudos"
Import "resultados"
Import "avaliacao_resets"
Import "comissoes_laudo"
Import "recibos"
Import "laudo_arquivos_remotos"
Import "laudo_downloads"
Import "laudo_generation_jobs"
Import "pdf_jobs"
Import "webhook_logs"
Import "logs_admin"
Import "tokens_retomada_pagamento"
Import "questao_condicoes"
Import "representantes_cadastro_leads"

# Auditoria (últimos 5 dias para evitar dump enorme)
Write-Host "  [Audit] Tabelas de auditoria (5 dias):" -ForegroundColor Yellow
foreach ($tbl in @("audit_logs","auditoria","auditoria_geral","auditoria_laudos","auditoria_recibos","audit_access_denied")) {
    DumpAndImport $tbl `
        "COPY (SELECT * FROM $tbl WHERE criado_em >= NOW() - INTERVAL '5 days') TO STDOUT WITH (FORMAT csv, HEADER true)" `
        "COPY $tbl FROM STDIN WITH (FORMAT csv, HEADER true)" `
        "data_audit_$tbl.csv"
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Resultado: OK=$ok  SKIP=$skip  ERRO=$err" -ForegroundColor White
if ($errors.Count -gt 0) {
    $errors | ForEach-Object { Write-Host "  FALHOU: $_" -ForegroundColor Red }
}
Write-Host ""

# ====================================================================
# PASSO 3: Resetar sequences
# ====================================================================
Write-Host "RESETANDO SEQUENCES..." -ForegroundColor Magenta
if (-not $DryRun) {
    psql $V2 -c @'
DO $$
DECLARE
    r RECORD;
    max_val BIGINT;
    seq_name TEXT;
BEGIN
    FOR r IN
        SELECT s.schemaname, s.sequencename, t.table_name, c.column_name
        FROM information_schema.sequences s
        JOIN information_schema.columns c ON c.column_default LIKE '%' || s.sequencename || '%'
        JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = 'public'
        WHERE s.sequence_schema = 'public'
    LOOP
        seq_name := r.schemaname || '.' || r.sequencename;
        EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_val;
        IF max_val > 0 THEN
            EXECUTE format('SELECT setval(%L, %s)', seq_name, max_val);
        END IF;
    END LOOP;
END;
$$;
'@ 2>&1
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green }
    else { Write-Host "  WARN: Verifique sequences manualmente" -ForegroundColor Yellow }
}
Write-Host ""

# ====================================================================
# PASSO 4: Popular schema_migrations
# ====================================================================
Write-Host "POPULANDO schema_migrations..." -ForegroundColor Magenta
if (-not $DryRun) {
    # Copy schema_migrations from STAGING (which is current target)
    $smFile = "$BACKUPS\schema_migrations.csv"
    psql "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb_staging?sslmode=require&sslcertmode=allow" `
        -c "COPY schema_migrations TO STDOUT WITH (FORMAT csv, HEADER true)" > $smFile 2>&1
    
    if ($LASTEXITCODE -eq 0 -and (Get-Item $smFile).Length -gt 10) {
        Get-Content $smFile | psql $V2 -c "TRUNCATE schema_migrations; COPY schema_migrations FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
        if ($LASTEXITCODE -eq 0) { Write-Host "  OK (schema_migrations copiado do STAGING)" -ForegroundColor Green }
        else { Write-Host "  ERRO ao importar schema_migrations" -ForegroundColor Red }
    } else {
        Write-Host "  ERRO ao exportar schema_migrations do STAGING" -ForegroundColor Red
    }
}
Write-Host ""

# ====================================================================
# PASSO 5: Verificação final
# ====================================================================
Write-Host "VERIFICACÃO FINAL:" -ForegroundColor Magenta
if (-not $DryRun) {
    psql $V2 -c "
        SELECT 'clinicas'          AS tabela, count(*) FROM clinicas UNION ALL
        SELECT 'entidades',          count(*) FROM entidades UNION ALL
        SELECT 'empresas_clientes',  count(*) FROM empresas_clientes UNION ALL
        SELECT 'funcionarios',       count(*) FROM funcionarios UNION ALL
        SELECT 'avaliacoes',         count(*) FROM avaliacoes UNION ALL
        SELECT 'respostas',          count(*) FROM respostas UNION ALL
        SELECT 'laudos',             count(*) FROM laudos UNION ALL
        SELECT 'lotes_avaliacao',    count(*) FROM lotes_avaliacao UNION ALL
        SELECT 'contratos',          count(*) FROM contratos UNION ALL
        SELECT 'pagamentos',         count(*) FROM pagamentos UNION ALL
        SELECT 'usuarios',           count(*) FROM usuarios UNION ALL
        SELECT 'schema_migrations',  count(*) FROM schema_migrations
        ORDER BY 1;
    "

    # Verify no legacy columns
    psql $V2 -c "
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema='public'
        AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id','contratante_id','valor_personalizado')
        AND table_name IN ('clinicas','entidades','contratos','lotes_avaliacao')
        ORDER BY table_name, column_name;
    "
}
Write-Host ""
Write-Host "DONE." -ForegroundColor Cyan
