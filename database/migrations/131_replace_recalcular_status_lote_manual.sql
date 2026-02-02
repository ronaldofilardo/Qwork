-- ==========================================
-- MIGRATION 131: Substituir fn_recalcular_status_lote por versão MANUAL
-- ==========================================
-- Data: 2026-01-31
-- Descrição: Substitui a função de recálculo de status que AGENDAVA
--            emissão automática por versão que APENAS atualiza status
-- 
-- Comportamento ANTIGO (REMOVIDO):
--   - Quando todas avaliações concluídas → status='concluido'
--   - E agendava: auto_emitir_agendado=true, auto_emitir_em=NOW()+10min
--
-- Comportamento NOVO (MANUAL):
--   - Quando todas avaliações concluídas → status='concluido'
--   - SEM agendar emissão (emissor deve fazer manualmente)
-- ==========================================

BEGIN;

\echo '=== MIGRATION 131: Substituindo função de recálculo de status (MANUAL) ==='

-- ==========================================
-- 1. REMOVER FUNÇÃO ANTIGA
-- ==========================================

\echo '1. Removendo função antiga...'

DROP FUNCTION IF EXISTS fn_recalcular_status_lote_on_avaliacao_update() CASCADE;

\echo '   ✓ Função antiga removida'

-- ==========================================
-- 2. CRIAR FUNÇÃO NOVA (APENAS STATUS)
-- ==========================================

\echo '2. Criando função de recálculo MANUAL...'

CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS TRIGGER AS $$
DECLARE
  v_lote_id INTEGER;
  v_total_avaliacoes INTEGER;
  v_avaliacoes_concluidas INTEGER;
  v_avaliacoes_inativadas INTEGER;
  v_avaliacoes_pendentes INTEGER;
  v_lote_status status_lote;
BEGIN
  -- Pegar o lote_id da avaliação que foi alterada
  v_lote_id := COALESCE(NEW.lote_id, OLD.lote_id);
  
  -- Se não tem lote associado, nada a fazer
  IF v_lote_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Verificar status atual do lote
  SELECT status INTO v_lote_status
  FROM lotes_avaliacao
  WHERE id = v_lote_id;

  -- Só processar lotes ativos
  IF v_lote_status != 'ativo' THEN
    RETURN NEW;
  END IF;
  
  -- Contar avaliações do lote
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
  
  -- Se todas as avaliações (exceto as inativadas) foram concluídas:
  --   → Marcar lote como 'concluido'
  --   → NÃO agendar emissão (100% MANUAL)
  IF v_avaliacoes_pendentes = 0 
     AND (v_avaliacoes_concluidas + v_avaliacoes_inativadas) = v_total_avaliacoes 
     AND v_avaliacoes_concluidas > 0 THEN
    
    UPDATE lotes_avaliacao
    SET 
      status = 'concluido'::status_lote,
      atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status = 'ativo';  -- Evitar update desnecessário
    
    RAISE NOTICE 'Lote % marcado como concluído (MANUAL): % concluídas, % inativadas, % pendentes', 
      v_lote_id, v_avaliacoes_concluidas, v_avaliacoes_inativadas, v_avaliacoes_pendentes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS 
'Recalcula status do lote quando avaliação muda.
APENAS atualiza status para "concluido" quando todas avaliações são concluídas.
NÃO agenda emissão automática - emissor deve processar MANUALMENTE.';

\echo '   ✓ Função MANUAL criada'

-- ==========================================
-- 3. RECRIAR TRIGGER
-- ==========================================

\echo '3. Recriando trigger...'

DROP TRIGGER IF EXISTS trg_recalc_lote_on_avaliacao_update ON avaliacoes;

CREATE TRIGGER trg_recalc_lote_on_avaliacao_update
  AFTER UPDATE OF status ON avaliacoes
  FOR EACH ROW
  WHEN (OLD.status::TEXT IS DISTINCT FROM NEW.status::TEXT)
  EXECUTE FUNCTION fn_recalcular_status_lote_on_avaliacao_update();

COMMENT ON TRIGGER trg_recalc_lote_on_avaliacao_update ON avaliacoes IS
'Atualiza status do lote quando avaliação muda de status.
Sistema é 100% MANUAL - emissor deve gerar laudos explicitamente.';

\echo '   ✓ Trigger recriado'

-- ==========================================
-- 4. VALIDAÇÃO
-- ==========================================

\echo '4. Validando...'

DO $$
DECLARE
    v_function_exists BOOLEAN;
    v_trigger_exists BOOLEAN;
    v_function_body TEXT;
BEGIN
    -- Verificar se função existe
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update'
    ) INTO v_function_exists;
    
    IF NOT v_function_exists THEN
        RAISE EXCEPTION 'FALHA: Função fn_recalcular_status_lote_on_avaliacao_update não foi criada';
    END IF;

    -- Verificar se trigger existe
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trg_recalc_lote_on_avaliacao_update'
    ) INTO v_trigger_exists;
    
    IF NOT v_trigger_exists THEN
        RAISE EXCEPTION 'FALHA: Trigger trg_recalc_lote_on_avaliacao_update não foi criado';
    END IF;

    -- Verificar se função NÃO contém agendamento automático
    SELECT pg_get_functiondef(oid) INTO v_function_body
    FROM pg_proc 
    WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update';

    IF v_function_body LIKE '%auto_emitir_agendado%' 
       OR v_function_body LIKE '%auto_emitir_em%' THEN
        RAISE EXCEPTION 'FALHA: Função ainda contém código de agendamento automático!';
    END IF;

    RAISE NOTICE '   ✓ Função criada corretamente (SEM agendamento automático)';
    RAISE NOTICE '   ✓ Trigger recriado corretamente';
    RAISE NOTICE '   ✓ Sistema agora é 100%% MANUAL';
END $$;

COMMIT;

\echo '=== MIGRATION 131: Concluída com sucesso ==='
\echo ''
\echo '⚠️  FLUXO MANUAL ATIVO:'
\echo '   1. Avaliações concluídas → Lote status = "concluido"'
\echo '   2. RH/Entidade → Clicar "Solicitar Emissão" (cria notificação)'
\echo '   3. Emissor → Ver notificação e gerar laudo MANUALMENTE'
\echo ''
