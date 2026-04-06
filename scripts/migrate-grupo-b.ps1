# ====================================================================
# MIGRAR GRUPO B: clinicas / entidades / contratos / lotes_avaliacao
# PROD (neondb, migration 1101) → neondb_v2 (migration 1143)
# Data: 05/04/2026 — Execução manual após falhas no script principal
# ====================================================================
# CORREÇÕES vs script principal:
#   1. clinicas: sem entidade_id (col não existe no PROD 1101)
#   2. lotes_avaliacao: inclui valor_servico (esquecido no script orig)
#   3. Import usa endpoint DIRETO (não pooler) para respeitar search_path
# ====================================================================

$PROD = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require&sslcertmode=allow"
$V2   = "postgresql://neondb_owner:$($env:NEON_PROD_PASSWORD)@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb_v2?sslmode=require&sslcertmode=allow"
$TMP  = "C:\apps\QWork\backups\tmp_grupo_b.csv"

if (-not $env:NEON_PROD_PASSWORD) {
    Write-Host "ERRO: NEON_PROD_PASSWORD nao definida" -ForegroundColor Red; exit 1
}

$ok = 0; $err = 0

function MigrateTable($tableLabel, $dumpQuery, $importQuery) {
    Write-Host "  $tableLabel..." -NoNewline -ForegroundColor Cyan
    # 1. Dump from PROD
    psql $PROD -c $dumpQuery > $TMP 2>&1
    $dumpExit = $LASTEXITCODE
    $fileSize = (Get-Item $TMP -ErrorAction SilentlyContinue).Length

    if ($dumpExit -ne 0 -or $fileSize -lt 50) {
        Write-Host " DUMP FALHOU (exit=$dumpExit, size=$fileSize)" -ForegroundColor Red
        Get-Content $TMP | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
        $script:err++; return
    }

    # 2. Import into neondb_v2 (direct endpoint to respect search_path)
    $importOutput = Get-Content $TMP | psql $V2 -c $importQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        $rows = ($importOutput | Select-String "COPY (\d+)" | ForEach-Object { $_.Matches[0].Groups[1].Value }) 
        Write-Host " OK ($rows rows)" -ForegroundColor Green
        $script:ok++
    } else {
        Write-Host " IMPORT FALHOU" -ForegroundColor Red
        $importOutput | Where-Object { $_ -match "ERROR:" } | Select-Object -First 3 | ForEach-Object { Write-Host "    $_" -ForegroundColor DarkRed }
        $script:err++
    }
}

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "  GRUPO B — Migracao tabelas com schema changes" -ForegroundColor Cyan
Write-Host "  PROD (1101) -> neondb_v2 (1143)" -ForegroundColor Gray
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

# Disable triggers in neondb_v2
psql $V2 -c "SET session_replication_role = 'replica';" 2>&1 | Out-Null

# ===================================================================
# B1: clinicas (19 rows)
# PROD cols: sem entidade_id (adicionada em migration > 1101)
# neondb_v2 cols: com entidade_id (nullable, será NULL)
# ===================================================================
$cols = "id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, contrato_aceito, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url"
MigrateTable "clinicas" `
    "COPY (SELECT $cols FROM clinicas) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY clinicas ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)"

# ===================================================================
# B2: entidades (14 rows)
# PROD cols: sem contrato_aceito em neondb_v2 (dropado em 1138)
# ===================================================================
$cols = "id, nome, cnpj, inscricao_estadual, email, telefone, endereco, cidade, estado, cep, responsavel_nome, responsavel_cpf, responsavel_cargo, responsavel_email, responsavel_celular, cartao_cnpj_path, contrato_social_path, doc_identificacao_path, status, motivo_rejeicao, observacoes_reanalise, ativa, criado_em, atualizado_em, aprovado_em, aprovado_por_cpf, numero_funcionarios_estimado, data_primeiro_pagamento, tipo, cartao_cnpj_arquivo_remoto_provider, cartao_cnpj_arquivo_remoto_bucket, cartao_cnpj_arquivo_remoto_key, cartao_cnpj_arquivo_remoto_url, contrato_social_arquivo_remoto_provider, contrato_social_arquivo_remoto_bucket, contrato_social_arquivo_remoto_key, contrato_social_arquivo_remoto_url, doc_identificacao_arquivo_remoto_provider, doc_identificacao_arquivo_remoto_bucket, doc_identificacao_arquivo_remoto_key, doc_identificacao_arquivo_remoto_url"
MigrateTable "entidades" `
    "COPY (SELECT $cols FROM entidades) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY entidades ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)"

# ===================================================================
# B3: contratos (34 rows)
# PROD: excluir plano_id, valor_personalizado, payment_link_expiracao, link_enviado_em
# ===================================================================
$cols = "id, numero_funcionarios, valor_total, status, aceito, pagamento_confirmado, conteudo, criado_em, atualizado_em, aceito_em, ip_aceite, data_aceite, hash_contrato, conteudo_gerado, data_pagamento, criado_por_cpf, entidade_id, tomador_id, tipo_tomador"
MigrateTable "contratos" `
    "COPY (SELECT $cols FROM contratos) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY contratos ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)"

# ===================================================================
# B4: lotes_avaliacao (56 rows)
# PROD: excluir contratante_id; incluir valor_servico
# neondb_v2: link_disponibilizado_em ficará NULL
# ===================================================================
$cols = "id, clinica_id, empresa_id, descricao, tipo, status, liberado_por, liberado_em, criado_em, atualizado_em, hash_pdf, numero_ordem, emitido_em, enviado_em, setor_id, laudo_enviado_em, finalizado_em, entidade_id, status_pagamento, solicitacao_emissao_em, valor_por_funcionario, link_pagamento_token, link_pagamento_expira_em, link_pagamento_enviado_em, pagamento_metodo, pagamento_parcelas, pago_em, valor_servico"
MigrateTable "lotes_avaliacao" `
    "COPY (SELECT $cols FROM lotes_avaliacao) TO STDOUT WITH (FORMAT csv, HEADER true)" `
    "COPY lotes_avaliacao ($cols) FROM STDIN WITH (FORMAT csv, HEADER true)"

# Re-enable triggers
psql $V2 -c "SET session_replication_role = 'origin';" 2>&1 | Out-Null

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  OK: $ok  ERRO: $err" -ForegroundColor White
Write-Host ""

# Verify
if ($err -eq 0) {
    Write-Host "Verificando contagens:" -ForegroundColor Green
    psql $V2 -c "SELECT 'clinicas' as t, count(*) FROM clinicas UNION ALL SELECT 'entidades', count(*) FROM entidades UNION ALL SELECT 'contratos', count(*) FROM contratos UNION ALL SELECT 'lotes_avaliacao', count(*) FROM lotes_avaliacao;"
}
