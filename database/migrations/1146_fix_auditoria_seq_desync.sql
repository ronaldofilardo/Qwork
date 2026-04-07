-- Migration 1146: Corrige dessincronização da sequence auditoria_id_seq
-- Problema: duplicate key value violates unique constraint "auditoria_pkey"
--           (Key (id)=(19) already exists)
-- Causa: Inserções com IDs explícitos durante migrações deixaram o sequence
--        atrás do MAX(id) real da tabela.
-- Fix: Avançar o sequence para MAX(id) atual, garantindo que o próximo
--      INSERT auto-increment não colida com nenhuma linha existente.

SELECT setval(
  'public.auditoria_id_seq',
  GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.auditoria), 1)
);
