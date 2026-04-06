-- Migration 1145: Drop fk_laudos_emissor_cpf constraint from laudos
--
-- Motivo: laudos.emissor_cpf é um campo de auditoria referenciando um usuário
-- da plataforma. O emissor é validado a nível de aplicação via requireRole('emissor').
--
-- O FK constraint não funciona em cenários multi-ambiente: quando o emissor
-- escolhe acessar staging/prod, os laudos são escritos nesse DB, mas os
-- usuários emissores (usuarios.cpf) existem no DB de plataforma (local/prod),
-- causando violação de FK 23503.
--
-- Solução: remover FK - emissor_cpf permanece como coluna de auditoria sem
-- enforcement a nível de DB. A integridade é garantida pelo middleware de autenticação.

BEGIN;

ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_emissor_cpf;

COMMIT;
