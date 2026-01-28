-- Migração 052: Limpeza e padronização do fluxo personalizado
-- Data: 19/01/2026
-- Descrição: Garante que contratacao_personalizada seja usada exclusivamente para personalizado,
-- remove duplicações com contratos, e padroniza estados.

BEGIN;

-- 1. Limpar registros inconsistentes (planos fixos não devem estar em contratacao_personalizada)
DELETE FROM contratacao_personalizada 
WHERE contratante_id IN (
    SELECT c.id FROM contratantes c
    JOIN planos p ON c.plano_id = p.id 
    WHERE p.tipo = 'fixo'
);

-- 2. Garantir índices para performance
CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_status 
ON contratacao_personalizada (status);

CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_criado_em 
ON contratacao_personalizada (criado_em DESC);

CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_payment_link 
ON contratacao_personalizada (payment_link_token) WHERE payment_link_token IS NOT NULL;

-- 3. Atualizar comentários
COMMENT ON TABLE contratacao_personalizada IS 'Fluxo exclusivo para planos personalizados: aguardando_valor_admin → valor_definido → aguardando_pagamento → pago → ativo';
COMMENT ON COLUMN contratacao_personalizada.status IS 'Estados: aguardando_valor_admin, valor_definido, aguardando_pagamento, pago, ativo, rejeitado, cancelado';
COMMENT ON COLUMN contratacao_personalizada.payment_link_token IS 'Token único e seguro para link de pagamento personalizado (48h validade)';
COMMENT ON COLUMN contratacao_personalizada.payment_link_expiracao IS 'Data/hora de expiração do link de pagamento';

-- 4. Garantir coluna de log de envio
ALTER TABLE contratacao_personalizada 
ADD COLUMN IF NOT EXISTS link_enviado_em TIMESTAMP;

COMMENT ON COLUMN contratacao_personalizada.link_enviado_em IS 'Timestamp de quando o link foi gerado/enviado ao contratante';

COMMIT;

SELECT '✓ Migração 052 aplicada com sucesso' AS status;
