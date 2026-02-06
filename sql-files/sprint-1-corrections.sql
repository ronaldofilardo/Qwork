-- ================================================================
-- SPRINT 1: CORREÇÕES P0 (Críticas) + P1 (Alta Prioridade)
-- Data: 2026-02-06T18:46:16.832Z
-- ================================================================
-- P0: Prevenir novas corrupções de dados
-- P1: Corrigir lógica ambígua e limpar órfãos
-- ================================================================

BEGIN;

-- ================================================================
-- P0.1: FUNÇÃO DE VALIDAÇÃO FK ANTES DE INSERT
-- ================================================================

-- Função helper para validar existência de FK antes de INSERT
CREATE OR REPLACE FUNCTION validate_fk_exists(
  target_table text,
  target_id integer,
  fk_name text
) RETURNS boolean AS $$
DECLARE
  exists_record boolean;
BEGIN
  EXECUTE format('SELECT EXISTS(SELECT 1 FROM %I WHERE id = $1)', target_table)
  INTO exists_record
  USING target_id;
  
  IF NOT exists_record THEN
    RAISE EXCEPTION 'FK validation failed: % (id=%) does not exist in table %', 
      fk_name, target_id, target_table;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validate_fk_exists IS 'Valida existência de FK antes de INSERT - previne órfãos (P0)';

-- ================================================================
-- P0.2: WRAPPER DE TRANSAÇÃO PARA OPERAÇÕES COMPLEXAS
-- ================================================================

-- Função helper para executar múltiplas queries em transação
CREATE OR REPLACE FUNCTION execute_in_transaction(
  queries text[]
) RETURNS void AS $$
DECLARE
  query text;
BEGIN
  FOREACH query IN ARRAY queries
  LOOP
    EXECUTE query;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION execute_in_transaction IS 'Executa múltiplas queries em transação atômica (P0)';

-- ================================================================
-- P1.3: LÓGICA CLARA PARA LOTES (CHECK CONSTRAINT)
-- ================================================================

-- Remover constraint antiga se existir
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS check_lote_contratante_exclusivo;

-- Adicionar CHECK constraint para garantir lógica exclusiva
-- REGRA: Lote deve ter EXATAMENTE UM de (contratante_id, clinica_id, empresa_id)
ALTER TABLE lotes_avaliacao 
  ADD CONSTRAINT check_lote_contratante_exclusivo 
  CHECK (
    -- Exatamente um dos três deve estar preenchido
    (
      (contratante_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
      (contratante_id IS NULL AND clinica_id IS NOT NULL AND empresa_id IS NULL) OR
      (contratante_id IS NULL AND clinica_id IS NULL AND empresa_id IS NOT NULL)
    )
  );

COMMENT ON CONSTRAINT check_lote_contratante_exclusivo ON lotes_avaliacao 
IS 'Garante que lote tenha EXATAMENTE UM contratante (entidade OU clínica OU empresa) - nunca ambíguo (P1)';

-- ================================================================
-- P1.6: ATUALIZAR CASCADE DELETE EM FKs CRÍTICAS
-- ================================================================
-- 1. avaliacoes → lotes_avaliacao (CASCADE DELETE)
ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS fk_avaliacoes_lote;
ALTER TABLE avaliacoes 
  ADD CONSTRAINT fk_avaliacoes_lote 
  FOREIGN KEY (lote_id) 
  REFERENCES lotes_avaliacao(id) 
  ON DELETE CASCADE;
-- 1. avaliacoes → lotes_avaliacao (CASCADE DELETE)
ALTER TABLE avaliacoes DROP CONSTRAINT IF EXISTS fk_avaliacoes_lote;
ALTER TABLE avaliacoes 
  ADD CONSTRAINT fk_avaliacoes_lote 
  FOREIGN KEY (lote_id) 
  REFERENCES lotes_avaliacao(id) 
  ON DELETE CASCADE;

-- 2. laudos → lotes_avaliacao (CASCADE DELETE)
ALTER TABLE laudos DROP CONSTRAINT IF EXISTS fk_laudos_lote;
ALTER TABLE laudos 
  ADD CONSTRAINT fk_laudos_lote 
  FOREIGN KEY (lote_id) 
  REFERENCES lotes_avaliacao(id) 
  ON DELETE CASCADE;

-- 3. respostas → avaliacoes (CASCADE DELETE)
ALTER TABLE respostas DROP CONSTRAINT IF EXISTS fk_respostas_avaliacao;
ALTER TABLE respostas 
  ADD CONSTRAINT fk_respostas_avaliacao 
  FOREIGN KEY (avaliacao_id) 
  REFERENCES avaliacoes(id) 
  ON DELETE CASCADE;

-- 4. respostas → perguntas (CASCADE DELETE)
ALTER TABLE respostas DROP CONSTRAINT IF EXISTS fk_respostas_pergunta;
ALTER TABLE respostas 
  ADD CONSTRAINT fk_respostas_pergunta 
  FOREIGN KEY (pergunta_id) 
  REFERENCES perguntas(id) 
  ON DELETE CASCADE;

-- 5. resultados → avaliacoes (CASCADE DELETE)
ALTER TABLE resultados DROP CONSTRAINT IF EXISTS fk_resultados_avaliacao;
ALTER TABLE resultados 
  ADD CONSTRAINT fk_resultados_avaliacao 
  FOREIGN KEY (avaliacao_id) 
  REFERENCES avaliacoes(id) 
  ON DELETE CASCADE;

-- 6. resultados → perguntas (CASCADE DELETE)
ALTER TABLE resultados DROP CONSTRAINT IF EXISTS fk_resultados_pergunta;
ALTER TABLE resultados 
  ADD CONSTRAINT fk_resultados_pergunta 
  FOREIGN KEY (pergunta_id) 
  REFERENCES perguntas(id) 
  ON DELETE CASCADE;

COMMENT ON CONSTRAINT fk_avaliacoes_lote ON avaliacoes 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMENT ON CONSTRAINT fk_laudos_lote ON laudos 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMENT ON CONSTRAINT fk_respostas_avaliacao ON respostas 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMENT ON CONSTRAINT fk_respostas_pergunta ON respostas 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMENT ON CONSTRAINT fk_resultados_avaliacao ON resultados 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMENT ON CONSTRAINT fk_resultados_pergunta ON resultados 
IS 'FK com CASCADE DELETE (P1) - órfãos deletados automaticamente';

COMMIT;

-- ================================================================
-- VALIDAÇÃO: Verificar constraints e FKs
-- ================================================================

-- 1. Verificar CHECK constraint em lotes_avaliacao
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'lotes_avaliacao'::regclass
  AND conname = 'check_lote_contratante_exclusivo';

-- 2. Verificar CASCADE DELETE em FKs
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('avaliacoes', 'laudos', 'respostas', 'resultados')
  AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name, kcu.column_name;
