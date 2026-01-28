--- ============================================================================
-- Script: remove-invalid-emissores-force.sql
-- Objetivo: Reatribuir referências e remover emissores com id 21..25
-- ATENÇÃO: Executar no Neon Console (produção) como superuser. Teste em staging antes.
-- Data: 2026-01-27
-- ============================================================================

-- Parâmetros (inline para compatibilidade com Neon SQL editor)
-- start_id = 21
-- end_id = 25
-- replacement_cpf = '53051173991'

-- 0) Verificação inicial - listar emissores alvo
SELECT id, cpf, nome, email, ativo, criado_em
FROM funcionarios
WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25
ORDER BY id;

-- 1) Construir lista de CPFs alvo
WITH alvo AS (
  SELECT cpf FROM funcionarios WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25
)
SELECT 'laudos' AS tabela, COUNT(*) AS total FROM laudos WHERE emissor_cpf IN (SELECT cpf FROM alvo)
UNION ALL
SELECT 'lotes_avaliacao' AS tabela, COUNT(*) AS total FROM lotes_avaliacao WHERE liberado_por IN (SELECT cpf FROM alvo);

-- 2) Verificar existência do CPF de reposição
SELECT id, cpf, nome, ativo FROM funcionarios WHERE cpf = '53051173991' AND perfil = 'emissor';

-- 3) Reatribuir referências dinamicamente para qualquer FK que referencie funcionarios(cpf)
--    (atualiza colunas que apontam para funcionarios.cpf substituindo CPFs 21..25 por replacement_cpf)
DO $$
DECLARE
  source_cpfs text[];
  rec RECORD;
  sql TEXT;
BEGIN
  SELECT ARRAY_AGG(cpf) INTO source_cpfs FROM funcionarios WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25;

  IF source_cpfs IS NULL OR array_length(source_cpfs, 1) = 0 THEN
    RAISE EXCEPTION 'Nenhum emissor alvo encontrado para ids 21..25!';
  END IF;

  -- Segurança: garantir que existe o emissor de substituição
  IF NOT EXISTS (SELECT 1 FROM funcionarios WHERE cpf = '53051173991' AND perfil = 'emissor') THEN
    RAISE EXCEPTION 'CPF de reposição 53051173991 não existe ou não é emissor';
  END IF;

  FOR rec IN
    SELECT con.conname,
           con.conrelid::regclass::text AS referencing_table,
           (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = con.conrelid AND a.attnum = con.conkey[1]) AS referencing_column
    FROM pg_constraint con
    WHERE con.contype = 'f' AND con.confrelid = 'public.funcionarios'::regclass
  LOOP
    sql := format('UPDATE %s SET %I = $1 WHERE %I = ANY($2)', rec.referencing_table, rec.referencing_column, rec.referencing_column);
    EXECUTE sql USING '53051173991', source_cpfs;
    RAISE NOTICE 'Updated % on % (column %)', rec.referencing_table, rec.conname, rec.referencing_column;
  END LOOP;
END$$;

-- 4) Verificação após updates - checar se ainda existem referências para os CPFs removíveis
WITH alvo AS (
  SELECT cpf FROM funcionarios WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25
)
SELECT 'laudos' AS tabela, COUNT(*) AS total FROM laudos WHERE emissor_cpf IN (SELECT cpf FROM alvo)
UNION ALL
SELECT 'lotes_avaliacao' AS tabela, COUNT(*) AS total FROM lotes_avaliacao WHERE liberado_por IN (SELECT cpf FROM alvo);

-- 5) Deletar emissores (IDs 21..25)
BEGIN;
  -- Inativar (por segurança, opcional)
  UPDATE funcionarios SET ativo = false, atualizado_em = NOW()
  WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25;

  -- Deletar (caso FK já tenham sido atualizadas, esta DELETE deve passar)
  DELETE FROM funcionarios WHERE perfil = 'emissor' AND id BETWEEN 21 AND 25;
COMMIT;

-- 6) Verificação final
SELECT id, cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' ORDER BY id;

-- 7) Verificar que laudos e lotes apontam para CPF de substituição
SELECT 'laudos' AS tabela, COUNT(*) AS total FROM laudos WHERE emissor_cpf = '53051173991'
UNION ALL
SELECT 'lotes_avaliacao' AS tabela, COUNT(*) AS total FROM lotes_avaliacao WHERE liberado_por = '53051173991';

-- FIM - Se tudo OK, o sistema terá apenas o emissor legítimo (ID 6 / CPF 53051173991)
