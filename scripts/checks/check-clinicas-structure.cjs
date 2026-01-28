const pg = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nr-bps_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '123456',
  ssl: false,
};

async function checkTable() {
  const client = new pg.Client(dbConfig);

  try {
    await client.connect();

    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'clinicas'
      ORDER BY ordinal_position
    `);

    console.log('Estrutura da tabela clinicas:');
    result.rows.forEach((row) => {
      console.log(
        `  ${row.column_name}: ${row.data_type} (${row.is_nullable}) default: ${row.column_default || 'null'}`
      );
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await client.end();
  }
}

checkTable();
