-- =====================================================
-- SCRIPT: VERIFICAR E APLICAR CORREÇÃO DE EMISSÃO MANUAL
-- Data: 31/01/2026
-- =====================================================
-- 
-- ⚠️ OBJETIVO: Aplicar migration 096 no banco de produção
-- para remover emissão automática de laudos
--
-- Execute este script SOMENTE se o banco ainda tiver emissão automática
-- =====================================================

BEGIN;

-- 1. VERIFICAR ESTADO ATUAL DO TRIGGER
DO $$
DECLARE
  v_function_body TEXT;
BEGIN
  SELECT prosrc INTO v_function_body
  FROM pg_proc 
  WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update';
  
  IF v_function_body LIKE '%upsert_laudo%' THEN
    RAISE NOTICE '❌ EMISSÃO AUTOMÁTICA DETECTADA - Migration 096 precisa ser aplicada';
  ELSE
    RAISE NOTICE '✅ Sistema já está correto - Emissão é manual';
  END IF;
END $$;

-- 2. APLICAR CORREÇÃO (Migration 096)
-- Substituir função do trigger para APENAS atualizar status do lote
CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
RETURNS trigger AS $$
DECLARE
  v_liberadas int;
  v_concluidas int;
  v_inativadas int;
BEGIN
  -- Só agir quando houve alteração de status
  IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NEW;
  END IF;

  -- Calcular estatísticas para o lote afetado
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho')::int,
    COUNT(*) FILTER (WHERE status = 'concluida')::int,
    COUNT(*) FILTER (WHERE status = 'inativada')::int
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = NEW.lote_id;

  -- ✅ Se condição de conclusão for satisfeita, atualizar APENAS o status do lote
  -- ❌ NÃO EMITIR LAUDO AUTOMATICAMENTE
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    
    -- Atualizar status do lote para 'concluido' (evitar writes desnecessários)
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- ✅ CRIAR NOTIFICAÇÃO para RH/Entidade (ao invés de emitir laudo)
    -- A notificação será criada pela função recalcularStatusLotePorId() em lib/lotes.ts
    -- que já tem essa lógica implementada corretamente
    
    -- ❌ REMOVIDO: Chamada a upsert_laudo() ou qualquer lógica de emissão
    -- MOTIVO: Emissão deve ser MANUAL pelo Emissor após solicitação do RH/Entidade
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS 
'Recalcula status do lote quando avaliação muda de status. 
APENAS atualiza status para concluido quando todas avaliações finalizadas.
NÃO EMITE LAUDO AUTOMATICAMENTE - emissão é manual pelo Emissor.';

-- 3. VERIFICAR CORREÇÃO APLICADA
DO $$
DECLARE
  v_function_body TEXT;
BEGIN
  SELECT prosrc INTO v_function_body
  FROM pg_proc 
  WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update';
  
  IF v_function_body LIKE '%upsert_laudo%' THEN
    RAISE EXCEPTION '❌ ERRO: Função ainda contém emissão automática após correção!';
  ELSE
    RAISE NOTICE '✅ SUCESSO: Emissão automática removida do trigger';
  END IF;
END $$;

COMMIT;

-- =====================================================
-- RESUMO DA CORREÇÃO
-- =====================================================
-- ✅ Trigger fn_recalcular_status_lote_on_avaliacao_update() corrigido
-- ✅ Emissão automática removida
-- ✅ Sistema agora é 100% manual
-- 
-- PRÓXIMAS ETAPAS:
-- 1. Aplicar migration 097 para remover campos obsoletos (auto_emitir_em, etc)
-- 2. Monitorar logs para confirmar que não há emissões automáticas
-- =====================================================
