const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function checkDatabase() {
  try {
    console.log('=== VERIFICANDO BANCO DE DADOS ===\n');

    // Listar todas as tabelas
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);

    console.log(`Total de tabelas: ${tables.rows.length}\n`);
    tables.rows.forEach((t) => console.log(`  - ${t.tablename}`));

    // Verificar se contratos existe
    const hasContratos = tables.rows.some((t) => t.tablename === 'contratos');
    console.log(
      `\n${hasContratos ? '✓' : '✗'} Tabela 'contratos' ${hasContratos ? 'EXISTE' : 'NÃO EXISTE'}`
    );

    // Verificar contratantes
    const hasContratantes = tables.rows.some(
      (t) => t.tablename === 'contratantes'
    );
    console.log(
      `${hasContratantes ? '✓' : '✗'} Tabela 'contratantes' ${hasContratantes ? 'EXISTE' : 'NÃO EXISTE'}`
    );

    if (hasContratantes) {
      console.log('\n=== ESTRUTURA DA TABELA CONTRATANTES ===\n');
      const cols = await pool.query(`
        SELECT column_name, udt_name, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'contratantes'
        ORDER BY ordinal_position
      `);
      cols.rows.forEach((col) => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        console.log(
          `  ${col.column_name.padEnd(30)} ${col.udt_name.padEnd(30)} ${nullable}`
        );
      });

      const statusCol = cols.rows.find((r) => r.column_name === 'status');
      if (statusCol) {
        console.log(
          `\n✓ Coluna 'status' encontrada: tipo = ${statusCol.udt_name}`
        );
      }
    }
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabase();
