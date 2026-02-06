-- ========================================
-- MIGRAÇÃO: Garantir Imutabilidade de Laudos
-- Data: 2026-02-05
-- Objetivo: Impedir que laudos sejam marcados como 'emitido' sem PDF físico
-- ========================================

-- ETAPA 1: Criar função de validação
CREATE OR REPLACE FUNCTION fn_validar_laudo_emitido()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que hash_pdf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.hash_pdf IS NULL OR NEW.hash_pdf = '') THEN
    RAISE EXCEPTION 'Laudo % não pode ser marcado como emitido sem hash_pdf (violação de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emitido_em existe quando status='emitido'
  IF NEW.status = 'emitido' AND NEW.emitido_em IS NULL THEN
    RAISE EXCEPTION 'Laudo % não pode ser marcado como emitido sem emitido_em (violação de imutabilidade)', NEW.id;
  END IF;
  
  -- Validar que emissor_cpf existe quando status='emitido'
  IF NEW.status = 'emitido' AND (NEW.emissor_cpf IS NULL OR NEW.emissor_cpf = '') THEN
    RAISE EXCEPTION 'Laudo % não pode ser marcado como emitido sem emissor_cpf (violação de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudança de hash_pdf se laudo já foi emitido (imutabilidade)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf THEN
    RAISE EXCEPTION 'Laudo % já foi emitido - hash_pdf não pode ser alterado (violação de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir mudança de emitido_em se laudo já foi emitido
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND OLD.emitido_em IS DISTINCT FROM NEW.emitido_em THEN
    RAISE EXCEPTION 'Laudo % já foi emitido - emitido_em não pode ser alterado (violação de imutabilidade)', NEW.id;
  END IF;
  
  -- Impedir reversão de status 'emitido' para 'rascunho' (exceto em caso de erro - permitir se hash_pdf NULL)
  IF TG_OP = 'UPDATE' AND OLD.status = 'emitido' AND NEW.status = 'rascunho' AND OLD.hash_pdf IS NOT NULL THEN
    RAISE EXCEPTION 'Laudo % já foi emitido e não pode voltar para rascunho (violação de imutabilidade)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_validar_laudo_emitido() IS 
'Valida o princípio da imutabilidade de laudos: somente permite status=emitido quando hash_pdf, emitido_em e emissor_cpf existem';

-- ETAPA 2: Criar trigger
DROP TRIGGER IF EXISTS trg_validar_laudo_emitido ON laudos;
CREATE TRIGGER trg_validar_laudo_emitido
  BEFORE INSERT OR UPDATE ON laudos
  FOR EACH ROW
  EXECUTE FUNCTION fn_validar_laudo_emitido();

COMMENT ON TRIGGER trg_validar_laudo_emitido ON laudos IS
'Garante que laudos só sejam marcados como emitido quando PDF físico foi gerado (hash existe)';

-- ETAPA 3: Adicionar constraints (check redundante para garantia extra)
DO $$ 
BEGIN
  -- Constraint: hash_pdf obrigatório quando status='emitido'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_laudos_hash_when_emitido'
  ) THEN
    ALTER TABLE laudos 
    ADD CONSTRAINT chk_laudos_hash_when_emitido 
    CHECK (
      (status = 'emitido' AND hash_pdf IS NOT NULL AND hash_pdf != '') 
      OR status != 'emitido'
    );
    RAISE NOTICE 'Constraint chk_laudos_hash_when_emitido criada';
  END IF;

  -- Constraint: emitido_em obrigatório quando status='emitido'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_laudos_emitido_em_when_emitido'
  ) THEN
    ALTER TABLE laudos 
    ADD CONSTRAINT chk_laudos_emitido_em_when_emitido 
    CHECK (
      (status = 'emitido' AND emitido_em IS NOT NULL) 
      OR status != 'emitido'
    );
    RAISE NOTICE 'Constraint chk_laudos_emitido_em_when_emitido criada';
  END IF;

  -- Constraint: emissor_cpf obrigatório quando status='emitido'
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chk_laudos_emissor_when_emitido'
  ) THEN
    ALTER TABLE laudos 
    ADD CONSTRAINT chk_laudos_emissor_when_emitido 
    CHECK (
      (status = 'emitido' AND emissor_cpf IS NOT NULL AND emissor_cpf != '') 
      OR status != 'emitido'
    );
    RAISE NOTICE 'Constraint chk_laudos_emissor_when_emitido criada';
  END IF;
END $$;

-- ETAPA 4: Identificar laudos problemáticos
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM laudos
  WHERE status = 'emitido'
    AND (hash_pdf IS NULL OR hash_pdf = '' OR emitido_em IS NULL);
  
  IF v_count > 0 THEN
    RAISE WARNING 'Encontrados % laudos com status=emitido mas sem hash_pdf ou emitido_em', v_count;
    RAISE WARNING 'Execute o script de correção para reverter esses laudos para rascunho';
  ELSE
    RAISE NOTICE 'Nenhum laudo problemático encontrado - todos os laudos emitidos têm hash_pdf e emitido_em';
  END IF;
END $$;

-- ETAPA 5: Script de correção (comentado - executar manualmente se necessário)
/*
-- ATENÇÃO: Este script reverte laudos problemáticos para rascunho
-- Executar SOMENTE após backup e validação manual

UPDATE laudos
SET status = 'rascunho',
    hash_pdf = NULL,
    emitido_em = NULL,
    atualizado_em = NOW()
WHERE status = 'emitido'
  AND (
    hash_pdf IS NULL 
    OR hash_pdf = '' 
    OR emitido_em IS NULL
    OR emissor_cpf IS NULL
  );

-- Registrar correção no audit log
INSERT INTO audit_logs (action, resource, resource_id, user_cpf, user_perfil, created_at, new_data)
SELECT 
  'correcao_laudo_sem_pdf',
  'laudos',
  id::text,
  'system',
  'admin',
  NOW(),
  jsonb_build_object(
    'motivo', 'Laudo estava como emitido sem hash_pdf/emitido_em',
    'novo_status', 'rascunho'
  )
FROM laudos
WHERE status = 'rascunho'
  AND atualizado_em > NOW() - INTERVAL '1 minute';
*/

-- ETAPA 6: Validação final
SELECT 
  status,
  COUNT(*) as total,
  COUNT(hash_pdf) as com_hash,
  COUNT(emitido_em) as com_emitido_em,
  COUNT(emissor_cpf) as com_emissor
FROM laudos
GROUP BY status
ORDER BY status;
