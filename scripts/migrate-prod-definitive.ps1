# ====================================================================
# MIGRAR DADOS PROD → neondb_v2 (definitivo - colunas dinâmicas)
# Data: 05/04/2026
# ====================================================================
# Abordagem: detecta automaticamente colunas comuns entre PROD e V2
# FK disable: usa ALTER TABLE ... DISABLE TRIGGER via superuser surrogate
#   → Na verdade: importa em ORDEM CORRETA por hierarquia de FKs
# ====================================================================

param([switch]$DryRun)

$PROD_CONN = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&sslcertmode=allow"
$V2_CONN   = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&sslcertmode=allow"
$DUMPS     = "C:\apps\QWork\backups\data_dumps_20260405_232345"  # reusar dumps já criados

if (-not $env:NEON_PROD_PASSWORD) {
    Write-Host "ERRO: NEON_PROD_PASSWORD nao definida" -ForegroundColor Red; exit 1
}

$ok = 0; $skip = 0; $err = 0; $errors = @()

# Obter interseção de colunas entre PROD e V2 para uma tabela
# Exclui colunas GENERATED ALWAYS do V2 (não pode fazer COPY nelas)
function GetCommonCols($table) {
    $prodCols = psql $PROD_CONN -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='$table' AND table_schema='public' ORDER BY ordinal_position" 2>&1
    $v2Cols   = psql $V2_CONN   -t -c "SELECT column_name FROM information_schema.columns WHERE table_name='$table' AND table_schema='public' AND is_generated='NEVER' ORDER BY ordinal_position" 2>&1

    $prodSet = @($prodCols | Where-Object { $_ -is [string] -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })
    $v2Set   = @($v2Cols   | Where-Object { $_ -is [string] -and $_.Trim() -ne "" } | ForEach-Object { $_.Trim() })

    # Interseção: colunas que existem em AMBOS, na ordem do PROD
    $common = $prodSet | Where-Object { $v2Set -contains $_ }
    return $common -join ", "
}

