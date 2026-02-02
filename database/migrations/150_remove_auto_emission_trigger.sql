-- Migração: Remove automação de emissão de laudo do trigger de recálculo
-- Data: 2026-02-01
-- Descrição: Remove a inserção automática em fila_emissao quando lote é concluído
--            Emissão de laudo deve ser 100% MANUAL pelo emissor

BEGIN;

-- Atualizar função do trigger para remover automação de emissão
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

  -- Se condição de conclusão for satisfeita, atualizar lote APENAS
  -- NOTA: Emissão de laudo é 100% MANUAL - não inserir em fila_emissao
  -- O RH/Entidade deve solicitar emissão via botão "Solicitar Emissão"
  -- O emissor então emite o laudo manualmente no dashboard
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    -- Evitar writes desnecessários
    UPDATE lotes_avaliacao
    SET status = 'concluido', atualizado_em = NOW()
    WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';

    -- REMOVIDO: Inserção automática em fila_emissao
    -- Motivo: Emissão de laudo deve ser 100% MANUAL pelo emissor
    -- Fluxo correto:
    --   1. RH/Entidade solicita emissão (POST /api/lotes/[loteId]/solicitar-emissao)
    --   2. Lote aparece no dashboard do emissor
    --   3. Emissor revisa e clica "Gerar Laudo" manualmente
    --   4. Sistema gera PDF e hash
    --   5. Emissor revisa e envia
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_recalcular_status_lote_on_avaliacao_update() IS 
'Recalcula status do lote quando avaliação muda de status. Marca lote como concluído quando todas avaliações liberadas estão finalizadas (concluídas ou inativadas). Emissão de laudo é 100% MANUAL.';

-- Limpar registros antigos da fila_emissao do sistema automático
-- (apenas lotes sem laudo emitido E sem tipo_solicitante definido - solicitações manuais têm tipo_solicitante)
DELETE FROM fila_emissao 
WHERE lote_id IN (
  SELECT la.id 
  FROM lotes_avaliacao la
  LEFT JOIN laudos l ON l.lote_id = la.id
  WHERE l.id IS NULL -- não tem laudo ainda
)
AND tipo_solicitante IS NULL; -- preserva solicitações manuais (rh, gestor_entidade)

COMMIT;

-- Rollback manual (se necessário):
-- BEGIN;
-- -- Restaurar função original com fila_emissao
-- CREATE OR REPLACE FUNCTION fn_recalcular_status_lote_on_avaliacao_update()
-- RETURNS trigger AS $$
-- DECLARE
--   v_liberadas int;
--   v_concluidas int;
--   v_inativadas int;
-- BEGIN
--   IF TG_OP <> 'UPDATE' OR NEW.status IS NOT DISTINCT FROM OLD.status THEN
--     RETURN NEW;
--   END IF;
--   SELECT
--     COUNT(*) FILTER (WHERE status != 'rascunho')::int,
--     COUNT(*) FILTER (WHERE status = 'concluida')::int,
--     COUNT(*) FILTER (WHERE status = 'inativada')::int
--   INTO v_liberadas, v_concluidas, v_inativadas
--   FROM avaliacoes
--   WHERE lote_id = NEW.lote_id;
--   IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
--     UPDATE lotes_avaliacao
--     SET status = 'concluido', atualizado_em = NOW()
--     WHERE id = NEW.lote_id AND status IS DISTINCT FROM 'concluido';
--     INSERT INTO fila_emissao (lote_id, tentativas, max_tentativas, proxima_tentativa)
--     VALUES (NEW.lote_id, 0, 3, NOW())
--     ON CONFLICT (lote_id) DO NOTHING;
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- COMMIT;
