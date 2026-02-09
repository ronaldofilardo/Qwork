require('dotenv').config({ path: '.env.test' });
const { Client } = require('pg');
(async () => {
  const client = new Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  try {
    await client.connect();
    const res = await client.query(
      `SELECT DISTINCT f.contratante_id as id FROM funcionarios f LEFT JOIN tomadores c ON f.contratante_id = c.id WHERE f.contratante_id IS NOT NULL AND c.id IS NULL`
    );
    const ids = res.rows.map((r) => r.id).filter(Boolean);
    console.log('missing contratante ids:', ids);
    for (const id of ids) {
      try {
        await client.query(
          `INSERT INTO tomadores (id, tipo, nome, cnpj, email, ativa) VALUES ($1, 'entidade', $2, '00000000000000', 'auto-seed@tests.local', true)`,
          [id, `Auto Seed contratante ${id}`]
        );
        console.log('Inserted contratante', id);
      } catch (err) {
        console.warn('Insert failed for id', id, err.message || err);
      }
    }
    await client.end();
  } catch (err) {
    console.error('Error:', err.message || err);
    process.exit(1);
  }
})();
