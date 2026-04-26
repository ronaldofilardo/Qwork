-- ====================================================================
-- Migration 1140: Corrigir seq_vendedor_codigo para evitar duplicatas
-- Data: 2026-04-05
-- Problema: seq_vendedor_codigo foi criada com START WITH 100, mas
--           vendedores_perfil já tinha códigos >= 100, causando UNIQUE
--           constraint violations (code 23505).
-- Solução: Encontrar o máximo código numérico e ajustar a sequência
--          para gerar o próximo valor sem colisão.
-- ====================================================================

BEGIN;

-- Ajustar seq_vendedor_codigo: encontrar o máximo código e setval
DO $$
DECLARE
  v_max_codigo bigint;
  v_new_start bigint;
BEGIN
  -- Extrair o máximo valor numérico de vendedores_perfil.codigo
  -- (filtrando apenas os que conseguem ser convertidos para integer)
  SELECT MAX((codigo::bigint)) INTO v_max_codigo
    FROM public.vendedores_perfil
   WHERE codigo ~ '^\d+$';  -- apenas strings puramente numéricas

  -- Se houver códigos numéricos, ajustar sequência para MAX + 1
  IF v_max_codigo IS NOT NULL AND v_max_codigo >= 100 THEN
    v_new_start := v_max_codigo + 1;
    PERFORM setval('public.seq_vendedor_codigo', v_new_start);
    RAISE NOTICE '[MIGRATION 1140] seq_vendedor_codigo ajustada para % (máximo encontrado: %)',
                 v_new_start, v_max_codigo;
  ELSE
    -- Se não houver códigos numéricos, sequência já está em 100 (padrão)
    RAISE NOTICE '[MIGRATION 1140] Nenhum código numérico >= 100 encontrado. seq_vendedor_codigo mantendo START WITH 100.';
  END IF;
END $$;

-- Verificação final (apenas se sequência foi criada em migration 1128)
\set ON_ERROR_STOP off
SELECT 'Próximo código será:' AS info, nextval('public.seq_vendedor_codigo')::text AS proximo_codigo;
\set ON_ERROR_STOP on

COMMIT;

\echo '✓ Migration 1140 concluído — seq_vendedor_codigo corrigida'
