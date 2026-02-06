/**
 * Script para aplicar migration 306: corrigir enum usuario_tipo_enum
 */

import { query } from '../lib/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration306() {
  console.log(
    '=== Aplicando Migration 306: corrigir enum usuario_tipo_enum ===\n'
  );

  try {
    const migrationSQL = await fs.readFile(
      path.join(__dirname, '../database/migrations/306_remove_rh_enum.sql'),
      'utf-8'
    );

    console.log('Executando migration...');
    await query(migrationSQL);
    console.log('✅ Migration 306 aplicada com sucesso!\n');

    // Verificar resultado
    console.log('Verificando enum atualizado...');
    const enumResult = await query(`
      SELECT enumtypid::regtype AS enum_type, enumlabel AS value
      FROM pg_enum
      WHERE enumtypid = 'usuario_tipo_enum'::regtype
      ORDER BY enumsortorder
    `);

    console.log('Valores do enum:');
    enumResult.rows.forEach((row) => {
      console.log(`  ${row.enum_type} | ${row.value}`);
    });

    console.log('\nVerificando distribuição de tipos na tabela usuarios...');
    const tiposResult = await query(`
      SELECT tipo_usuario, COUNT(*) as quantidade
      FROM usuarios
      GROUP BY tipo_usuario
      ORDER BY tipo_usuario
    `);

    tiposResult.rows.forEach((row) => {
      console.log(`  ${row.tipo_usuario}: ${row.quantidade} registros`);
    });

    console.log('\n✅ Migration concluída!');
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
    throw error;
  }
}

applyMigration306()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
