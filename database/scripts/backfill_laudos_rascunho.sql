-- Script de backfill: Criar laudos rascunho para lotes existentes
-- Data: 2026-02-02
BEGIN;

-- Configurar contexto para bypass de auditoria
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';
SET LOCAL app.system_bypass = 'true';

-- Criar laudos rascunho para lotes sem laudo
INSERT INTO laudos (id, lote_id, status, criado_em, atualizado_em) 
SELECT id, id, 'rascunho', NOW(), NOW() 
FROM lotes_avaliacao 
WHERE id NOT IN (SELECT lote_id FROM laudos WHERE lote_id IS NOT NULL) 
  AND status != 'cancelado'
ON CONFLICT (id) DO NOTHING;

-- Mostrar resultado
SELECT la.id,  la.status AS lote_status, l.id AS laudo_id, l.status AS laudo_status
FROM lotes_avaliacao la
LEFT JOIN laudos l ON la.id = l.lote_id
WHERE la.id >= 5
ORDER BY la.id;

COMMIT;
