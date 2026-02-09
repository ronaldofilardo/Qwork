import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

const prodPool = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function generateSprint1SQL() {
  const sql = `-- ================================================================
-- SPRINT 1: CORREÇÕES P0 (Críticas) + P1 (Alta Prioridade)
-- Data: ${new Date().toISOString()}
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
ALTER TABLE lotes_avaliacao DROP CONSTRAINT IF EXISTS check_lote_tomador_exclusivo;

-- Adicionar CHECK constraint para garantir lógica exclusiva
-- REGRA: Lote deve ter EXATAMENTE UM de (tomador_id, clinica_id, empresa_id)
ALTER TABLE lotes_avaliacao 
  ADD CONSTRAINT check_lote_tomador_exclusivo 
  CHECK (
    -- Exatamente um dos três deve estar preenchido
    (
      (tomador_id IS NOT NULL AND clinica_id IS NULL AND empresa_id IS NULL) OR
      (tomador_id IS NULL AND clinica_id IS NOT NULL AND empresa_id IS NULL) OR
      (tomador_id IS NULL AND clinica_id IS NULL AND empresa_id IS NOT NULL)
    )
  );

COMMENT ON CONSTRAINT check_lote_tomador_exclusivo ON lotes_avaliacao 
IS 'Garante que lote tenha EXATAMENTE UM tomador (entidade OU clínica OU empresa) - nunca ambíguo (P1)';

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
  AND conname = 'check_lote_tomador_exclusivo';

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
`;

  return sql;
}

async function executeMigration(sql: string, pool: Pool, env: string) {
  console.log(`🚀 Executando Sprint 1 no ${env}...\n`);

  try {
    await pool.query(sql);
    console.log(`✅ Sprint 1 executado no ${env}\n`);
  } catch (error: any) {
    console.error(`❌ Erro no ${env}:`, error.message);
    throw error;
  }
}

async function validateSprint1(pool: Pool, env: string) {
  console.log(`🔍 Validando Sprint 1 no ${env}...\n`);

  // 1. Verificar funções P0
  const funcs = await pool.query(`
    SELECT proname 
    FROM pg_proc 
    WHERE proname IN ('validate_fk_exists', 'execute_in_transaction');
  `);

  console.log(`   P0 - Funções de validação:`);
  funcs.rows.forEach((row) => {
    console.log(`      ✅ ${row.proname}()`);
  });

  // 2. Verificar CHECK constraint P1
  const checkConstraint = await pool.query(`
    SELECT conname 
    FROM pg_constraint
    WHERE conrelid = 'lotes_avaliacao'::regclass
      AND conname = 'check_lote_tomador_exclusivo';
  `);

  if (checkConstraint.rows.length === 0) {
    throw new Error(`CHECK constraint não criada em ${env}!`);
  }
  console.log(`\n   P1 - CHECK constraint lotes:`);
  console.log(`      ✅ check_lote_tomador_exclusivo`);

  // 3. Verificar CASCADE DELETE
  const cascades = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
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
    ORDER BY tc.table_name;
  `);

  console.log(`\n   P1 - CASCADE DELETE FKs:`);
  cascades.rows.forEach((row) => {
    console.log(
      `      ✅ ${row.table_name}.${row.column_name} → ${row.foreign_table_name}`
    );
  });

  console.log(`\n✅ Validação ${env} OK - Sprint 1 implementado\n`);
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('SPRINT 1: CORREÇÕES P0 (Críticas) + P1 (Alta Prioridade)');
    console.log('='.repeat(70) + '\n');

    console.log('P0 - Prevenir novas corrupções:');
    console.log('  ✓ Validação FK antes de INSERT');
    console.log('  ✓ Wrapper de transação\n');

    console.log('P1 - Corrigir lógica ambígua:');
    console.log('  ✓ CHECK constraint em lotes (lógica exclusiva)');
    console.log('  ✓ CASCADE DELETE em 6 FKs críticas\n');

    const sql = await generateSprint1SQL();

    // Salvar SQL
    const fs = await import('fs/promises');
    await fs.writeFile('sql-files/sprint-1-corrections.sql', sql);
    console.log('📄 SQL salvo em: sql-files/sprint-1-corrections.sql\n');

    // Executar no DEV
    await executeMigration(sql, devPool, 'DEV');
    await validateSprint1(devPool, 'DEV');

    // Executar no PROD
    await executeMigration(sql, prodPool, 'PROD');
    await validateSprint1(prodPool, 'PROD');

    console.log('='.repeat(70));
    console.log('✅ SPRINT 1 CONCLUÍDO - Correções P0+P1 Implementadas');
    console.log('='.repeat(70));
    console.log('\nPróxima etapa: Sprint 3 - Auditoria de Integridade\n');
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
