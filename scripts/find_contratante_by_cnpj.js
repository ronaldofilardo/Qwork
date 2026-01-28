import pg from 'pg';
const { Client } = pg;
const cnpjArg = process.argv[2];
if (!cnpjArg) {
  console.error('Usage: node scripts/find_contratante_by_cnpj.js <cnpj>');
  process.exit(1);
}
const client = new Client({
  connectionString:
    process.env.LOCAL_DATABASE_URL ||
    'postgresql://postgres:123456@localhost:5432/nr-bps_db',
});
(async () => {
  try {
    await client.connect();
    const clean = cnpjArg.replace(/[^0-9]/g, '');
    const res = await client.query(
      `SELECT id, cnpj, responsavel_cpf, responsavel_nome, status, ativa FROM contratantes WHERE REPLACE(REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', ''), ' ', '') = $1 LIMIT 1`,
      [clean]
    );
    if (res.rows.length === 0) {
      console.log('No contratante found for CNPJ', cnpjArg);
      process.exit(0);
    }
    console.log('Found contratante:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('Error:', err);
    try {
      await client.end();
    } catch (e) {}
    process.exit(1);
  }
})();
