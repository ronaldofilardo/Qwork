const { Client } = require('pg');
const prodUrl = process.env.DATABASE_URL;

async function run() {
  const c = new Client({ connectionString: prodUrl, connectionTimeoutMillis: 20000 });
  await c.connect();

  // Readicionar constraint com NOT VALID (preserva o PF representante existente)
  await c.query(`
    ALTER TABLE public.representantes
      ADD CONSTRAINT representantes_somente_pj
      CHECK (
        (tipo_pessoa = 'pj')
        OR (tipo_pessoa = 'pf' AND cpf = '22222222222')
      )
      NOT VALID
  `);
  console.log('Constraint representantes_somente_pj readicionada com NOT VALID - OK');

  // Registrar migration 1226 como aplicada
  await c.query('INSERT INTO schema_migrations (version, dirty) VALUES (1226, false) ON CONFLICT (version) DO NOTHING');
  console.log('schema_migrations: versão 1226 registrada');

  await c.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
