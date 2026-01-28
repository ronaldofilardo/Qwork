#!/usr/bin/env -S node --loader ts-node/esm

/**
 * Script para aplicar a migration 072
 */
import { query } from '@/lib/db';
import fs from 'fs';

async function main() {
  try {
    const sql = fs.readFileSync(
      'database/migrations/072_fix_lote_trigger_allow_date_updates.sql',
      'utf8'
    );
    await query(sql);
    console.log('Migration 072 aplicada com sucesso');
  } catch (error) {
    console.error('Erro ao aplicar migration:', error);
    process.exit(1);
  }
}

main();
