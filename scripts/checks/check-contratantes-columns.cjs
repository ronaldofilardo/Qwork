const { Pool } = require('pg');

const pool = new Pool({
  connectionString: (process.env.LOCAL_DATABASE_URL ?? 'postgresql://postgres@localhost:5432/nr-bps_db'),
});

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'tomadores'
      ORDER BY ordinal_position
    `);

    console.log('=== Colunas da tabela tomadores ===\n');
    result.rows.forEach((col) => {
      console.log(
        `${col.column_name.padEnd(35)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`
      );
    });

    const hasNumeroFuncionarios = result.rows.some((r) =>
      r.column_name.includes('numero_funcionarios')
    );
    console.log(
      `\n${hasNumeroFuncionarios ? '✓' : '✗'} Coluna relacionada a numero_funcionarios: ${hasNumeroFuncionarios ? 'EXISTE' : 'NÃO EXISTE'}`
    );
  } catch (error) {
    console.error('Erro:', error.message);
  } finally {
    await pool.end();
  }
}

checkColumns();
