-- Migration 801: Remove expiração de links - Sistema de uso único
-- Autor: Sistema
-- Data: 2026-02-09
-- Descrição: Remove lógica de expiração e implementa sistema de links de uso único

BEGIN;

-- 1. Dropar dependências temporariamente
DROP VIEW IF EXISTS v_solicitacoes_emissao;
DROP TRIGGER IF EXISTS trg_audit_status_pagamento ON lotes_avaliacao;

-- 2. Remover valor 'expirado' do enum (primeiro precisamos atualizar registros existentes)
UPDATE lotes_avaliacao 
SET status_pagamento = 'aguardando_cobranca' 
WHERE status_pagamento = 'expirado';

-- 3. Recriar enum sem 'expirado'
ALTER TYPE status_pagamento RENAME TO status_pagamento_old;

CREATE TYPE status_pagamento AS ENUM (
    'aguardando_cobranca',
    'aguardando_pagamento',
    'pago'
);

-- Converter coluna para o novo tipo    
ALTER TABLE lotes_avaliacao 
    ALTER COLUMN status_pagamento TYPE status_pagamento 
    USING (status_pagamento::text)::status_pagamento;

DROP TYPE status_pagamento_old;

-- 4. Remover coluna de expiração
ALTER TABLE lotes_avaliacao 
    DROP COLUMN IF EXISTS link_pagamento_expira_em;

-- 5. Remover índice de expiração (se existir)
DROP INDEX IF EXISTS idx_lotes_avaliacao_expiracao_pagamento;

-- 6. Recriar view sem campo de expiração
CREATE OR REPLACE VIEW v_solicitacoes_emissao AS
SELECT 
    la.id AS lote_id,
    la.status_pagamento,
    la.solicitacao_emissao_em,
    la.valor_por_funcionario,
    la.link_pagamento_token,
    la.link_pagamento_enviado_em,
    la.pagamento_metodo,
    la.pagamento_parcelas,
    la.pago_em,
    e.nome AS empresa_nome,
    COALESCE(c.nome, e.nome) AS nome_tomador,
    u.nome AS solicitante_nome,
    u.cpf AS solicitante_cpf,
    COUNT(a.id) AS num_avaliacoes_concluidas,
    la.valor_por_funcionario * COUNT(a.id) AS valor_total_calculado,
    la.criado_em AS lote_criado_em,
    la.liberado_em AS lote_liberado_em,
    la.status AS lote_status
FROM lotes_avaliacao la
JOIN empresas_clientes e ON e.id = la.empresa_id
LEFT JOIN clinicas c ON c.id = la.clinica_id
LEFT JOIN usuarios u ON u.cpf = la.liberado_por
LEFT JOIN avaliacoes a ON a.lote_id = la.id AND a.status = 'concluida'
WHERE la.status_pagamento IS NOT NULL
GROUP BY 
    la.id, e.nome, c.nome, u.nome, u.cpf
ORDER BY la.solicitacao_emissao_em DESC NULLS LAST;

-- 7. Recriar trigger de auditoria
CREATE TRIGGER trg_audit_status_pagamento
    AFTER UPDATE ON lotes_avaliacao
    FOR EACH ROW
    WHEN (OLD.status_pagamento IS DISTINCT FROM NEW.status_pagamento)
    EXECUTE FUNCTION audit_status_pagamento_change();

-- 8. Atualizar comentários
COMMENT ON COLUMN lotes_avaliacao.status_pagamento IS 
    'Status do pagamento: aguardando_cobranca, aguardando_pagamento, pago (link de uso único - pode ser regenerado)';

COMMENT ON COLUMN lotes_avaliacao.link_pagamento_token IS 
    'Token UUID de uso único para acesso público. Após uso (pago), novo token pode ser gerado';

COMMIT;
