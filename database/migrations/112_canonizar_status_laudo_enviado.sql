-- MIGRATION 112: Canonizar status de laudo para 'enviado' e prevenir duplicação
-- Data: 2026-01-16
-- Objetivo: Garantir que apenas um laudo 'enviado' exista por lote

BEGIN;

-- 1. Atualizar laudos existentes com status 'rascunho' ou 'emitido' para 'enviado'
UPDATE laudos
SET status = 'enviado',
    enviado_em = COALESCE(enviado_em, emitido_em, NOW()),
    atualizado_em = NOW()
WHERE status IN ('rascunho', 'emitido');

-- 2. Remover constraint antigo se existir
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;

-- 3. Adicionar novo constraint que aceita apenas 'enviado'
ALTER TABLE laudos
ADD CONSTRAINT laudos_status_check CHECK (status = 'enviado');

-- 4. Criar índice único parcial para prevenir duplicação de laudos por lote
CREATE UNIQUE INDEX IF NOT EXISTS idx_laudos_unico_enviado 
ON laudos(lote_id) 
WHERE status = 'enviado';

-- 5. Comentários
COMMENT ON CONSTRAINT laudos_status_check ON laudos IS 
  'Status de laudo: apenas "enviado" (emissão é automática e imediata)';

COMMENT ON INDEX idx_laudos_unico_enviado IS 
  'Previne duplicação: apenas um laudo enviado por lote';

-- 6. Verificação
SELECT 
    status,
    COUNT(*) as total,
    COUNT(DISTINCT lote_id) as lotes_unicos
FROM laudos
GROUP BY status;

COMMIT;

-- Rollback instructions:
-- BEGIN;
-- DROP INDEX IF EXISTS idx_laudos_unico_enviado;
-- ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;
-- ALTER TABLE laudos ADD CONSTRAINT laudos_status_check 
--   CHECK (status IN ('rascunho', 'emitido', 'enviado'));
-- COMMIT;
