-- ==========================================
-- FIX CRITICO: Corrigir valor enum incorreto
-- ==========================================

BEGIN;

-- Configurar contexto de sessao para desabilitar RLS durante manutencao
SET app.current_user_cpf = '00000000000';
SET app.current_user_perfil = 'admin';
SET app.bypass_rls = TRUE;

-- Verificar status antes da correcao
SELECT id, status FROM avaliacoes WHERE id = 17;

-- Corrigir: 'concluido' ERRADO -> 'concluida' CORRETO
UPDATE avaliacoes 
SET status = 'concluida' 
WHERE id = 17 AND status = 'concluido';

-- Verificar resultado
SELECT id, status FROM avaliacoes WHERE id = 17;

-- Agora recalcular o Lote #6
-- O trigger deve disparar quando commitamos, mas vamos fazer manualmente tambem
DO $$
DECLARE
  v_lote_id INTEGER := 6;
  v_liberadas INTEGER;
  v_concluidas INTEGER;
  v_inativadas INTEGER;
BEGIN
  -- Contar avaliacoes
  SELECT
    COUNT(*) FILTER (WHERE status != 'rascunho'),
    COUNT(*) FILTER (WHERE status = 'concluida'),
    COUNT(*) FILTER (WHERE status = 'inativada')
  INTO v_liberadas, v_concluidas, v_inativadas
  FROM avaliacoes
  WHERE lote_id = v_lote_id;

  RAISE NOTICE 'Lote %: liberadas=%, concluidas=%, inativadas=%', 
    v_lote_id, v_liberadas, v_concluidas, v_inativadas;

  -- Se criterio atendido, atualizar para 'concluido'
  IF v_liberadas > 0 AND v_concluidas > 0 AND (v_concluidas + v_inativadas) = v_liberadas THEN
    UPDATE lotes_avaliacao
    SET status = 'concluido',
        atualizado_em = NOW()
    WHERE id = v_lote_id
      AND status != 'concluido';
    
    RAISE NOTICE 'OK: Lote % atualizado para status "concluido"', v_lote_id;
  ELSE
    RAISE NOTICE 'Criterios: concluidas > 0? %, (concluidas + inativadas) = liberadas? %',
      CASE WHEN v_concluidas > 0 THEN 'SIM' ELSE 'NAO' END,
      CASE WHEN (v_concluidas + v_inativadas) = v_liberadas THEN 'SIM' ELSE 'NAO' END;
  END IF;
END $$;

-- Verificar resultado final
SELECT 
  la.id,
  la.status as status_lote,
  COUNT(a.id) as total_avaliacoes,
  COUNT(a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
  COUNT(a.id) FILTER (WHERE a.status = 'inativada') as inativadas,
  COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as liberadas
FROM lotes_avaliacao la
LEFT JOIN avaliacoes a ON la.id = a.lote_id
WHERE la.id = 6
GROUP BY la.id, la.status;

COMMIT;
