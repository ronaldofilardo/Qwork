#!/usr/bin/env node

const { query } = require('../lib/db');

async function run() {
  try {
    console.log('\nBuscando laudos com id diferente de lote_id (até 100):');
    const res = await query(
      'SELECT id, lote_id, status, criado_em FROM laudos WHERE id IS DISTINCT FROM lote_id ORDER BY criado_em DESC LIMIT 100'
    );
    console.log('Encontrados:', res.rows.length);
    console.table(res.rows);

    // Contar total
    const cnt = await query(
      'SELECT COUNT(*) FROM laudos WHERE id IS DISTINCT FROM lote_id'
    );
    console.log('\nTotal de laudos com id != lote_id:', cnt.rows[0].count);

    // Mostrar primeiros 10 lotes com problemas (lote ids)
    const lotes = await query(
      'SELECT DISTINCT lote_id FROM laudos WHERE id IS DISTINCT FROM lote_id LIMIT 20'
    );
    console.log(
      '\nLotes afetados (ex.):',
      lotes.rows.map((r) => r.lote_id)
    );

    process.exit(0);
  } catch (err) {
    console.error(
      'Erro ao verificar mismatch:',
      err instanceof Error ? err.message : String(err)
    );
    process.exit(1);
  }
}

run();
