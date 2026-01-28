-- ==========================================
-- MIGRATION 013: Corrigir Logica de Status de Avaliacoes e Lotes
-- Descricao: 
--   1. Garantir que avaliacoes inativadas nao possam ter status iniciada/em_andamento
--   2. Atualizar status do lote automaticamente quando todas avaliacoes (exceto inativadas) forem concluidas
-- Data: 2026-01-04
-- Versao: 1.0.0
-- ==========================================

BEGIN;

-- ==========================================
-- 1. TRIGGER: Prevenir status incoerente em avaliacoes
-- ==========================================

CREATE OR REPLACE FUNCTION validar_status_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o status esta sendo alterado para 'inativada', aceitar
  IF NEW.status = 'inativada' THEN
    RETURN NEW;
  END IF;
  
  -- Se a avaliacao JA estava inativada, nao permitir mudar para iniciada/em_andamento
  IF OLD.status = 'inativada' AND NEW.status IN ('iniciada', 'em_andamento') THEN
    RAISE EXCEPTION 'Nao e possivel reativar uma avaliacao inativada. Status atual: %, Status tentado: %', OLD.status, NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se ja existir
DROP TRIGGER IF EXISTS trg_validar_status_avaliacao ON avaliacoes;

-- Criar trigger
CREATE TRIGGER trg_validar_status_avaliacao
  BEFORE UPDATE ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION validar_status_avaliacao();

COMMENT ON FUNCTION validar_status_avaliacao() IS 'Valida que avaliacoes inativadas nao podem voltar a status iniciada ou em_andamento';

-- ==========================================
-- 2. FUNCAO: Verificar se lote deve ser concluido
-- ==========================================

CREATE OR REPLACE FUNCTION verificar_conclusao_lote()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
BEGIN
  -- Pegar o lote_id da avaliacao que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se nao tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliacoes do lote
  SELECT
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'concluida') as concluidas,
    COUNT(*) FILTER (WHERE status = 'inativada') as inativadas,
    COUNT(*) FILTER (WHERE status IN ('iniciada', 'em_andamento')) as pendentes
  INTO
    v_total_avaliacoes,
    v_avaliacoes_concluidas,
    v_avaliacoes_inativadas,
    v_avaliacoes_pendentes
  FROM avaliacoes
  WHERE lote_id = v_lote_id;
  
  -- Se todas as avaliacoes (exceto as inativadas) foram concluidas, marcar lote como concluido
  IF v_avaliacoes_pendentes = 0 AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido'::status_lote,
        atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status != 'concluido'::status_lote;  -- Evitar update desnecessario
    
    RAISE NOTICE 'Lote % marcado como concluido: % concluidas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se ja existir
DROP TRIGGER IF EXISTS trg_verificar_conclusao_lote ON avaliacoes;

-- Criar trigger que dispara APOS UPDATE ou INSERT em avaliacoes
CREATE TRIGGER trg_verificar_conclusao_lote
  AFTER INSERT OR UPDATE OF status ON avaliacoes
  FOR EACH ROW
  EXECUTE FUNCTION verificar_conclusao_lote();

COMMENT ON FUNCTION verificar_conclusao_lote() IS 'Atualiza automaticamente o status do lote para concluido quando todas as avaliacoes (exceto inativadas) estiverem concluidas';

COMMIT;
