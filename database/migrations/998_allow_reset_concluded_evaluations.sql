-- ============================================================================
-- Migration 998: Permitir Reset de Avaliações Concluídas
-- Data: 2026-02-04
-- Descrição: Modifica trigger de imutabilidade para permitir reset autorizado
-- ============================================================================

BEGIN;

\echo '========================================='
\echo 'MIGRATION 998: ALLOW RESET CONCLUDED EVALUATIONS'
\echo '========================================='

-- Recriar função para verificar flag de reset autorizado
CREATE OR REPLACE FUNCTION public.check_resposta_immutability()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
  v_allow_reset BOOLEAN;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT status INTO v_status FROM avaliacoes WHERE id = OLD.avaliacao_id;
    
    -- Verificar se reset está autorizado via contexto de sessão
    BEGIN
      v_allow_reset := COALESCE(current_setting('app.allow_reset', true)::BOOLEAN, false);
    EXCEPTION WHEN OTHERS THEN
      v_allow_reset := false;
    END;
    
    -- Se avaliação concluída e reset NÃO autorizado, bloquear
    IF v_status = 'concluida' AND NOT v_allow_reset THEN
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

COMMENT ON FUNCTION public.check_resposta_immutability() IS 
'Bloqueia UPDATE/DELETE em respostas quando avaliação está concluída, exceto se app.allow_reset=true';

\echo 'Função check_resposta_immutability atualizada com sucesso!'

COMMIT;

\echo '✅ Migration concluída com sucesso!'
