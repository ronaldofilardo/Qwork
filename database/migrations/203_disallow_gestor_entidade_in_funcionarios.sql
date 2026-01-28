-- Migration 203: Proibir 'gestor_entidade' em funcionarios
-- Data: 22/01/2026

BEGIN;

ALTER TABLE funcionarios
ADD CONSTRAINT no_gestor_entidade_in_funcionarios CHECK (perfil <> 'gestor_entidade');

COMMIT;