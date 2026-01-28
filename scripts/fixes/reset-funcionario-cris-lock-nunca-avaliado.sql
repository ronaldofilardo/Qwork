-- Script: reset-funcionario-cris-lock-nunca-avaliado.sql
-- Objetivo: voltar o funcionário Cris Lock para estado "nunca avaliado"
-- Observação: identifique o CPF/ID corretamente antes de executar
-- Uso: primeiro executar o bloco PREVIEW e o bloco DRY-RUN (faz ROLLBACK). Quando revisar e confirmar, execute o bloco de EXECUÇÃO REAL.

-- Ajuste o CPF se necessário (valor extraído da UI: 04180818914)
\set TARGET_CPF '04180818914'

-- ===========================
-- PREVIEW: mostrar estado atual do funcionário
-- ===========================
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote, data_desligamento, ativo
FROM funcionarios
WHERE cpf = :'TARGET_CPF';

-- Verificar avaliacoes existentes vinculadas (deve ser zero após exclusão do lote)
SELECT id, lote_id, status, inicio, envio
FROM avaliacoes
WHERE funcionario_cpf = :'TARGET_CPF'
ORDER BY id;

-- ===========================
-- DRY-RUN: simular atualização (BEGIN ... ROLLBACK)
-- ===========================
BEGIN;

UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL,
    atualizado_em = NOW()
WHERE cpf = :'TARGET_CPF'
RETURNING id, cpf, nome, indice_avaliacao, data_ultimo_lote;

-- Inserir entrada de auditoria (simulada - será revertida)
INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
SELECT 'reset_para_nunca_avaliado', 'funcionarios', f.id, jsonb_build_object('motivo','Solicitado pelo operador, lote deletado 006-050126'), NULL, 'sistema', NOW()
FROM funcionarios f WHERE f.cpf = :'TARGET_CPF';

-- Verificar resultado (depois do UPDATE dentro do BEGIN)
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = :'TARGET_CPF';

ROLLBACK;

-- ===========================
-- EXECUÇÃO REAL (AUTORIZADA)
-- ===========================
BEGIN;

UPDATE funcionarios
SET indice_avaliacao = 0,
    data_ultimo_lote = NULL,
    atualizado_em = NOW()
WHERE cpf = :'TARGET_CPF'
RETURNING id, cpf, nome, indice_avaliacao, data_ultimo_lote;

-- Registrar auditoria real
INSERT INTO audit_logs (acao, entidade, entidade_id, dados, user_id, user_role, criado_em)
SELECT 'reset_para_nunca_avaliado', 'funcionarios', f.id, jsonb_build_object('motivo','Solicitado pelo operador, lote deletado 006-050126'), NULL, 'sistema', NOW()
FROM funcionarios f WHERE f.cpf = :'TARGET_CPF';

-- Verificar resultado final
SELECT id, cpf, nome, indice_avaliacao, data_ultimo_lote FROM funcionarios WHERE cpf = :'TARGET_CPF';

COMMIT;

-- FIM
