-- Script de Testes: Validação de Políticas RLS
-- Data: 2026-01-09
-- Objetivo: Testar isolamento de dados entre entidades (antiga tabela: contratantes) e validar políticas RLS

-- ============================================================
-- SETUP: Criar dados de teste
-- ============================================================

BEGIN;

-- Limpar dados de teste anteriores se existirem
DELETE FROM parcelas WHERE recibo_id IN (SELECT id FROM recibos WHERE entidade_id IN (9901, 9902));
DELETE FROM recibos WHERE entidade_id IN (9901, 9902);
DELETE FROM contratos WHERE entidade_id IN (9901, 9902);
DELETE FROM entidades WHERE id IN (9901, 9902);

-- Inserir 2 entidades de teste (usando IDs diferentes)
INSERT INTO entidades (id, tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
  responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular)
VALUES
  (9901, 'entidade', 'Empresa Teste A', '99111111000111', 'testa@teste.com', '11999999999',
   'Rua A, 100', 'Curitiba', 'PR', '80000-000',
   'João Silva Teste', '99111111111', 'joao@testa.com', '11999999991'),
  (9902, 'entidade', 'Empresa Teste B', '99222222000222', 'testb@teste.com', '11999999998',
   'Rua B, 200', 'São Paulo', 'SP', '01000-000',
   'Maria Santos Teste', '99222222222', 'maria@testb.com', '11999999992');

-- Inserir contratos de teste
INSERT INTO contratos (entidade_id, numero_funcionarios, valor_total,
  conteudo_gerado, hash_contrato, versao_contrato, aceito, status)
VALUES
  (9901, 10, 1000.00, 'Contrato teste A', 'hash_test_a_' || gen_random_uuid()::text, '1.0', false, 'generated'),
  (9902, 20, 2000.00, 'Contrato teste B', 'hash_test_b_' || gen_random_uuid()::text, '1.0', false, 'generated');

COMMIT;

-- ============================================================
-- TESTE 1: Admin deve ver todos os contratos
-- ============================================================

SELECT set_session_context('admin', NULL, 'admin@qwork.com.br');

SELECT 
  'TESTE 1: Admin vê todos os contratos' as teste,
  COUNT(*) as total_contratos,
  CASE 
    WHEN COUNT(*) >= 2 THEN 'PASSOU'
    ELSE 'FALHOU - Esperado >= 2 contratos'
  END as resultado
FROM contratos
WHERE contratante_id IN (9901, 9902);

-- ============================================================
-- TESTE 2: Contratante A vê apenas seus contratos
-- ============================================================

SELECT set_session_context('contratante', 9901, '99111111111');

SELECT 
  'TESTE 2: Contratante A vê apenas seus contratos' as teste,
  COUNT(*) as total_contratos,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASSOU'
    ELSE 'FALHOU - Deveria ver apenas seu contrato'
  END as resultado
FROM contratos
WHERE contratante_id IN (9901, 9902);

-- ============================================================
-- TESTE 3: Contratante A NÃO vê contratos de B
-- ============================================================

SELECT set_session_context('contratante', 9901, '99111111111');

SELECT 
  'TESTE 3: Contratante A não vê contratos de B' as teste,
  COUNT(*) as total_contratos_b,
  CASE 
    WHEN COUNT(*) = 0 THEN 'PASSOU'
    ELSE 'FALHOU - Não deveria ver contratos do contratante 9902'
  END as resultado
FROM contratos
WHERE contratante_id = 9902;

-- ============================================================
-- TESTE 4: Contratante B vê apenas seus contratos
-- ============================================================

SELECT set_session_context('contratante', 9902, '99222222222');

SELECT 
  'TESTE 4: Contratante B vê apenas seus contratos' as teste,
  COUNT(*) as total_contratos,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASSOU'
    ELSE 'FALHOU - Deveria ver apenas seu contrato'
  END as resultado
FROM contratos
WHERE contratante_id IN (9901, 9902);

-- ============================================================
-- TESTE 5: Contratante não pode aceitar contrato de outro
-- ============================================================

SELECT set_session_context('contratante', 9901, '99111111111');

-- Tentar atualizar contrato do contratante 9902 (deve falhar silenciosamente)
DO $$
DECLARE
  contrato_b_id INTEGER;
BEGIN
  SELECT id INTO contrato_b_id FROM contratos WHERE contratante_id = 9902 LIMIT 1;
  
  IF contrato_b_id IS NOT NULL THEN
    UPDATE contratos SET aceito = true WHERE id = contrato_b_id;
  END IF;
END $$;

