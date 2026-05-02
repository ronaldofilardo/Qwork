// Script: _drop-remaining-cols-prod.cjs
// Remove as últimas colunas obsoletas de PROD que não existem em DEV

const { Client } = require('pg');
const PROD_URL = process.env.DATABASE_URL;

const COLUMNS_TO_DROP = [
  { table: 'analise_estatistica', column: 'anomalia_detectada' },
  { table: 'analise_estatistica', column: 'tipo_anomalia' },
  { table: 'comissoes_laudo',     column: 'ciclo_id' },
  { table: 'comissoes_laudo',     column: 'tipo_beneficiario' },
  { table: 'comissoes_laudo',     column: 'vendedor_id' },
  { table: 'hierarquia_comercial',column: 'percentual_override' },
  { table: 'representantes',      column: 'percentual_vendedor_direto' },
];

async function run() {
  const c = new Client({ connectionString: PROD_URL, connectionTimeoutMillis: 30000 });
  await c.connect();

  console.log('=== Verificando dados antes de dropar ===');
  for (const { table, column } of COLUMNS_TO_DROP) {
    try {
      const r = await c.query('SELECT COUNT(*) FROM ' + table + ' WHERE ' + column + ' IS NOT NULL');
      const count = parseInt(r.rows[0].count);
      if (count > 0) {
        console.log('⚠️  ' + table + '.' + column + ': ' + count + ' non-null rows — verificar!');
      } else {
        console.log('✅ ' + table + '.' + column + ': 0 non-null (seguro dropar)');
      }
    } catch (err) {
      if (err.message.includes('does not exist')) {
        console.log('⏭  ' + table + '.' + column + ': coluna não existe');
      } else {
        console.log('? ' + table + '.' + column + ': ' + err.message.substring(0, 80));
      }
    }
  }

  console.log('\n=== Dropando colunas ===');
  for (const { table, column } of COLUMNS_TO_DROP) {
    try {
      await c.query('ALTER TABLE ' + table + ' DROP COLUMN IF EXISTS ' + column);
      console.log('✅ DROP COLUMN ' + table + '.' + column);
    } catch (err) {
      console.log('❌ DROP COLUMN ' + table + '.' + column + ': ' + err.message.substring(0, 100));
    }
  }

  await c.end();
  console.log('\n=== Concluído ===');
}

run().catch(e => { console.error(e.message); process.exit(1); });
