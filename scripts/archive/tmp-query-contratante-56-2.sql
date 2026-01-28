-- Relatório ajustado para contratante_id = 56 (corrige colunas inexistentes e busca JSON em notificações)

SELECT '--- PAGAMENTOS ---' AS section;
SELECT id, contrato_id, contratante_id, valor, status, metodo, numero_parcelas, detalhes_parcelas, data_pagamento, criado_em, atualizado_em FROM pagamentos WHERE contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- RECIBOS ---' AS section;
SELECT id, numero_recibo, pagamento_id, contrato_id, contratante_id, valor_total_anual, numero_parcelas, detalhes_parcelas, backup_path, hash_pdf, emitido_por_cpf, ip_emissao, criado_em, ativo FROM recibos WHERE contratante_id = 56 OR pagamento_id IN (SELECT id FROM pagamentos WHERE contratante_id = 56) ORDER BY criado_em DESC;

SELECT '--- VW_RECIBOS_COMPLETOS (via JOIN) ---' AS section;
SELECT v.* FROM vw_recibos_completos v JOIN recibos r ON v.numero_recibo = r.numero_recibo WHERE r.contratante_id = 56 ORDER BY v.criado_em DESC;

SELECT '--- NOTIFICACOES (dados_contexto JSON) ---' AS section;
SELECT * FROM notificacoes WHERE dados_contexto::text ILIKE '%"contratante_id": 56%' OR dados_contexto::text ILIKE '%56%' OR contratacao_personalizada_id IN (SELECT id FROM contratacao_personalizada WHERE contratante_id = 56) ORDER BY criado_em DESC LIMIT 200;

SELECT '--- NOTIFICACOES_FINANCEIRAS ---' AS section;
SELECT * FROM notificacoes_financeiras WHERE contrato_id IN (SELECT contrato_id FROM pagamentos WHERE contratante_id = 56) OR contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- CONTRATOS ---' AS section;
SELECT * FROM contratos WHERE contratante_id = 56;

SELECT '--- PAGAMENTOS DETALHES_PARCELAS ---' AS section;
SELECT id, numero_parcelas, detalhes_parcelas FROM pagamentos WHERE contratante_id = 56 ORDER BY criado_em DESC;

DO $$
BEGIN
  IF to_regclass('auditoria') IS NOT NULL THEN
    RAISE NOTICE '--- AUDITORIA (RECIBOS/PAGAMENTOS) ---';
    PERFORM NULL; -- placeholder
    -- Se necessário, descomente a linha abaixo para listar auditoria (pode não existir neste ambiente)
    -- EXECUTE 'SELECT id, recurso, operacao, detalhes, dados, criado_em FROM auditoria WHERE recurso IN (''recibos'',''pagamentos'') AND (detalhes::text ILIKE ''%56%'' OR dados::text ILIKE ''%56%'') ORDER BY criado_em DESC LIMIT 200';
  ELSE
    RAISE NOTICE 'Auditoria não encontrada neste ambiente.';
  END IF;
END$$;

-- Fim do relatório
