import { Pool } from 'pg';

const devPool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function checkTable() {
  console.log('🔍 Verificando tabela contratantes_funcionarios...\n');

  // Verificar se existe
  const exists = await devPool.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'contratantes_funcionarios'
    ) as exists;
  `);

  if (!exists.rows[0].exists) {
    console.log('   ✅ Tabela contratantes_funcionarios NÃO existe\n');
    return false;
  }

  console.log('   ⚠️  Tabela contratantes_funcionarios EXISTE\n');

  // Ver estrutura
  const structure = await devPool.query(`
    SELECT 
      column_name,
      data_type,
      is_nullable
    FROM information_schema.columns
    WHERE table_name = 'contratantes_funcionarios'
    ORDER BY ordinal_position;
  `);

  console.log('   Colunas:');
  structure.rows.forEach((col) => {
    console.log(`      ${col.column_name} (${col.data_type})`);
  });

  // Contar registros
  const count = await devPool.query(
    `SELECT COUNT(*) FROM contratantes_funcionarios;`
  );
  console.log(`\n   Registros: ${count.rows[0].count}\n`);

  return true;
}

async function main() {
  try {
    const exists = await checkTable();

    if (exists) {
      console.log(
        '⚠️  ATENÇÃO: Esta tabela precisa ser renomeada ou removida!\n'
      );
    }
  } catch (error: any) {
    console.error('❌ ERRO:', error.message);
  } finally {
    await devPool.end();
  }
}

main();
