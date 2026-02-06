-- Migration 203: Proibir 'gestor' em funcionarios
-- Data: 22/01/2026

BEGIN;

ALTER TABLE funcionarios
ADD CONSTRAINT no_gestor_in_funcionarios CHECK (perfil <> 'gestor');

COMMIT;