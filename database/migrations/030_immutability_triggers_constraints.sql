-- ==========================================
-- MIGRATION: Imutabilidade - triggers e constraints
-- Descrição: Adiciona triggers que impedem UPDATE/DELETE/INSERT quando regras de imutabilidade
-- forem satisfeitas (ex.: laudos emitidos, avaliações concluídas) e cria CHECKs estáticos
-- Data: 2026-01-25
-- ==========================================

BEGIN;

\echo 'Adicionando CHECK constraint em laudos: emitido_em -> emissor_cpf';

-- Regra simples/estática: se houver data de emissão, emissor_cpf deve estar preenchido.
-- Postgres não suporta 'ADD CONSTRAINT IF NOT EXISTS' em todas as versões; usar DO block idempotente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.check_constraints cc
    JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name AND cc.constraint_schema = tc.constraint_schema
    WHERE tc.table_schema = 'public' AND tc.table_name = 'laudos' AND cc.constraint_name = 'chk_laudos_emitido_em_emissor_cpf'
  ) THEN
    EXECUTE 'ALTER TABLE public.laudos ADD CONSTRAINT chk_laudos_emitido_em_emissor_cpf CHECK (emitido_em IS NULL OR emissor_cpf IS NOT NULL) NOT VALID';
  END IF;
END$$;

-- Validar constraint (se houver linhas inválidas, o comando vai falhar, portanto mantemos NOT VALID até revisão manual)
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.laudos VALIDATE CONSTRAINT chk_laudos_emitido_em_emissor_cpf;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint chk_laudos_emitido_em_emissor_cpf left NOT VALID: %', SQLERRM;
  END;
END$$;

\echo 'Criando função trigger: check_resposta_immutability';

CREATE OR REPLACE FUNCTION public.check_resposta_immutability()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar respostas de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Respostas de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_resposta_immutability() IS 'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída';

-- Trigger
DROP TRIGGER IF EXISTS trigger_resposta_immutability ON respostas;
CREATE TRIGGER trigger_resposta_immutability
  BEFORE DELETE OR UPDATE ON respostas
  FOR EACH ROW EXECUTE FUNCTION public.check_resposta_immutability();

\echo 'Criando função trigger: check_resultado_immutability';

CREATE OR REPLACE FUNCTION public.check_resultado_immutability()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido modificar resultados de avaliações concluídas. Avaliação ID: %', OLD.avaliacao_id
        USING HINT = 'Resultados de avaliações concluídas são imutáveis para garantir integridade dos dados.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = NEW.avaliacao_id;
    IF v_status = 'concluida' THEN
      RAISE EXCEPTION 'Não é permitido adicionar resultados a avaliações já concluídas. Avaliação ID: %', NEW.avaliacao_id
        USING HINT = 'Finalize a avaliação antes de tentar adicionar resultados novamente.', ERRCODE = '23506';
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_resultado_immutability() IS 'Bloqueia modificações/inserções em resultados quando avaliação está concluída';

DROP TRIGGER IF EXISTS trigger_resultado_immutability ON resultados;
CREATE TRIGGER trigger_resultado_immutability
  BEFORE INSERT OR DELETE OR UPDATE ON resultados
  FOR EACH ROW EXECUTE FUNCTION public.check_resultado_immutability();

\echo 'Criando funções para proteger lotes/avaliações quando houver laudos emitidos';

CREATE OR REPLACE FUNCTION public.prevent_modification_lote_when_laudo_emitted()
RETURNS TRIGGER AS $$
DECLARE
  v_has_laudo BOOLEAN := FALSE;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    -- desligar temporariamente row level security para a checagem interna
    PERFORM set_config('row_security', 'off', true);
    SELECT EXISTS(SELECT 1 FROM laudos WHERE lote_id = OLD.id AND emitido_em IS NOT NULL) INTO v_has_laudo;
    IF v_has_laudo THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar lote %: laudo já emitido.', OLD.id
        USING HINT = 'Lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_modification_lote_when_laudo_emitted() IS 'Impede UPDATE/DELETE em lotes quando houver laudo emitido para o lote';

DROP TRIGGER IF EXISTS trg_protect_lote_after_emit ON lotes_avaliacao;
CREATE TRIGGER trg_protect_lote_after_emit
  BEFORE UPDATE OR DELETE ON lotes_avaliacao
  FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_lote_when_laudo_emitted();

CREATE OR REPLACE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted()
RETURNS TRIGGER AS $$
DECLARE
  v_count INTEGER;
  v_lote INTEGER;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    v_lote := COALESCE(NEW.lote_id, OLD.lote_id);
    SELECT COUNT(*) INTO v_count FROM laudos WHERE lote_id = v_lote AND emitido_em IS NOT NULL;
    IF v_count > 0 THEN
      RAISE EXCEPTION 'Não é permitido alterar/deletar avaliação %: laudo do lote % já foi emitido.', COALESCE(NEW.id, OLD.id), v_lote
        USING HINT = 'Avaliações pertencentes a lotes com laudos emitidos são imutáveis.', ERRCODE = '23506';
    END IF;
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.prevent_modification_avaliacao_when_lote_emitted() IS 'Impede UPDATE/DELETE em avaliações quando o lote já possui laudo emitido';

DROP TRIGGER IF EXISTS trg_protect_avaliacao_after_emit ON avaliacoes;
CREATE TRIGGER trg_protect_avaliacao_after_emit
  BEFORE UPDATE OR DELETE ON avaliacoes
  FOR EACH ROW EXECUTE FUNCTION public.prevent_modification_avaliacao_when_lote_emitted();

COMMIT;

\echo 'Migration 030: imutabilidade aplicada.';
