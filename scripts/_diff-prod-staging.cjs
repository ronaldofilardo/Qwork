'use strict';
const { Client } = require('pg');

const PROD_URL = process.env.PROD_URL;
const STAGING_URL = process.env.STAGING_URL;
const DEV_URL = process.env.DEV_URL;

if (!PROD_URL || !STAGING_URL || !DEV_URL) {
  console.error('Defina PROD_URL, STAGING_URL e DEV_URL no env.');
  process.exit(1);
}

async function inventory(label, url) {
  const c = new Client({ connectionString: url, connectionTimeoutMillis: 30000 });
  await c.connect();
  const tables = (
    await c.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY 1"
    )
  ).rows.map((r) => r.table_name);
  const views = (
    await c.query(
      "SELECT table_name FROM information_schema.views WHERE table_schema='public' ORDER BY 1"
    )
  ).rows.map((r) => r.table_name);
  const funcs = (
    await c.query(
      "SELECT proname FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' ORDER BY 1"
    )
  ).rows.map((r) => r.proname);
  const triggers = (
    await c.query(
      "SELECT trigger_name||'@'||event_object_table AS t FROM information_schema.triggers WHERE trigger_schema='public' GROUP BY 1 ORDER BY 1"
    )
  ).rows.map((r) => r.t);
  const cols = (
    await c.query(
      "SELECT table_name||'.'||column_name AS c FROM information_schema.columns WHERE table_schema='public' ORDER BY 1"
    )
  ).rows.map((r) => r.c);
  const enums = (
    await c.query(
      "SELECT t.typname||':'||string_agg(e.enumlabel, ',' ORDER BY e.enumsortorder) AS v FROM pg_type t JOIN pg_enum e ON e.enumtypid=t.oid JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname='public' GROUP BY t.typname ORDER BY t.typname"
    )
  ).rows.map((r) => r.v);
  const indexes = (
    await c.query(
      "SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY 1"
    )
  ).rows.map((r) => r.indexname);
  // Coleta tipos de colunas para diff de tipo
  const colDefs = {};
  const colDefRows = (
    await c.query(
      "SELECT table_name, column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position"
    )
  ).rows;
  for (const r of colDefRows) {
    colDefs[r.table_name + '.' + r.column_name] = r;
  }
  await c.end();
  return { label, tables, views, funcs, triggers, cols, enums, indexes, colDefs };
}

function diff(a, b, k) {
  const inA = new Set(a[k]);
  const inB = new Set(b[k]);
  return {
    onlyA: [...inA].filter((x) => !inB.has(x)),
    onlyB: [...inB].filter((x) => !inA.has(x)),
  };
}

(async () => {
  const [prod, staging, dev] = await Promise.all([
    inventory('PROD', PROD_URL),
    inventory('STAGING', STAGING_URL),
    inventory('DEV', DEV_URL),
  ]);

  function showDiff(refLabel, ref, targetLabel, target) {
    const sections = ['tables', 'views', 'funcs', 'triggers', 'cols', 'enums', 'indexes'];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`  DEV (${refLabel}) vs ${targetLabel}`);
    console.log('='.repeat(60));
    for (const k of sections) {
      const d = diff(ref, target, k);
      if (d.onlyA.length || d.onlyB.length) {
        console.log(`\n--- ${k.toUpperCase()} ---`);
        if (d.onlyA.length)
          console.log(`  ❌ Falta em ${targetLabel} [${d.onlyA.length}]:`, d.onlyA);
        if (d.onlyB.length)
          console.log(`  ⚠️  Extra em ${targetLabel} (não em DEV) [${d.onlyB.length}]:`, d.onlyB);
      }
    }
  }

  showDiff('nr-bps_db', dev, 'STAGING', staging);
  showDiff('nr-bps_db', dev, 'PROD', prod);
})().catch((e) => {
  console.error('ERRO:', e.message);
  process.exit(1);
});
