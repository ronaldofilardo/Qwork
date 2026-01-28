-- Migration 201: Inserir clinicas ausentes baseadas em contratantes do tipo 'clinica'
-- Objetivo: Garantir que gestores RH com session.clinica_id apontando para um contratante
-- do tipo 'clinica' tenham um registro correspondente em 'clinicas' para operações.

BEGIN;

-- Inserir clinicas faltantes (criar novo id via sequence e vincular ao contratante)
INSERT INTO clinicas (contratante_id, nome, ativa, criado_em)
SELECT c.id, c.nome, true, NOW()
FROM contratantes c
WHERE c.tipo = 'clinica'
  AND NOT EXISTS (
    SELECT 1 FROM clinicas cl WHERE cl.contratante_id = c.id
  );

-- Ajustar a sequência da coluna id de clinicas para evitar conflitos futuros
DO $$
DECLARE
  seq_name text;
  max_id bigint;
BEGIN
  SELECT pg_get_serial_sequence('clinicas', 'id') INTO seq_name;
  IF seq_name IS NOT NULL THEN
    EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM clinicas') INTO max_id;
    EXECUTE format('SELECT setval(%L, %s)', seq_name, max_id);
  END IF;
END$$;

COMMIT;
