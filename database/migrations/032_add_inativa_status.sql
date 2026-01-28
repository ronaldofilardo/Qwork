-- Migration 032: adicionar valor 'inativa' ao enum status_aprovacao_enum
BEGIN;

ALTER TYPE status_aprovacao_enum ADD VALUE IF NOT EXISTS 'inativa';

COMMIT;