-- Verificar se contrato 9902 permanece não aceito
SELECT 
  'TESTE 5: Contratante A não pode aceitar contrato de B' as teste,
  COALESCE(MIN(aceito::int), 0) as contrato_9902_aceito,
  CASE 
    WHEN COALESCE(MIN(aceito::int), 0) = 0 THEN 'PASSOU'
    ELSE 'FALHOU - Não deveria ter conseguido aceitar'
  END as resultado
FROM contratos
WHERE contratante_id = 9902;

DO $$
DECLARE
  contrato_a_id INTEGER;
  contrato_b_id INTEGER;
BEGIN
  SELECT id INTO contrato_a_id FROM contratos WHERE contratante_id = 9901 LIMIT 1;
  SELECT id INTO contrato_b_id FROM contratos WHERE contratante_id = 9902 LIMIT 1;
  
  INSERT INTO recibos (pagamento_id, contratante_id, contrato_id, numero_recibo,
    vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, forma_pagamento)
  VALUES
    (99901, 9901, contrato_a_id, 'REC-TEST-9901', CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 10, 1000.00, 'avista'),
    (99902, 9902, contrato_b_id, 'REC-TEST-9902', CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 20, 2000.00, 'avista');
END $$
INSERT INTO recibos (id, pagamento_id, contratante_id, numero_recibo,
  vigencia_inicio, vigencia_fim, numero_funcionarios_cobertos, valor_total_anual, forma_pagamento)
VALUES
  (9001, 9001, 9001, 'REC-TEST-0001', CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 10, 1000.00, 'avista'),
  (9002, 9002, 9002, 'REC-TEST-0002', CURRENT_DATE, CURRENT_DATE + INTERVAL '364 days', 20, 2000.00, 'avista')
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- Testar isolamento de recibos
SELECT set_session_context('contratante', 9901, '99111111111');

SELECT 
  'TESTE 6: Contratante A vê apenas seus recibos' as teste,
  COUNT(*) as total_recibos,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASSOU'
    ELSE 'FALHOU - Deveria ver apenas seu recibo'
  END as resultado
FROM recibos
WHERE contratante_id IN (9901, 9902);

-- ============================================================
-- TESTE 7: Parcelas seguem isolamento via recibo
-- ============================================================

SELECT clear_session_context();

DO $$
DECLARE
  recibo_a_id INTEGER;
  recibo_b_id INTEGER;
BEGIN
  SELECT id INTO recibo_a_id FROM recibos WHERE contratante_id = 9901 LIMIT 1;
  SELECT id INTO recibo_b_id FROM recibos WHERE contratante_id = 9902 LIMIT 1;
  
  IF recibo_a_id IS NOT NULL AND recibo_b_id IS NOT NULL THEN
    INSERT INTO parcelas (recibo_id, numero, valor, vencimento, status)
    VALUES
      (recibo_a_id, 1, 1000.00, CURRENT_DATE + INTERVAL '30 days', 'pendente'),
      (recibo_b_id, 1, 2000.00, CURRENT_DATE + INTERVAL '30 days', 'pendente');
  END IF;
END $$;

SELECT set_session_context('contratante', 9901, '99111111111');

SELECT 
  'TESTE 7: Contratante A vê apenas parcelas de seus recibos' as teste,
  COUNT(*) as total_parcelas,
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASSOU'
    ELSE 'FALHOU - Deveria ver apenas suas parcelas'
  END as resultado
FROM parcelas p
JOIN recibos r ON p.recibo_id = r.id
WHERE r.contratante_id IN (9901, 9902);

-- ============================================================
-- RESUMO DOS TESTES
-- ============================================================

SELECT clear_session_context();

SELECT 
  '========================================' as linha
UNION ALL
SELECT 'RESUMO DOS TESTES DE RLS'
UNION ALL
SELECT '========================================'
UNION ALL
SELECT 'Execute este script e verifique se todos os testes PASSARAM'
UNION ALL
SELECT 'Se algum teste FALHOU, revisar políticas RLS'
UNION ALL
SELECT '========================================';

-- ============================================================
-- CLEANUP: Remover dados de teste (opcional)
-- ============================================================

-- Descomentar para limpar dados de teste
/*
DELETE FROM parcelas WHERE recibo_id IN (SELECT id FROM recibos WHERE entidade_id IN (9901, 9902));
DELETE FROM recibos WHERE entidade_id IN (9901, 9902);
DELETE FROM contratos WHERE entidade_id IN (9901, 9902);
DELETE FROM entidades WHERE id IN (9901, 9902);

SELECT 'Dados de teste removidos com sucesso' as resultado;
*/
