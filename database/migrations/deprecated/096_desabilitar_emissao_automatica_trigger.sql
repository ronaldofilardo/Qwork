-- =====================================================
-- MIGRAÇÃO 096: DESABILITAR EMISSÃO AUTOMÁTICA DE LAUDOS
-- Data: 31/01/2026
-- =====================================================
-- 
-- ⚠️ PROBLEMA CRÍTICO IDENTIFICADO:
-- O trigger fn_recalcular_status_lote_on_avaliacao_update() estava
-- EMITINDO LAUDOS AUTOMATICAMENTE quando lote mudava para 'concluido'.
-- 
-- 🎯 CORREÇÃO:
-- Remover lógica de emissão automática do trigger.
-- O lote deve ficar em status='concluido' e AGUARDAR solicitação manual
-- pelo RH/Entidade para emissão pelo Emissor.
-- 
-- =====================================================

BEGIN;

-- Substituir função do trigger para APENAS atualizar status do lote
-- SEM emitir laudo automaticamente
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

COMMIT;

-- =====================================================
-- VERIFICAÇÃO PÓS-MIGRAÇÃO
-- =====================================================
-- Execute para verificar que a função não chama mais upsert_laudo:
-- 
-- SELECT prosrc FROM pg_proc WHERE proname = 'fn_recalcular_status_lote_on_avaliacao_update';
-- 
-- Deve retornar código da função SEM menção a "upsert_laudo" ou "PERFORM upsert_laudo"
