-- Migration 1019: Remover views de compatibilidade para tomadors
-- 
-- Pré-requisito: Migration 1018 + Phase 2 (todo código corrigido para usar entidades)
-- 
-- Esta migration remove as views temporárias criadas em 1018 após confirmar
-- que nenhum código ativo referencia mais as tabelas com typo 'tomadors'.

BEGIN;

-- Drop view de funcionários (verificar sem dependências ativas)
DROP VIEW IF EXISTS tomadors_funcionarios;

-- Drop view principal (verificar sem dependências ativas)
DROP VIEW IF EXISTS tomadors;

COMMIT;
