-- ============================================================================
-- TESTE RÁPIDO: Verificar datas inválidas em Neon
-- ============================================================================
-- Versão simplificada e otimizada para PostgreSQL/Neon
-- ============================================================================

-- PASSO 1: Contar datas inválidas
DO $$
DECLARE
  v_count INT := 0;
  v_record RECORD;
BEGIN
  SELECT COUNT(*) 
  INTO v_count
  FROM funcionarios
  WHERE data_nascimento IS NOT NULL
    AND (
      -- Dia inválido (fora do range 1-31)
      (SUBSTRING(data_nascimento, 1, 2)::INT < 1 OR SUBSTRING(data_nascimento, 1, 2)::INT > 31)
      -- Mês inválido (fora do range 1-12)
      OR (SUBSTRING(data_nascimento, 4, 2)::INT < 1 OR SUBSTRING(data_nascimento, 4, 2)::INT > 12)
      -- Meses com 30 dias (abril, junho, setembro, novembro) mas data 31
      OR (SUBSTRING(data_nascimento, 4, 2)::INT IN (4, 6, 9, 11) AND SUBSTRING(data_nascimento, 1, 2) = '31')
      -- Fevereiro com dia > 29
      OR (SUBSTRING(data_nascimento, 4, 2) = '02' AND SUBSTRING(data_nascimento, 1, 2)::INT > 29)
    );

  RAISE NOTICE '====================================';
  RAISE NOTICE 'VERIFICAÇÃO DE DATAS INVÁLIDAS';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total encontrado: %', v_count;
  RAISE NOTICE '';

  IF v_count > 0 THEN
    RAISE NOTICE 'Exemplos de datas inválidas:';
    FOR v_record IN
      SELECT cpf, data_nascimento
      FROM funcionarios
      WHERE data_nascimento IS NOT NULL
        AND (
          (SUBSTRING(data_nascimento, 1, 2)::INT < 1 OR SUBSTRING(data_nascimento, 1, 2)::INT > 31)
          OR (SUBSTRING(data_nascimento, 4, 2)::INT < 1 OR SUBSTRING(data_nascimento, 4, 2)::INT > 12)
          OR (SUBSTRING(data_nascimento, 4, 2)::INT IN (4, 6, 9, 11) AND SUBSTRING(data_nascimento, 1, 2) = '31')
          OR (SUBSTRING(data_nascimento, 4, 2) = '02' AND SUBSTRING(data_nascimento, 1, 2)::INT > 29)
        )
      LIMIT 5
    LOOP
      RAISE NOTICE '  - CPF: %, Data: %', v_record.cpf, v_record.data_nascimento;
    END LOOP;
  ELSE
    RAISE NOTICE '✓ Nenhuma data inválida encontrada!';
  END IF;

END $$;

-- ============================================================================
-- PASSO 2: CORRIGIR datas inválidas (DESCOMENTE PARA APLICAR)
-- ============================================================================
-- Estratégia:
--   - 31/02 → 28/02 (ou 29/02 se bissexto, mas simplificar para 28)
--   - 31/04, 31/06, 31/09, 31/11 → 30/mês
--   - Fevereiro > 29 → 28/02
-- ============================================================================

-- UPDATE funcionarios
-- SET data_nascimento = CASE
--   -- Fevereiro com dia > 29: colocar 28/02
--   WHEN SUBSTRING(data_nascimento, 4, 2) = '02'
--     AND SUBSTRING(data_nascimento, 1, 2)::INT > 29
--   THEN '28' || SUBSTRING(data_nascimento, 3)
--   
--   -- Meses com 30 dias mas data 31: colocar 30
--   WHEN SUBSTRING(data_nascimento, 4, 2) IN ('04', '06', '09', '11')
--     AND SUBSTRING(data_nascimento, 1, 2) = '31'
--   THEN '30' || SUBSTRING(data_nascimento, 3)
--   
--   ELSE data_nascimento
-- END
-- WHERE data_nascimento IS NOT NULL
--   AND (
--     SUBSTRING(data_nascimento, 4, 2) = '02' AND SUBSTRING(data_nascimento, 1, 2)::INT > 29
--     OR (SUBSTRING(data_nascimento, 4, 2) IN ('04', '06', '09', '11') AND SUBSTRING(data_nascimento, 1, 2) = '31')
--   );
