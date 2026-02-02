-- Script de reset de laudos para reprocessamento
-- Autorizado por: Ronaldo Filardo
-- Data: 2026-01-30
-- Motivo: Laudos criados sem passar pelo fluxo correto da fila_emissao (desenvolvimento/testes)

BEGIN;

-- Bypass de segurança para operações do sistema
SET LOCAL app.system_bypass = 'true';
SET LOCAL app.current_user_cpf = '00000000000';
SET LOCAL app.current_user_perfil = 'admin';

-- Registrar na auditoria a autorização para deleção
INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, details, created_at)
VALUES 
  (NULL, 'admin', 'DELETE_LAUDOS_AUTHORIZED', 'laudos', 'batch', 
   'Deleção autorizada por Ronaldo Filardo para reprocessamento de 14 laudos criados sem fluxo correto da fila_emissao. Lotes: 2,3,4,6,7,8,9,10,11,13,15,16,17,18', 
   NOW());

-- Desabilitar temporariamente o trigger de imutabilidade
ALTER TABLE laudos DISABLE TRIGGER enforce_laudo_immutability;

-- Deletar os laudos (CASCADE vai deletar registros relacionados)
DELETE FROM laudos 
WHERE lote_id IN (2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 18);

-- Reabilitar o trigger de imutabilidade
ALTER TABLE laudos ENABLE TRIGGER enforce_laudo_immutability;

-- Criar registros na fila_emissao para reprocessamento
-- Usando o timestamp de liberação do lote como solicitado_em
INSERT INTO fila_emissao (lote_id, solicitado_em, solicitado_por, tipo_solicitante, tentativas, max_tentativas)
SELECT 
  la.id,
  la.liberado_em,
  la.liberado_por,
  CASE 
    WHEN f.perfil = 'rh' THEN 'rh'
    WHEN f.perfil = 'gestor_entidade' THEN 'gestor_entidade'
    ELSE 'admin'
  END,
  0,  -- Resetar tentativas para 0 (pronto para processar)
  3
FROM lotes_avaliacao la
LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
WHERE la.id IN (2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 18)
ON CONFLICT (lote_id) DO UPDATE SET
  tentativas = 0,
  proxima_tentativa = NOW(),
  erro = NULL,
  solicitado_em = EXCLUDED.solicitado_em,
  solicitado_por = EXCLUDED.solicitado_por,
  tipo_solicitante = EXCLUDED.tipo_solicitante;

-- Registrar na auditoria a criação dos registros na fila
INSERT INTO audit_logs (user_cpf, user_perfil, action, resource, resource_id, details, created_at)
VALUES 
  (NULL, 'admin', 'CREATE_FILA_EMISSAO', 'fila_emissao', 'batch', 
   'Criados 14 registros na fila_emissao para reprocessamento dos lotes após deleção autorizada', 
   NOW());

COMMIT;

-- Verificar resultado
SELECT 
  la.id as lote_id,
  la.codigo,
  la.status as lote_status,
  fe.id as fila_id,
  fe.solicitado_em,
  fe.solicitado_por,
  fe.tentativas,
  l.id as laudo_id
FROM lotes_avaliacao la
INNER JOIN fila_emissao fe ON la.id = fe.lote_id
LEFT JOIN laudos l ON la.id = l.lote_id
WHERE la.id IN (2, 3, 4, 6, 7, 8, 9, 10, 11, 13, 15, 16, 17, 18)
ORDER BY la.id;
