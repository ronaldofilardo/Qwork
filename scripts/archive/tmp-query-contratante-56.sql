-- Relatório completo de pagamentos/recibos/notificações/auditoria para contratante_id = 56
-- Geração automática via script temporário

SELECT '--- PAGAMENTOS ---' AS section;
SELECT id, contrato_id, contratante_id, valor, status, metodo, numero_parcelas, detalhes_parcelas, data_pagamento, criado_em, atualizado_em FROM pagamentos WHERE contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- RECIBOS ---' AS section;
SELECT id, numero_recibo, pagamento_id, contrato_id, contratante_id, valor_total_anual, numero_parcelas, detalhes_parcelas, backup_path, hash_pdf, emitido_por, ip_emissao, criado_em, ativo, cancelado FROM recibos WHERE contratante_id = 56 OR pagamento_id IN (SELECT id FROM pagamentos WHERE contratante_id = 56) ORDER BY criado_em DESC;

SELECT '--- VW_RECIBOS_COMPLETOS ---' AS section;
SELECT * FROM vw_recibos_completos WHERE contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- NOTIFICACOES ---' AS section;
SELECT * FROM notificacoes WHERE contratante_id = 56 OR pagamento_id IN (SELECT id FROM pagamentos WHERE contratante_id = 56) ORDER BY criado_em DESC;

SELECT '--- NOTIFICACOES_FINANCEIRAS ---' AS section;
SELECT * FROM notificacoes_financeiras WHERE contrato_id IN (SELECT contrato_id FROM pagamentos WHERE contratante_id = 56) OR contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- CONTRATOS ---' AS section;
SELECT * FROM contratos WHERE contratante_id = 56;

SELECT '--- PAGAMENTOS DETALHES_PARCELAS ---' AS section;
SELECT id, numero_parcelas, detalhes_parcelas FROM pagamentos WHERE contratante_id = 56 ORDER BY criado_em DESC;

SELECT '--- AUDITORIA (RECIBOS/PAGAMENTOS) ---' AS section;
SELECT id, recurso, operacao, detalhes, dados, criado_em FROM auditoria WHERE recurso IN ('recibos','pagamentos') AND (detalhes::text ILIKE '%56%' OR dados::text ILIKE '%56%') ORDER BY criado_em DESC LIMIT 200;

-- Fim do relatório
