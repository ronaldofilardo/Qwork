-- Script: apply-migration-and-inject-hashes.sql
-- 1) Aplica migration que permite atualização restrita do hash em laudos 'enviado'
-- 2) Injeta os hashes fornecidos (idempotente)
-- 3) Registra entradas em audit_logs para rastreabilidade
-- 4) Mostra as linhas atualizadas para verificação

BEGIN;

-- 1) Aplicar função/trigger que permite atualização restrita de hash_pdf
-- (idempotente: CREATE OR REPLACE FUNCTION / DROP+CREATE TRIGGER)
CREATE OR REPLACE FUNCTION public.prevent_update_laudo_enviado()
RETURNS TRIGGER AS $$
BEGIN
  -- Proteção contra DELETE em laudos já enviados
  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'enviado' THEN
      RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
    END IF;
    RETURN OLD;
  END IF;

  -- Proteção contra UPDATE em laudos já enviados
  IF OLD.status = 'enviado' THEN
    -- Permitir exclusivamente atualização de hash_pdf (e atualizado_em) mantendo todos os outros campos idênticos
    IF NEW.status = OLD.status
       AND (OLD.hash_pdf IS DISTINCT FROM NEW.hash_pdf)
       AND (OLD.emitido_em IS NOT DISTINCT FROM NEW.emitido_em)
       AND (OLD.enviado_em IS NOT DISTINCT FROM NEW.enviado_em)
       AND (OLD.observacoes IS NOT DISTINCT FROM NEW.observacoes)
       AND (OLD.emissor_cpf IS NOT DISTINCT FROM NEW.emissor_cpf)
    THEN
      RETURN NEW; -- hash update permitido
    END IF;

    RAISE EXCEPTION 'Laudo enviado não pode ser modificado ou excluído';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_immutable_laudo ON laudos;
CREATE TRIGGER trg_immutable_laudo
BEFORE UPDATE OR DELETE ON public.laudos
FOR EACH ROW EXECUTE FUNCTION public.prevent_update_laudo_enviado();

-- 2) Atualizar hashes (idempotente: só atualiza se campo é nulo ou diferente)
-- Lote 002-070126 -> E929...38F4
UPDATE laudos
SET hash_pdf = 'E929FED9FB3B05CA7A2A774190521ECBAD80C566D50B0DA24BFDE8A608AC38F4', atualizado_em = NOW()
WHERE lote_id = (
  SELECT id FROM lotes_avaliacao WHERE codigo = '002-070126' LIMIT 1
)
AND (hash_pdf IS NULL OR hash_pdf <> 'E929FED9FB3B05CA7A2A774190521ECBAD80C566D50B0DA24BFDE8A608AC38F4');

-- Lote 001-070126 -> CCF0...6A6
UPDATE laudos
SET hash_pdf = 'CCF0EF2ACB403E14801366373373439A6C217DD3EC49BFB5B80AECED1FA9C6A6', atualizado_em = NOW()
WHERE lote_id = (
  SELECT id FROM lotes_avaliacao WHERE codigo = '001-070126' LIMIT 1
)
AND (hash_pdf IS NULL OR hash_pdf <> 'CCF0EF2ACB403E14801366373373439A6C217DD3EC49BFB5B80AECED1FA9C6A6');

-- 3) Auditoria: registrar quem e por que (alterar user_cpf se necessário)
INSERT INTO audit_logs (action, resource, resource_id, new_data, user_cpf, user_perfil, created_at)
SELECT 'hash_injetado', 'laudos', l.id::text, jsonb_build_object('lote_codigo', la.codigo, 'hash', l.hash_pdf, 'motivo', 'injeção manual solicitada'), '00000000000', 'admin', NOW()
FROM laudos l
JOIN lotes_avaliacao la ON la.id = l.lote_id
WHERE la.codigo IN ('002-070126','001-070126')
  AND l.hash_pdf IS NOT NULL
  -- Inserir apenas se ainda não houver uma entrada similar (evitar duplicidade)
  AND NOT EXISTS (
    SELECT 1 FROM audit_logs a
    WHERE a.action = 'hash_injetado'
      AND a.resource = 'laudos'
      AND a.resource_id = l.id::text
  );

-- 4) Verificação: retornar as linhas afetadas
SELECT l.id, l.lote_id, la.codigo, l.hash_pdf
FROM laudos l
JOIN lotes_avaliacao la ON la.id = l.lote_id
WHERE la.codigo IN ('002-070126','001-070126');

COMMIT;
