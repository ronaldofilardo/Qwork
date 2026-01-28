-- Migration 012: Simplificar estados de laudo para apenas 'enviado'
-- Objetivo: Remover estados 'rascunho' e 'emitido' pois emissão é automática

-- 1. Verificar laudos com status antigos
SELECT status, COUNT(*) as total
FROM laudos
GROUP BY
    status;

-- 2. Migrar laudos em 'rascunho' ou 'emitido' para 'enviado' (dados legados)
UPDATE laudos
SET
    status = 'enviado',
    enviado_em = COALESCE(enviado_em, emitido_em, NOW()),
    atualizado_em = NOW()
WHERE
    status IN ('rascunho', 'emitido');

-- 3. Atualizar constraint para aceitar apenas 'enviado'
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS laudos_status_check;

ALTER TABLE laudos
ADD CONSTRAINT laudos_status_check CHECK (status IN ('enviado'));

-- 4. Atualizar comentário da coluna
COMMENT ON COLUMN laudos.status IS 'Status do laudo: apenas "enviado" (emissão é automática)';

-- 5. Verificar resultado
SELECT
    status,
    COUNT(*) as total,
    MIN(criado_em) as mais_antigo,
    MAX(criado_em) as mais_recente
FROM laudos
GROUP BY
    status;

SELECT 'Migration 012 concluída - Status de laudo simplificado para apenas "enviado"' as resultado;