/**
 * Script para aplicar migration 305: fix_gestores_view
 */

import { query } from '../lib/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration305() {
  console.log('=== Aplicando Migration 305: fix_gestores_view ===\n');

  try {
    const migrationSQL = await fs.readFile(
      path.join(__dirname, '../database/migrations/305_fix_gestores_view.sql'),
      'utf-8'
    );

    console.log('Executando migration...');
    await query(migrationSQL);
    console.log('✅ Migration 305 aplicada com sucesso!\n');

    // Verificar resultado
    console.log('Verificando view gestores...');
    const result = await query(`
      SELECT 
        COUNT(*) as total_gestores,
        COUNT(*) FILTER (WHERE usuario_tipo = 'rh') as gestores_rh,
        COUNT(*) FILTER (WHERE usuario_tipo = 'gestor') as gestores_entidade
      FROM gestores
    `);

    console.log('Resultado:', result.rows[0]);
    console.log('\n✅ Migration concluída!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  }
}

applyMigration305()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
