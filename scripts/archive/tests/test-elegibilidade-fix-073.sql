-- Test Script: Verify Eligibility Fix (Migration 073)
-- Date: 2026-01-05
-- Purpose: Manually verify that employees with recently completed evaluations
--          are NOT eligible for new batches

BEGIN;

-- Create test scenario
DO $$
DECLARE
  v_lote_id INT;
BEGIN
  -- Check existing employees Miguel and Sophia
  RAISE NOTICE 'Verificando Miguel Barbosa e Sophia Castro...';
  
  -- Show current state
  RAISE NOTICE 'Estado atual:';
  FOR i IN 
    SELECT 
      cpf,
      nome,
      ultima_avaliacao_status,
      ultima_avaliacao_data_conclusao,
      EXTRACT(DAY FROM NOW() - ultima_avaliacao_data_conclusao)::INTEGER as dias_desde_conclusao
    FROM funcionarios
    WHERE cpf IN ('81766465200', '91412434203')
  LOOP
    RAISE NOTICE '  CPF: %, Nome: %, Status: %, Dias desde conclusao: %', 
      i.cpf, i.nome, i.ultima_avaliacao_status, i.dias_desde_conclusao;
  END LOOP;
  
  -- Test eligibility function
  RAISE NOTICE 'Testando funcao de elegibilidade (numero_lote=3):';
  FOR i IN 
    SELECT funcionario_cpf, funcionario_nome, motivo_inclusao
    FROM calcular_elegibilidade_lote_contratante(1, 3)
    WHERE funcionario_cpf IN ('81766465200', '91412434203')
  LOOP
    RAISE NOTICE '  CPF: %, Nome: %, Motivo: %',
      i.funcionario_cpf, i.funcionario_nome, i.motivo_inclusao;
  END LOOP;
  
  IF NOT FOUND THEN
    RAISE NOTICE '  ✓ SUCESSO: Nenhum dos funcionarios está elegivel (como esperado)';
  ELSE
    RAISE WARNING '  ✗ ERRO: Funcionarios aparecem como elegiveis mas nao deveriam!';
  END IF;
  
END $$;

ROLLBACK;

-- Now run actual validation queries
\echo '\n=== VALIDATION QUERIES ==='
\echo '1. Miguel and Sophia current state:'
SELECT 
  cpf,
  nome,
  indice_avaliacao,
  ultimo_lote_codigo,
  ultima_avaliacao_status,
  TO_CHAR(ultima_avaliacao_data_conclusao, 'DD/MM/YYYY HH24:MI:SS') as data_conclusao,
  EXTRACT(DAY FROM NOW() - ultima_avaliacao_data_conclusao)::INTEGER as dias_desde_conclusao
FROM funcionarios
WHERE cpf IN ('81766465200', '91412434203')
ORDER BY nome;

\echo '\n2. Eligibility check (should return 0 rows):'
SELECT COUNT(*) as total_elegiveis
FROM calcular_elegibilidade_lote_contratante(1, 3)
WHERE funcionario_cpf IN ('81766465200', '91412434203');

\echo '\n3. Lote 003-050126 should have only 2 evaluations now (not 4):'
SELECT 
  l.codigo,
  COUNT(a.id) as total_avaliacoes,
  STRING_AGG(f.nome, ', ' ORDER BY f.nome) as funcionarios
FROM lotes_avaliacao l
LEFT JOIN avaliacoes a ON a.lote_id = l.id
LEFT JOIN funcionarios f ON f.cpf = a.funcionario_cpf
WHERE l.codigo = '003-050126'
GROUP BY l.id, l.codigo;

\echo '\n4. Complete evaluation history for Miguel and Sophia:'
SELECT 
  f.cpf,
  f.nome,
  l.codigo as lote,
  l.numero_ordem,
  a.status,
  TO_CHAR(a.envio, 'DD/MM/YYYY HH24:MI') as data_conclusao,
  TO_CHAR(a.inativada_em, 'DD/MM/YYYY HH24:MI') as data_inativacao
FROM funcionarios f
JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
JOIN lotes_avaliacao l ON l.id = a.lote_id
WHERE f.cpf IN ('81766465200', '91412434203')
ORDER BY f.nome, l.numero_ordem;
