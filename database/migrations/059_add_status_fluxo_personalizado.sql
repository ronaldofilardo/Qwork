-- Migration 059: Adicionar novos status ao fluxo personalizado
-- Data: 20/01/2026
-- Descrição: Adiciona status intermediários para fluxo: proposta → contrato → pagamento

BEGIN;

-- Atualizar enum de status do contratante se necessário
-- Nota: PostgreSQL não permite ALTER TYPE ADD VALUE em transação, então fazemos separado

-- Comentários sobre os novos status esperados:
-- aguardando_aceite: Contratante recebeu link da proposta, aguardando aceite
-- aguardando_aceite_contrato: Aceitou proposta, aguardando aceite do contrato padrão
-- aguardando_pagamento: Aceitou contrato, aguardando pagamento

-- Criar índice para performance em queries de status
CREATE INDEX IF NOT EXISTS idx_contratacao_personalizada_status 
ON contratacao_personalizada(status);

CREATE INDEX IF NOT EXISTS idx_tomadores_status 
ON tomadores(status);

-- Adicionar comentários explicativos
COMMENT ON COLUMN contratacao_personalizada.status IS 'aguardando_valor_admin | valor_definido | aguardando_aceite_contrato | aguardando_pagamento | pago | cancelado';
COMMENT ON COLUMN tomadores.status IS 'pendente | aguardando_aceite | aguardando_aceite_contrato | aguardando_pagamento | ativo | inativo | cancelado';

COMMIT;

SELECT '✓ Migration 059 aplicada com sucesso - Novos status para fluxo personalizado' AS status;
