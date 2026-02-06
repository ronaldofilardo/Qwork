import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

const prodPool = new Pool({
  connectionString:
    'postgresql://neondb_owner:npg_J2QYqn5oxCzp@ep-divine-sky-a-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function analyzeContratantesFKs() {
  console.log('🔍 Analisando FKs que referenciam contratantes...\n');

  const query = `
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = 'contratantes'
    ORDER BY tc.table_name, kcu.column_name;
  `;

  const result = await devPool.query(query);

  console.log(`✅ Encontradas ${result.rows.length} FKs:\n`);
  result.rows.forEach((row) => {
    console.log(
      `   ${row.table_name}.${row.column_name} → ${row.foreign_table_name}.${row.foreign_column_name}`
    );
    console.log(`   Constraint: ${row.constraint_name}\n`);
  });

  return result.rows;
}

async function generateMigrationSQL(fks: any[]) {
  console.log('📝 Gerando SQL de migração...\n');

  let sql = `-- ================================================
-- ETAPA 1.1: Migração de FKs contratantes→entidades
-- Data: ${new Date().toISOString()}
-- ================================================

BEGIN;

`;

  // Drop FKs antigas
  for (const fk of fks) {
    sql += `-- Drop FK: ${fk.table_name}.${fk.column_name} → contratantes.id\n`;
    sql += `ALTER TABLE ${fk.table_name} DROP CONSTRAINT IF EXISTS ${fk.constraint_name};\n\n`;
  }

  // Recriar FKs apontando para entidades
  for (const fk of fks) {
    // Remover contratante_id se ele não fizer sentido, manter entidade_id
    if (fk.column_name === 'contratante_id') {
      console.log(
        `   ⚠️  ${fk.table_name}.contratante_id será REMOVIDA (obsoleta)`
      );
      sql += `-- Remover coluna obsoleta contratante_id\n`;
      sql += `ALTER TABLE ${fk.table_name} DROP COLUMN IF EXISTS contratante_id;\n\n`;
    } else if (fk.column_name === 'entidade_id') {
      // Recriar FK corretamente para entidades
      const newConstraintName = `fk_${fk.table_name}_entidade_id`;
      sql += `-- Recriar FK: ${fk.table_name}.entidade_id → entidades.id\n`;
      sql += `ALTER TABLE ${fk.table_name} \n`;
      sql += `  ADD CONSTRAINT ${newConstraintName} \n`;
      sql += `  FOREIGN KEY (entidade_id) \n`;
      sql += `  REFERENCES entidades(id) \n`;
      sql += `  ON DELETE CASCADE;\n\n`;
    }
  }

  sql += `COMMIT;

-- ================================================
-- Validação: Verificar FKs após migração
-- ================================================
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name IN ('entidade_id', 'contratante_id')
  AND tc.table_name IN ('${fks.map((f) => f.table_name).join("', '")}')
ORDER BY tc.table_name;
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

  const query = `
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
      AND (ccu.table_name = 'contratantes' OR ccu.table_name = 'entidades')
      AND kcu.column_name IN ('contratante_id', 'entidade_id')
    ORDER BY tc.table_name;
  `;

  const result = await pool.query(query);

  console.log(`   FKs encontradas: ${result.rows.length}`);
  result.rows.forEach((row) => {
    const status = row.foreign_table_name === 'entidades' ? '✅' : '⚠️';
    console.log(
      `   ${status} ${row.table_name}.${row.column_name} → ${row.foreign_table_name}`
    );
  });

  const badFKs = result.rows.filter(
    (r) => r.foreign_table_name === 'contratantes'
  );
  if (badFKs.length > 0) {
    throw new Error(
      `Ainda existem ${badFKs.length} FKs apontando para contratantes!`
    );
  }

  console.log(
    `\n✅ Validação ${env} OK - Nenhuma FK aponta para contratantes\n`
  );
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('ETAPA 1.1: MIGRAÇÃO DE FKs contratantes → entidades');
    console.log('='.repeat(60) + '\n');

    // 1. Analisar FKs
    const fks = await analyzeContratantesFKs();

    if (fks.length === 0) {
      console.log('✅ Nenhuma FK encontrada - migração não necessária\n');
      return;
    }

    // 2. Gerar SQL
    const sql = await generateMigrationSQL(fks);

    // Salvar SQL
    const fs = await import('fs/promises');
    await fs.writeFile('sql-files/migrate-fks-contratantes.sql', sql);
    console.log('📄 SQL salvo em: sql-files/migrate-fks-contratantes.sql\n');

    // 3. Executar no DEV
    await executeMigration(sql, devPool, 'DEV');
    await validateMigration(devPool, 'DEV');

    // 4. Executar no PROD
    await executeMigration(sql, prodPool, 'PROD');
    await validateMigration(prodPool, 'PROD');

    console.log('='.repeat(60));
    console.log('✅ ETAPA 1.1 CONCLUÍDA COM SUCESSO');
    console.log('='.repeat(60));
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  } finally {
    await devPool.end();
    await prodPool.end();
  }
}

main();