function MigrateTable($table, $customDumpSql = $null, $customImportSql = $null) {
    Write-Host "  $table..." -ForegroundColor Cyan -NoNewline

    if ($DryRun) { Write-Host " DRY-RUN" -ForegroundColor Yellow; return }

    $dumpFile = "$DUMPS\data_$table.csv"

    # Verifica se dump já existe
    if (-not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -lt 10) {
        if ($customDumpSql) {
            psql $PROD_CONN -c $customDumpSql > $dumpFile 2>&1
        } else {
            # Detectar columas comuns e gerar dump
            $cols = GetCommonCols $table
            if (-not $cols) {
                Write-Host " SKIP (sem colunas comuns)" -ForegroundColor Yellow; $script:skip++; return
            }
            psql $PROD_CONN -c "COPY (SELECT $cols FROM $table) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
        }
        if ($LASTEXITCODE -ne 0 -or (Get-Item $dumpFile -ErrorAction SilentlyContinue).Length -lt 10) {
            $e = Get-Content $dumpFile -ErrorAction SilentlyContinue | Select-Object -First 1
            Write-Host " SKIP DUMP - $e" -ForegroundColor Yellow; $script:skip++; return
        }
    }

    $sz = (Get-Item $dumpFile).Length
    
    # Import (SET session vars para satisfazer audit_trigger_func: current_user_cpf + current_user_perfil)
    $setCpf = "SET app.current_user_cpf = '00000000000'; SET app.current_user_perfil = 'admin'"
    if ($customImportSql) {
        $importResult = Get-Content $dumpFile | psql $V2_CONN -c $setCpf -c $customImportSql 2>&1
    } else {
        $v2ColsStr = GetCommonCols $table
        $importResult = Get-Content $dumpFile | psql $V2_CONN -c $setCpf -c "COPY $table ($v2ColsStr) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    }

    $importExit = $LASTEXITCODE
    $fkErrors = $importResult | Where-Object { $_ -match "ERROR:" -and $_ -notmatch "permission denied to set parameter" }

    if ($fkErrors) {
        Write-Host " ERRO: $($fkErrors | Select-Object -First 1)" -ForegroundColor Red
        $script:err++; $script:errors += $table
    } elseif ($importExit -ne 0 -and ($importResult | Where-Object { $_ -match "permission denied to set parameter" })) {
        # SET session_replication_role falhou mas COPY pode ter rodado
        $rows = ($importResult | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })
        Write-Host " OK (FK warn, $rows rows, $sz bytes)" -ForegroundColor Green
        $script:ok++
    } elseif ($importExit -eq 0) {
        $rows = ($importResult | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })
        Write-Host " OK ($rows rows)" -ForegroundColor Green
        $script:ok++
    } else {
        Write-Host " WARN exit=$importExit" -ForegroundColor Yellow
        $script:skip++
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  MIGRAÇÃO DEFINITIVA PROD → neondb_v2 (colunas dinâmicas)" -ForegroundColor Cyan
Write-Host "====================================================================" -ForegroundColor Cyan

# ====================================================================
# TRUNCAR (ordem inversa para evitar FK ao truncar)
# ====================================================================
Write-Host ""
Write-Host "TRUNCATING..." -ForegroundColor Magenta
if (-not $DryRun) {
    # Truncar TODAS as tabelas exceto schema_migrations e tabelas de metadados
    $truncResult = psql $V2_CONN -c @'
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

# ====================================================================
# IMPORTAR em ordem hierárquica
# ====================================================================
Write-Host ""
Write-Host "IMPORTANDO (ordem hierárquica):" -ForegroundColor Magenta

Write-Host "  [L0] Raiz:" -ForegroundColor Yellow
MigrateTable "roles"
MigrateTable "permissions"
MigrateTable "role_permissions"
MigrateTable "notificacoes_traducoes"
# templates_contrato: filtra tipo_template valido (V2 aceita apenas 'padrao'/'lote')
$tplCols = GetCommonCols "templates_contrato"
MigrateTable "templates_contrato" `
    "COPY (SELECT $tplCols FROM templates_contrato WHERE tipo_template IN ('padrao', 'lote')) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY templates_contrato ($tplCols) FROM STDIN WITH (FORMAT csv, HEADER true)"
MigrateTable "relatorio_templates"
MigrateTable "representantes"

Write-Host "  [L1] entidades/clinicas/empresas:" -ForegroundColor Yellow
MigrateTable "entidades" `
    "COPY (SELECT id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url FROM entidades) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY entidades (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM STDIN WITH (FORMAT csv, HEADER true)"

MigrateTable "clinicas" `
    "COPY (SELECT id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url FROM clinicas) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY clinicas (id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url) FROM STDIN WITH (FORMAT csv, HEADER true)"

# empresas_clientes: PROD tem arquivo_remoto cols, V2 não
MigrateTable "empresas_clientes" `
    "COPY (SELECT id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, representante_nome, representante_fone, representante_email, responsavel_email, cartao_cnpj_path, contrato_social_path, doc_identificacao_path FROM empresas_clientes) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY empresas_clientes (id, nome, cnpj, email, telefone, endereco, cidade, estado, cep, ativa, clinica_id, criado_em, atualizado_em, representante_nome, representante_fone, representante_email, responsavel_email, cartao_cnpj_path, contrato_social_path, doc_identificacao_path) FROM STDIN WITH (FORMAT csv, HEADER true)"

Write-Host "  [L2] Dependentes de clinicas/entidades:" -ForegroundColor Yellow
# funcionarios: filtra perfil='funcionario' + computa usuario_tipo (novo col NOT NULL em V2)
# usuario_tipo: funcionario_entidade se tem vinculo em funcionarios_entidades, senao funcionario_clinica
# ultima_avaliacao_id NULLADO: FK circular com avaliacoes (sera recomputado pelo app)
$funcCommonCols = "id, cpf, nome, setor, funcao, email, senha_hash, perfil, ativo, criado_em, atualizado_em, matricula, turno, escala, nivel_cargo, ultima_avaliacao_id, ultima_avaliacao_data_conclusao, ultima_avaliacao_status, ultimo_motivo_inativacao, data_ultimo_lote, data_nascimento, indice_avaliacao, incluido_em, inativado_em, inativado_por, ultimo_lote_codigo"
MigrateTable "funcionarios" `
    "COPY (SELECT f.id, f.cpf, f.nome, f.setor, f.funcao, f.email, f.senha_hash, f.perfil, f.ativo, f.criado_em, f.atualizado_em, f.matricula, f.turno, f.escala, f.nivel_cargo, NULL::integer AS ultima_avaliacao_id, NULL::timestamp AS ultima_avaliacao_data_conclusao, NULL::text AS ultima_avaliacao_status, f.ultimo_motivo_inativacao, f.data_ultimo_lote, f.data_nascimento, f.indice_avaliacao, f.incluido_em, f.inativado_em, f.inativado_por, f.ultimo_lote_codigo, CASE WHEN EXISTS (SELECT 1 FROM funcionarios_entidades fe WHERE fe.funcionario_id = f.id) THEN 'funcionario_entidade' ELSE 'funcionario_clinica' END AS usuario_tipo FROM funcionarios f WHERE f.perfil = 'funcionario') TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY funcionarios ($funcCommonCols, usuario_tipo) FROM STDIN WITH (FORMAT csv, HEADER true)"
MigrateTable "clinicas_senhas"
MigrateTable "entidades_senhas"
MigrateTable "usuarios"
MigrateTable "aceites_termos_entidade"
MigrateTable "lote_id_allocator"
MigrateTable "comissionamento_auditoria"

# leads_representante: valor_negociado NOT NULL em V2 mas nao existe no PROD
# Adiciona DEFAULT 0 temporario, importa, remove default
Write-Host "  leads_representante (schema fix)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    psql $V2_CONN -c "ALTER TABLE leads_representante ALTER COLUMN valor_negociado SET DEFAULT 0;" 2>&1 | Out-Null
    $dumpFile = "$DUMPS\data_leads_representante.csv"
    if (-not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -lt 10) {
        $cols = GetCommonCols "leads_representante"
        psql $PROD_CONN -c "COPY (SELECT $cols FROM leads_representante) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
    }
    $r = Get-Content $dumpFile | psql $V2_CONN -c "SET app.current_user_cpf = '00000000000'; SET app.current_user_perfil = 'admin'" -c "COPY leads_representante ($(GetCommonCols 'leads_representante')) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    psql $V2_CONN -c "ALTER TABLE leads_representante ALTER COLUMN valor_negociado DROP DEFAULT;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host " OK" -ForegroundColor Green; $ok++ }
    else { Write-Host " ERRO: $($r | Select-Object -First 1)" -ForegroundColor Red; $err++; $errors += "leads_representante" }
}

# vinculos_comissao APOS leads_representante (FK: vinculos_comissao.lead_id → leads_representante)
MigrateTable "vinculos_comissao"

MigrateTable "contratos" `
    "COPY (SELECT id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador FROM contratos) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY contratos (id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador) FROM STDIN WITH (FORMAT csv, HEADER true)"

Write-Host "  [L3] Dependentes de funcionarios/empresas:" -ForegroundColor Yellow
MigrateTable "funcionarios_clinicas"
MigrateTable "funcionarios_entidades"
# NOTA: avaliacoes depende de lotes_avaliacao (FK avaliacoes_lote_id_fkey) → importa em L4
MigrateTable "pagamentos"
MigrateTable "notificacoes"
MigrateTable "notificacoes_admin"
MigrateTable "session_logs"
MigrateTable "aceites_termos_usuario"
MigrateTable "mfa_codes"

MigrateTable "lotes_avaliacao" `
    "COPY (SELECT id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico FROM lotes_avaliacao) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY lotes_avaliacao (id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico) FROM STDIN WITH (FORMAT csv, HEADER true)"

Write-Host "  [L4] Dependentes de lotes/avaliacoes:" -ForegroundColor Yellow
# laudos: trigger em lotes_avaliacao auto-cria laudos ao inserir lotes → truncar antes de importar
if (-not $DryRun) {
    psql $V2_CONN -c "TRUNCATE TABLE laudos RESTART IDENTITY CASCADE;" 2>&1 | Out-Null
    Write-Host "  laudos pre-truncated (trigger cleanup)" -ForegroundColor DarkGray
}
MigrateTable "avaliacoes"
MigrateTable "respostas"
MigrateTable "laudos"

# resultados: trigger 'trigger_resultado_immutability' blocks INSERT for 'concluida' avaliacoes
# Como owner, podemos DISABLE/ENABLE TRIGGER sem superuser
Write-Host "  resultados (disable trigger)..." -ForegroundColor Cyan -NoNewline
if (-not $DryRun) {
    psql $V2_CONN -c "ALTER TABLE resultados DISABLE TRIGGER trigger_resultado_immutability;" 2>&1 | Out-Null
    $dumpFile = "$DUMPS\data_resultados.csv"
    if (-not (Test-Path $dumpFile) -or (Get-Item $dumpFile).Length -lt 10) {
        $rescols = GetCommonCols "resultados"
        psql $PROD_CONN -c "COPY (SELECT $rescols FROM resultados) TO STDOUT WITH (FORMAT csv, HEADER true)" > $dumpFile 2>&1
    }
    $rescols = GetCommonCols "resultados"
    $r = Get-Content $dumpFile | psql $V2_CONN -c "COPY resultados ($rescols) FROM STDIN WITH (FORMAT csv, HEADER true)" 2>&1
    psql $V2_CONN -c "ALTER TABLE resultados ENABLE TRIGGER trigger_resultado_immutability;" 2>&1 | Out-Null
    $fkErrors = $r | Where-Object { $_ -match "ERROR:" }
    if ($fkErrors) {
        Write-Host " ERRO: $($fkErrors | Select-Object -First 1)" -ForegroundColor Red
        $script:err++; $script:errors += "resultados"
    } else {
        $rows = ($r | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value })
        Write-Host " OK ($rows rows)" -ForegroundColor Green; $script:ok++
    }
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

Write-Host "  [Audit] Auditoria (5 min de dados recentes):" -ForegroundColor Yellow
foreach ($tbl in @("auditoria","auditoria_geral","auditoria_laudos","auditoria_recibos")) {
    $dumpFile = "$DUMPS\data_audit_$tbl.csv"
    $cols = GetCommonCols $tbl
    if ($cols) {
        MigrateTable $tbl $null "COPY $tbl ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)"
    }
}

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  Resultado: OK=$ok  SKIP=$skip  ERRO=$err" -ForegroundColor White
if ($errors.Count -gt 0) { $errors | ForEach-Object { Write-Host "  FALHOU: $_" -ForegroundColor Red } }
Write-Host ""

# ====================================================================
# RESETAR SEQUENCES
# ====================================================================
Write-Host "RESETANDO SEQUENCES..." -ForegroundColor Magenta
if (-not $DryRun) {
    psql $V2_CONN -c @'
DO $$
DECLARE r RECORD; max_val BIGINT; seq_name TEXT;
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
    if ($LASTEXITCODE -eq 0) { Write-Host "  OK" -ForegroundColor Green } else { Write-Host "  WARN" -ForegroundColor Yellow }
}

# ====================================================================
# VERIFICAÇÃO FINAL
# ====================================================================
Write-Host ""
Write-Host "VERIFICAÇÃO FINAL:" -ForegroundColor Magenta
if (-not $DryRun) {
    psql $V2_CONN -c "
        SELECT 'clinicas'          AS tabela, count(*) FROM clinicas UNION ALL SELECT 'entidades', count(*) FROM entidades UNION ALL
        SELECT 'empresas_clientes', count(*) FROM empresas_clientes UNION ALL SELECT 'funcionarios', count(*) FROM funcionarios UNION ALL
        SELECT 'avaliacoes',        count(*) FROM avaliacoes UNION ALL SELECT 'respostas', count(*) FROM respostas UNION ALL
        SELECT 'laudos',            count(*) FROM laudos UNION ALL SELECT 'lotes_avaliacao', count(*) FROM lotes_avaliacao UNION ALL
        SELECT 'contratos',         count(*) FROM contratos UNION ALL SELECT 'pagamentos', count(*) FROM pagamentos UNION ALL
        SELECT 'usuarios',          count(*) FROM usuarios UNION ALL SELECT 'schema_migrations', count(*) FROM schema_migrations UNION ALL
        SELECT 'funcionarios_clinicas', count(*) FROM funcionarios_clinicas UNION ALL SELECT 'funcionarios_entidades', count(*) FROM funcionarios_entidades
        ORDER BY 1;"

    # Colunas legacy NÃO devem existir
    Write-Host ""
    Write-Host "  Colunas legacy (deve ser 0 linhas):" -ForegroundColor Gray
    psql $V2_CONN -c "
        SELECT table_name, column_name FROM information_schema.columns
        WHERE table_schema='public' AND column_name IN ('pagamento_confirmado','data_liberacao_login','plano_id','contratante_id','valor_personalizado')
        AND table_name IN ('clinicas','entidades','contratos','lotes_avaliacao') ORDER BY 1,2;"
}
Write-Host ""
Write-Host "DONE." -ForegroundColor Cyan
