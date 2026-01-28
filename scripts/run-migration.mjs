import { query } from '../lib/db.ts';
import fs from 'fs';

async function runMigration() {
  try {
    const sql = fs.readFileSync(
      '../database/migrations/020_sistema_planos_contratos_pagamentos.sql',
      'utf8'
    );
    console.log('Executando migração 020...');
    console.log('SQL length:', sql.length);
    await query(sql);
    console.log('✅ Migração 020 executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro na migração:', error);
  }
}

runMigration();
