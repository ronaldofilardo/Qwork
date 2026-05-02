const { Client } = require('pg');
const prodUrl = process.env.DATABASE_URL;

async function run() {
  const c = new Client({ connectionString: prodUrl, connectionTimeoutMillis: 20000 });
  await c.connect();

  // Find migration tracking table
  const tables = await c.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name ILIKE '%migr%'"
  );
  console.log('Tables like migr:', tables.rows.map(r => r.table_name));

  try {
    const r = await c.query('SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 20');
    console.log('schema_migrations:', JSON.stringify(r.rows, null, 2));
  } catch(e) { console.log('No schema_migrations:', e.message.substring(0,80)); }

  try {
    const r = await c.query('SELECT migration_id, applied_at FROM migrations_history ORDER BY migration_id DESC LIMIT 30');
    console.log('migrations_history:', JSON.stringify(r.rows, null, 2));
  } catch(e) { console.log('No migrations_history:', e.message.substring(0,80)); }

  // Check if specific structures still exist
  const checks = [
    ['nf_nome_arquivo column exists', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='comissoes_laudo' AND column_name='nf_nome_arquivo'"],
    ['tipo_beneficiario column exists', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='comissoes_laudo' AND column_name='tipo_beneficiario'"],
    ['percentual_comissao_vendedor in leads', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='leads_representante' AND column_name='percentual_comissao_vendedor'"],
    ['representantes.codigo column exists', "SELECT COUNT(*) FROM information_schema.columns WHERE table_name='representantes' AND column_name='codigo'"],
    ['ciclos_comissao table exists', "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='ciclos_comissao'"],
  ];

  for (const [label, sql] of checks) {
    const r = await c.query(sql);
    console.log(label + ':', r.rows[0].count);
  }

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
