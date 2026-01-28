-- Migration 053: adicionar valor 'analise' ao enum status_aprovacao_enum
BEGIN;

ALTER TYPE status_aprovacao_enum ADD VALUE IF NOT EXISTS 'analise';

COMMIT;