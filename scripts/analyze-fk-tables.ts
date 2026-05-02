import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
});

async function analyzeTableStructure(tableName: string) {
  console.log(`\n📋 Estrutura de ${tableName}:\n`);

  const query = `
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
  `;

  const result = await devPool.query(query, [tableName]);

  result.rows.forEach((col) => {
    console.log(
      `   ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`
    );
  });

  return result.rows;
}

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('ANÁLISE DE ESTRUTURA DAS TABELAS');
    console.log('='.repeat(60));

    await analyzeTableStructure('tomadors');
    await analyzeTableStructure('tomadors_senhas');
    await analyzeTableStructure('entidades_senhas');
    await analyzeTableStructure('entidades');
    await analyzeTableStructure('clinicas');
  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
  } finally {
    await devPool.end();
  }
}

main();
