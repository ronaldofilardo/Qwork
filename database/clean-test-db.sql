-- Limpeza do banco de teste
-- Executar na ordem correta para evitar violações de FK

-- Desabilitar triggers temporariamente para limpeza mais rápida
SET session_replication_role = 'replica';

-- Limpar tabelas na ordem correta (dependências primeiro)
DELETE FROM audit_logs;
DELETE FROM respostas;
DELETE FROM avaliacoes;
DELETE FROM lotes_avaliacao;
DELETE FROM funcionarios;
DELETE FROM empresas_clientes;
DELETE FROM clinicas;
DELETE FROM contratantes;

-- Reabilitar triggers
SET session_replication_role = 'origin';

-- Resetar sequências
ALTER SEQUENCE clinicas_id_seq RESTART WITH 1;
ALTER SEQUENCE contratantes_id_seq RESTART WITH 1;
ALTER SEQUENCE empresas_clientes_id_seq RESTART WITH 1;
ALTER SEQUENCE funcionarios_id_seq RESTART WITH 1;
ALTER SEQUENCE avaliacoes_id_seq RESTART WITH 1;
ALTER SEQUENCE respostas_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_logs_id_seq RESTART WITH 1;
ALTER SEQUENCE lotes_avaliacao_id_seq RESTART WITH 1;