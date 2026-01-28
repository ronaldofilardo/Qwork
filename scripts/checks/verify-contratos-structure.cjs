const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});

async function checkContratosTable() {
  try {
    console.log('=== ESTRUTURA DA TABELA CONTRATOS ===\n');

    const result = await pool.query(`
      SELECT 
        column_name,
        data_type,
        udt_name,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'contratos'
      ORDER BY ordinal_position
    `);

    console.log('Colunas da tabela contratos:\n');
    result.rows.forEach((col) => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      const type = col.udt_name || col.data_type;
      const def = col.column_default ? ` DEFAULT ${col.column_default}` : '';
      console.log(
        `  ${col.column_name.padEnd(25)} ${type.padEnd(30)} ${nullable}${def}`
      );
    });

    // Verificar se existe coluna status
    const statusCol = result.rows.find((r) => r.column_name === 'status');
    if (statusCol) {
      console.log('\n=== ANÁLISE COLUNA STATUS ===');
      console.log(`Tipo: ${statusCol.udt_name}`);
      console.log(`Permite NULL: ${statusCol.is_nullable}`);
      console.log(`Default: ${statusCol.column_default || 'nenhum'}`);

      if (statusCol.udt_name.includes('status')) {
        console.log(`\n✓ Coluna status usa enum: ${statusCol.udt_name}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkContratosTable();
