-- ============================================================================
-- SCRIPT: Corrigir Dados de Nascimento Inválidas em Produção (Neon)
-- ============================================================================
-- PROPÓSITO: Identificar e corrigir datas de nascimento impossíveis (ex: 31/02)
--            que foram armazenadas antes da validação ser implementada
--
-- CONTEXTO: Após deploy das mudanças de 72h, alguns usuários falhavam no login
--           porque havia datas impossíveis no banco de dados (ex: 31/02/1990)
--
-- EXECUÇÃO:
-- 1. Executar com --dry-run primeiro (sem fazer mudanças)
-- 2. Depois executar sem --dry-run para aplicar correções
-- ============================================================================

-- PASSO 1: Identificar todas as datas de nascimento inválidas
-- Uma data é "inválida" se não pode ser construída como data real
-- Exemplos de inválidas: 31/02/1990, 31/04/1990, 29/02/1900 (não bissexto)
DO $$
DECLARE
  v_invalidas_count INT := 0;
BEGIN
  -- Contar datas inválidas (aquelas que o JavaScript Date rejeitaria)
  SELECT COUNT(*)
  INTO v_invalidas_count
  FROM funcionarios
  WHERE data_nascimento IS NOT NULL
    AND (
      -- Dia inválido (fora do range 1-31)
      (CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) < 1
        OR CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 31)
      -- Mês inválido (fora do range 1-12)
      OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) < 1
        OR CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) > 12)
      -- 31 dias: Jan, Mar, May, Jul, Aug, Oct, Dec
      OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) IN (4, 6, 9, 11)
        AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 31)
      -- 30 dias: Apr, Jun, Sep, Nov (Fevereiro tratado abaixo)
      -- Fevereiro em ano não-bissexto com 29 ou 30 dias
      OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
        AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 29)
      OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
        AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 29
        AND NOT (
          (CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 4 = 0
            AND CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 100 != 0)
          OR CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 400 = 0
        ))
    );

  RAISE NOTICE '====================================';
  RAISE NOTICE 'RELATÓRIO DE DATAS INVÁLIDAS';
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Total de datas impossíveis encontradas: %', v_invalidas_count;
  RAISE NOTICE '';

  IF v_invalidas_count > 0 THEN
    -- Listar exemplos de datas inválidas
    RAISE NOTICE 'Exemplos de datas inválidas encontradas:';
    RAISE NOTICE '----';
    FOR v_record IN
      SELECT cpf, data_nascimento
      FROM funcionarios
      WHERE data_nascimento IS NOT NULL
        AND (
          (CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) < 1
            OR CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 31)
          OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) < 1
            OR CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) > 12)
          OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) IN (4, 6, 9, 11)
            AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 31)
          OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
            AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 29)
          OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
            AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 29
            AND NOT (
              (CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 4 = 0
                AND CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 100 != 0)
              OR CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 400 = 0
            ))
        )
      LIMIT 10
    LOOP
      RAISE NOTICE '  - CPF: %, Data: %', v_record.cpf, v_record.data_nascimento;
    END LOOP;
  ELSE
    RAISE NOTICE 'Nenhuma data inválida encontrada! ✓';
  END IF;

  RAISE NOTICE '';
END $$;

-- PASSO 2: (OPCIONAL) Corrigir as datas inválidas
-- Estratégia: Se dia > 28 em fevereiro, mudar para 28/02
--             Se dia 31 em mês com 30 dias, mudar para 30
-- IMPORTANTE: Descomente para aplicar correções
-- UPDATE funcionarios
-- SET data_nascimento = CASE
--   -- Fevereiro com dia > 28: colocar 28/02
--   WHEN SUBSTRING(data_nascimento, 4, 2) = '02'
--     AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 28
--   THEN CONCAT('28/', SUBSTRING(data_nascimento, 4, 10))
--   -- Meses com 30 dias (04, 06, 09, 11) com dia 31: colocar 30
--   WHEN SUBSTRING(data_nascimento, 4, 2) IN ('04', '06', '09', '11')
--     AND SUBSTRING(data_nascimento, 1, 2) = '31'
--   THEN CONCAT('30/', SUBSTRING(data_nascimento, 4, 10))
--   ELSE data_nascimento
-- END
-- WHERE data_nascimento IS NOT NULL
--   AND (
--     (CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) < 1
--       OR CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 31)
--     OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) < 1
--       OR CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) > 12)
--     OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) IN (4, 6, 9, 11)
--       AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 31)
--     OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
--       AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) > 29)
--     OR (CAST(SUBSTRING(data_nascimento, 4, 2) AS INTEGER) = 2
--       AND CAST(SUBSTRING(data_nascimento, 1, 2) AS INTEGER) = 29
--       AND NOT (
--         (CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 4 = 0
--           AND CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 100 != 0)
--         OR CAST(SUBSTRING(data_nascimento, 7, 4) AS INTEGER) % 400 = 0
--       ))
--   );
