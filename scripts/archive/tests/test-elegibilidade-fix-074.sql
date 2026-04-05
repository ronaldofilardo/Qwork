-- Test Script: Verify Migration 074 Fix (Delayed Index + Recent Completion)
-- Date: 2026-01-05
-- Purpose: Ensure employees with delayed index BUT recent completion are NOT eligible

BEGIN;

-- Test Case 1: Miguel and Sophia should NOT be eligible
\echo '=== TEST 1: Employees with delayed index + recent completion ==='
\echo 'Expected: 0 rows (NOT eligible despite delayed index)'

SELECT 
  funcionario_cpf,
  funcionario_nome,
  motivo_inclusao,
  indice_atual,
  dias_sem_avaliacao
FROM calcular_elegibilidade_lote_contratante(56, 5)
WHERE funcionario_cpf IN ('81766465200', '91412434203');

-- Test Case 2: Verify their current state
\echo '\n=== TEST 2: Current state of Miguel and Sophia ==='
SELECT 
  cpf,
  nome,
  indice_avaliacao,
  ultima_avaliacao_status,
  TO_CHAR(ultima_avaliacao_data_conclusao, 'DD/MM/YYYY HH24:MI') as data_conclusao,
  EXTRACT(DAY FROM NOW() - ultima_avaliacao_data_conclusao)::INTEGER as dias_desde_conclusao
FROM funcionarios
WHERE cpf IN ('81766465200', '91412434203')
ORDER BY nome;

-- Test Case 3: All eligible employees for next batch (should NOT include Miguel/Sophia)
\echo '\n=== TEST 3: All eligible employees for lote 5 (contratante 56) ==='
SELECT 
  funcionario_cpf,
  funcionario_nome,
  motivo_inclusao,
  indice_atual,
  prioridade
FROM calcular_elegibilidade_lote_contratante(56, 5)
ORDER BY prioridade, indice_atual, funcionario_nome
LIMIT 10;

-- Test Case 4: Simulate employee with delayed index + NO recent completion (should be eligible)
\echo '\n=== TEST 4: Employee with delayed index + old completion (eligible) ==='
-- Find an employee with old completion or no completion
SELECT 
  funcionario_cpf,
  funcionario_nome,
  motivo_inclusao,
  indice_atual,
  dias_sem_avaliacao
FROM calcular_elegibilidade_lote_contratante(56, 5)
WHERE motivo_inclusao LIKE '%Delayed index%'
LIMIT 3;

-- Test Case 5: Validate logic - employees should have either:
--   - indice = 0 (never evaluated)
--   - OR delayed index + (no completion OR old completion > 1 year)
--   - OR completed > 1 year ago
\echo '\n=== TEST 5: Validate eligibility logic for all returned employees ==='
SELECT 
  f.cpf,
  f.nome,
  f.indice_avaliacao,
  f.ultima_avaliacao_status,
  EXTRACT(DAY FROM NOW() - f.ultima_avaliacao_data_conclusao)::INTEGER as dias_conclusao,
  (5 - 1 - f.indice_avaliacao) as lotes_atrasados,
  CASE
    WHEN f.indice_avaliacao = 0 THEN 'Never evaluated (OK)'
    WHEN (5 - 1 - f.indice_avaliacao) >= 1 AND (
      f.ultima_avaliacao_data_conclusao IS NULL 
      OR f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year'
    ) THEN 'Delayed + no recent completion (OK)'
    WHEN f.ultima_avaliacao_data_conclusao < NOW() - INTERVAL '1 year' THEN 'Old completion > 1 year (OK)'
    ELSE 'ERROR: Should NOT be eligible!'
  END as validation_status
FROM funcionarios f
WHERE f.cpf IN (
  SELECT funcionario_cpf FROM calcular_elegibilidade_lote_contratante(56, 5)
)
ORDER BY f.nome
LIMIT 20;

ROLLBACK;

-- Summary results
\echo '\n'
\echo '========================================='
\echo 'MIGRATION 074 VALIDATION SUMMARY'
\echo '========================================='
\echo 'Test 1: Miguel and Sophia NOT eligible (delayed index + recent completion)'
\echo 'Test 2: Both have indice=1, concluida 04/01/2026, dias=0'
\echo 'Test 3: List of eligible employees (without Miguel/Sophia)'
\echo 'Test 4: Examples of eligible employees with delayed index'
\echo 'Test 5: Logic validation for all eligible employees'
\echo '========================================='
