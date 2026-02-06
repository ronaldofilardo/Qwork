import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

const prodPool = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-acuderi7.sa-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function generateCorrectMigrationSQL() {
  console.log('📝 Gerando SQL de migração corrigido...\n');

  const sql = `-- ================================================================
-- ETAPA 1.1: Migração CORRIGIDA - Arquitetura Independente
-- Data: ${new Date().toISOString()}
-- ================================================================
-- ARQUITETURA:
-- - Entidades: independentes, têm funcionários direto (SEM empresas)
-- - Clínicas: independentes, têm empresas → empresas têm funcionários
-- - Ambas são "contratantes" com IDs sequenciais compartilhados
-- ================================================================

BEGIN;

-- ================================================================
-- 1. CORRIGIR ARQUITETURA: Remover vinculação clínica→entidade
-- ================================================================

-- Clínicas são INDEPENDENTES, não podem ter entidade_id
ALTER TABLE clinicas DROP COLUMN IF EXISTS entidade_id CASCADE;

COMMENT ON TABLE clinicas IS 'Clínicas independentes (contratantes). Têm empresas → empresas têm funcionários.';

-- ================================================================
-- 2. REMOVER TABELAS OBSOLETAS contratantes*
-- ================================================================

-- Backup da audit (tem 3 registros) - apenas se existir
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'contratantes_senhas_audit') THEN
    CREATE TABLE IF NOT EXISTS _backup_contratantes_senhas_audit AS 
    SELECT * FROM contratantes_senhas_audit;
  END IF;
END $$;

-- Drop tabelas obsoletas
DROP TABLE IF EXISTS contratantes_senhas CASCADE;
DROP TABLE IF EXISTS contratantes_senhas_audit CASCADE;
DROP TABLE IF EXISTS contratantes CASCADE;

-- ================================================================
-- 3. CRIAR clinicas_senhas (equivalente a entidades_senhas)
-- ================================================================

CREATE TABLE IF NOT EXISTS clinicas_senhas (
  id SERIAL PRIMARY KEY,
  clinica_id INTEGER NOT NULL REFERENCES clinicas(id) ON DELETE CASCADE,
  cpf VARCHAR(11) NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  primeira_senha_alterada BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT uk_clinicas_senhas_cpf UNIQUE (cpf)
);

CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_clinica_id ON clinicas_senhas(clinica_id);
CREATE INDEX IF NOT EXISTS idx_clinicas_senhas_cpf ON clinicas_senhas(cpf);

COMMENT ON TABLE clinicas_senhas IS 'Senhas de gestores RH das clínicas (equivalente a entidades_senhas para gestores de entidade)';

-- ================================================================
-- 4. VALIDAÇÃO: Garantir entidades_senhas está correta
-- ================================================================

-- entidades_senhas já aponta corretamente para entidades(id)
-- Apenas adicionar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_entidade_id ON entidades_senhas(entidade_id);
CREATE INDEX IF NOT EXISTS idx_entidades_senhas_cpf ON entidades_senhas(cpf);

COMMENT ON TABLE entidades_senhas IS 'Senhas de gestores das entidades (equivalente a clinicas_senhas para gestores RH)';

COMMIT;

-- ================================================================
-- VALIDAÇÃO FINAL
-- ================================================================

-- Verificar que não existem mais FKs apontando para contratantes
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'contratantes';

-- Deve retornar 0 linhas se migração for bem-sucedida
`;

  return sql;
}

async function executeMigration(sql: string, pool: Pool, env: string) {
  console.log(`\n🚀 Executando migração no ${env}...\n`);

  try {
    await pool.query(sql);
    console.log(`✅ Migração ${env} executada com sucesso!\n`);
  } catch (error: any) {
    console.error(`❌ Erro na migração ${env}:`, error.message);
    throw error;
  }
}

async function validateMigration(pool: Pool, env: string) {
  console.log(`🔍 Validando migração no ${env}...\n`);

  // Verificar que contratantes não existe mais
  const checkContratantes = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'contratantes'
    ) as exists;
  `);

  if (checkContratantes.rows[0].exists) {
    throw new Error(`Tabela contratantes ainda existe em ${env}!`);
  }
  console.log(`   ✅ Tabela contratantes removida`);

  // Verificar que clinicas_senhas existe
  const checkClinicasSenhas = await pool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'clinicas_senhas'
    ) as exists;
  `);

  if (!checkClinicasSenhas.rows[0].exists) {
    throw new Error(`Tabela clinicas_senhas não foi criada em ${env}!`);
  }
  console.log(`   ✅ Tabela clinicas_senhas criada`);

  // Verificar que clinicas não tem mais entidade_id
  const checkClinicasColumns = await pool.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'clinicas' AND column_name = 'entidade_id';
  `);

  if (checkClinicasColumns.rows.length > 0) {
    throw new Error(`Coluna clinicas.entidade_id ainda existe em ${env}!`);
  }
  console.log(
    `   ✅ Coluna clinicas.entidade_id removida (arquitetura corrigida)`
  );

  // Verificar FKs
  const checkFKs = await pool.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'contratantes';
  `);

  if (checkFKs.rows.length > 0) {
    throw new Error(
      `Ainda existem ${checkFKs.rows.length} FKs apontando para contratantes em ${env}!`
    );
  }
  console.log(`   ✅ Nenhuma FK aponta para contratantes`);

  console.log(
    `\n✅ Validação ${env} OK - Arquitetura independente implementada\n`
  );
}

async function main() {
  try {
    console.log('='.repeat(70));
    console.log('ETAPA 1.1: MIGRAÇÃO CORRIGIDA - Arquitetura Independente');
    console.log('='.repeat(70) + '\n');

    console.log('ARQUITETURA:');
    console.log('  Entidades: independentes, têm funcionários (SEM empresas)');
    console.log('  Clínicas: independentes, têm empresas → funcionários');
    console.log('  IDs: sequenciais compartilhados (sem buracos)\n');

    // 1. Gerar SQL
    const sql = await generateCorrectMigrationSQL();

    // Salvar SQL
    const fs = await import('fs/promises');
    await fs.writeFile('sql-files/migrate-architecture-corrected.sql', sql);
    console.log(
      '📄 SQL salvo em: sql-files/migrate-architecture-corrected.sql\n'
    );

    // 2. Executar no DEV
    await executeMigration(sql, devPool, 'DEV');
    await validateMigration(devPool, 'DEV');

    // 3. Executar no PROD
    await executeMigration(sql, prodPool, 'PROD');
    await validateMigration(prodPool, 'PROD');

    console.log('='.repeat(70));
    console.log(
      '✅ ETAPA 1.1 CONCLUÍDA - Arquitetura Independente Implementada'
    );
    console.log('='.repeat(70));
    console.log(
      '\nPróxima etapa: Sprint 0 - SEQUENCE compartilhada para IDs contratantes\n'
    );
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
