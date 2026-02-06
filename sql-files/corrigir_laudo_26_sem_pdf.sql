-- Correção especial: Reverter laudo 26 que está "emitido" mas sem PDF físico
-- Este script desabilita temporariamente o trigger para permitir a correção

BEGIN;

-- Desabilitar trigger temporariamente
ALTER TABLE laudos DISABLE TRIGGER trg_validar_laudo_emitido;

-- Reverter laudo 26 para rascunho
UPDATE laudos 
SET status = 'rascunho',
    hash_pdf = NULL,
    emitido_em = NULL,
    atualizado_em = NOW()
WHERE id = 26;

-- Registrar correção no audit log (sem user_cpf pois é correção de sistema)
INSERT INTO audit_logs (action, resource, resource_id, created_at, new_data)
VALUES (
  'correcao_laudo_sem_pdf_fisico',
  'laudos',
  '26',
  NOW(),
  jsonb_build_object(
    'motivo', 'Laudo estava marcado como emitido mas arquivo PDF não existe em storage',
    'status_anterior', 'emitido',
    'novo_status', 'rascunho',
    'acao', 'Permitir regeneração com PDF físico'
  )
);

-- Reabilitar trigger
ALTER TABLE laudos ENABLE TRIGGER trg_validar_laudo_emitido;

-- Verificar resultado
SELECT id, lote_id, status, hash_pdf, emitido_em 
FROM laudos 
WHERE id = 26;

COMMIT;
