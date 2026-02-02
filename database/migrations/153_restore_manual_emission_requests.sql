-- Migration 153: Restaurar Solicitações Manuais de Emissão
-- Data: 2026-02-01
-- Descrição: Restaura registros de solicitação manual (RH/Entidade) que foram 
--            deletados pela migration 150. Usa dados da auditoria_laudos para 
--            reconstruir a fila_emissao.
--
-- IMPORTANTE: Esta migration corrige o bug onde a migration 150 deletou 
--            solicitações manuais junto com registros automáticos antigos.

BEGIN;

-- 1. Restaurar solicitações manuais que foram deletadas
-- Critério: auditoria_laudos com acao='solicitacao_manual' mas sem registro na fila_emissao
INSERT INTO fila_emissao (
  lote_id, 
  solicitado_por, 
  solicitado_em, 
  tipo_solicitante
)
SELECT DISTINCT ON (a.lote_id)
  a.lote_id,
  a.emissor_cpf as solicitado_por,
  a.criado_em as solicitado_em,
  CASE 
    -- Inferir tipo_solicitante a partir do perfil na auditoria ou padrão 'rh'
    WHEN a.observacoes ILIKE '%gestor_entidade%' THEN 'gestor_entidade'
    WHEN a.observacoes ILIKE '%entidade%' THEN 'gestor_entidade'
    ELSE 'rh'
  END as tipo_solicitante
FROM auditoria_laudos a
LEFT JOIN fila_emissao fe ON fe.lote_id = a.lote_id
WHERE 
  a.acao = 'solicitacao_manual' 
  AND a.status = 'pendente'
  AND fe.id IS NULL -- não existe registro na fila_emissao
  AND NOT EXISTS (
    -- não tem laudo emitido ainda
    SELECT 1 FROM laudos l 
    WHERE l.lote_id = a.lote_id 
      AND (l.status = 'enviado' OR l.hash_pdf IS NOT NULL)
  )
ORDER BY a.lote_id, a.criado_em DESC -- pega a solicitação mais recente por lote
ON CONFLICT (lote_id) DO NOTHING;

-- 2. Log de quantas solicitações foram restauradas
DO $$
DECLARE
  registros_restaurados INT;
BEGIN
  GET DIAGNOSTICS registros_restaurados = ROW_COUNT;
  RAISE NOTICE 'Migration 153: % solicitações manuais restauradas na fila_emissao', registros_restaurados;
END $$;

-- 3. Verificar integridade
-- Garantir que todos os lotes com solicitacao_manual na auditoria têm registro na fila ou laudo emitido
DO $$
DECLARE
  registros_pendentes INT;
BEGIN
  SELECT COUNT(DISTINCT a.lote_id) INTO registros_pendentes
  FROM auditoria_laudos a
  LEFT JOIN fila_emissao fe ON fe.lote_id = a.lote_id
  LEFT JOIN laudos l ON l.lote_id = a.lote_id
  WHERE 
    a.acao = 'solicitacao_manual'
    AND a.status = 'pendente'
    AND fe.id IS NULL -- não está na fila
    AND (l.id IS NULL OR (l.status != 'enviado' AND l.hash_pdf IS NULL)); -- não tem laudo emitido
  
  IF registros_pendentes > 0 THEN
    RAISE WARNING 'Migration 153: Ainda existem % solicitações manuais sem registro na fila_emissao ou laudo emitido. Verifique manualmente.', registros_pendentes;
  ELSE
    RAISE NOTICE 'Migration 153: ✓ Todas as solicitações manuais estão consistentes (fila_emissao ou laudo emitido)';
  END IF;
END $$;

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN;
-- DELETE FROM fila_emissao 
-- WHERE lote_id IN (
--   SELECT lote_id FROM auditoria_laudos 
--   WHERE acao = 'solicitacao_manual'
-- )
-- AND tipo_solicitante IS NOT NULL;
-- COMMIT;
