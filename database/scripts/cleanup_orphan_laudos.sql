-- Script de limpeza: Remover laudos órfãos criados automaticamente antes da migration 151
-- Data: 2026-02-02
-- Motivo: Laudos em status 'rascunho' sem emissor_cpf nem emitido_em foram criados
--         pelo trigger fn_reservar_id_laudo_on_lote_insert (removido na migration 151)

BEGIN;

-- Desabilitar temporariamente a policy RLS que bloqueia admin
ALTER TABLE laudos DISABLE ROW LEVEL SECURITY;

-- Remover laudos órfãos (rascunho sem emissor nem emissão)
DELETE FROM laudos 
WHERE status = 'rascunho' 
  AND emitido_em IS NULL 
  AND (emissor_cpf IS NULL OR emissor_cpf = '' OR LENGTH(TRIM(emissor_cpf)) = 0);

-- Reabilitar RLS
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;

-- Verificar resultado
SELECT la.id,  l.id AS laudo_id, l.status, l.emitido_em 
FROM lotes_avaliacao la 
LEFT JOIN laudos l ON la.id = l.lote_id 
ORDER BY la.id;

COMMIT;
