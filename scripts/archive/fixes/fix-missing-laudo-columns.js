#!/usr/bin/env node
// Script simple para corrigir colunas de laudos localmente (adiciona IF NOT EXISTS)
// Uso: node scripts/fix-missing-laudo-columns.js

import { query } from '../lib/db.js';

async function run() {
  try {
    console.log(
      '[fix] Aplicando ALTER TABLE para garantir colunas relatorio_* em laudos...'
    );

    await query(`ALTER TABLE laudos
      ADD COLUMN IF NOT EXISTS relatorio_individual BYTEA,
      ADD COLUMN IF NOT EXISTS relatorio_lote BYTEA,
      ADD COLUMN IF NOT EXISTS relatorio_setor BYTEA,
      ADD COLUMN IF NOT EXISTS hash_relatorio_individual VARCHAR(64),
      ADD COLUMN IF NOT EXISTS hash_relatorio_lote VARCHAR(64),
      ADD COLUMN IF NOT EXISTS hash_relatorio_setor VARCHAR(64);
    `);

    await query(
      `CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_individual ON laudos (relatorio_individual) WHERE relatorio_individual IS NOT NULL;`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_lote ON laudos (relatorio_lote) WHERE relatorio_lote IS NOT NULL;`
    );
    await query(
      `CREATE INDEX IF NOT EXISTS idx_laudos_relatorio_setor ON laudos (relatorio_setor) WHERE relatorio_setor IS NOT NULL;`
    );

    console.log('[fix] Colunas e índices garantidos com sucesso.');
    process.exit(0);
  } catch (err) {
    console.error('[fix] Falha ao aplicar correções:', err);
    process.exit(1);
  }
}

run();
