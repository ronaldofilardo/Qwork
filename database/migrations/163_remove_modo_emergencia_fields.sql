-- Migration 163: Remover modo emergência completamente do sistema
-- Data: 2026-02-03
-- Descrição: Remove campos modo_emergencia e motivo_emergencia da tabela lotes_avaliacao
--            e da view v_auditoria_emissoes. O modo emergência foi descontinuado.

-- 1. Remover campos da tabela lotes_avaliacao
ALTER TABLE lotes_avaliacao 
  DROP COLUMN IF EXISTS modo_emergencia CASCADE,
  DROP COLUMN IF EXISTS motivo_emergencia CASCADE;

COMMENT ON TABLE lotes_avaliacao IS 'Tabela de lotes de avaliação - modo emergência removido em 2026-02-03';

-- 2. Recriar view v_auditoria_emissoes sem campos de emergência
DROP VIEW IF EXISTS v_auditoria_emissoes CASCADE;

CREATE OR REPLACE VIEW v_auditoria_emissoes AS
SELECT 
    la.id AS lote_id,
    la.empresa_id,
    la.numero_ordem,
    la.titulo,
    la.status AS lote_status,
    la.emitido_em,
    la.enviado_em,
    la.processamento_em,
    la.criado_em AS lote_criado_em,
    ec.nome AS empresa_nome,
    ec.cnpj AS empresa_cnpj,
    c.nome AS clinica_nome,
    COUNT(DISTINCT a.id) AS total_avaliacoes,
    COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) AS avaliacoes_concluidas,
    l.hash_pdf,
    l.arquivo_remoto_url,
    l.enviado_em AS laudo_enviado_em,
    l.emitido_em AS laudo_emitido_em
FROM lotes_avaliacao la
JOIN empresas_clientes ec ON la.empresa_id = ec.id
JOIN clinicas c ON ec.clinica_id = c.id
LEFT JOIN avaliacoes a ON la.id = a.lote_id
LEFT JOIN laudos l ON la.id = l.lote_id
GROUP BY 
    la.id,
    la.empresa_id,
    la.numero_ordem,
    la.titulo,
    la.status,
    la.emitido_em,
    la.enviado_em,
    la.processamento_em,
    la.criado_em,
    ec.nome,
    ec.cnpj,
    c.nome,
    l.hash_pdf,
    l.arquivo_remoto_url,
    l.enviado_em,
    l.emitido_em;

COMMENT ON VIEW v_auditoria_emissoes IS 'View de auditoria de emissões de laudos - sem modo emergência';

-- 3. Limpar registros de audit_logs relacionados a emergência
DELETE FROM audit_logs 
WHERE action IN ('modo_emergencia_ativado', 'emissao_emergencial', 'emergencia_laudo')
   OR details::text LIKE '%modo_emergencia%'
   OR details::text LIKE '%motivo_emergencia%';

COMMENT ON TABLE audit_logs IS 'Logs de auditoria - registros de emergência removidos em 2026-02-03';

-- Fim da migration 163
