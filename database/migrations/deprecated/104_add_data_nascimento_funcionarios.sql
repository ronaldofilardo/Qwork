-- Migration 104: Adicionar coluna data_nascimento em funcionarios
-- Data: 2026-01-23
-- Descrição: Garante que a API de entidade possa ler data_nascimento quando presente

BEGIN;

ALTER TABLE funcionarios
  ADD COLUMN IF NOT EXISTS data_nascimento DATE;

COMMIT;