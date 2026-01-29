/**
 * Script para aplicar migrations 022-024 no banco de testes
 */

import { query } from '../lib/db.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyTestMigrations() {
  console.log('Aplicando migrations 022-024 no banco de testes...');

  try {
    // Migration 022
    console.log('\n=== Migration 022: remove_admin_funcionarios_policies ===');
    const migration022 = await fs.readFile(
      path.join(
        __dirname,
        '../database/migrations/022_remove_admin_funcionarios_policies.sql'
      ),
      'utf-8'
    );
    await query(migration022);
    console.log('✓ Migration 022 aplicada');

    // Migration 023
    console.log('\n=== Migration 023: remove_all_admin_operational_rls ===');
    const migration023 = await fs.readFile(
      path.join(
        __dirname,
        '../database/migrations/023_remove_all_admin_operational_rls.sql'
      ),
      'utf-8'
    );
    await query(migration023);
    console.log('✓ Migration 023 aplicada');

    // Migration 024
    console.log('\n=== Migration 024: cleanup_final_admin_policies ===');
    const migration024 = await fs.readFile(
      path.join(
        __dirname,
        '../database/migrations/024_cleanup_final_admin_policies.sql'
      ),
      'utf-8'
    );
    await query(migration024);
    console.log('✓ Migration 024 aplicada');

    // Verificar resultado final
    console.log('\n=== Verificando políticas admin restantes ===');
    const remainingPolicies = await query(`
      SELECT tablename, policyname 
      FROM pg_policies 
      WHERE schemaname = 'public' 
        AND policyname ILIKE '%admin%'
        AND tablename NOT IN ('audit_logs', 'roles', 'permissions', 'role_permissions')
      ORDER BY tablename, policyname
    `);

    if (remainingPolicies.rowCount === 0) {
      console.log('✓ Nenhuma política admin operacional restante');
    } else {
      console.log(
        `⚠ Ainda existem ${remainingPolicies.rowCount} políticas admin operacionais:`
      );
      remainingPolicies.rows.forEach((row) => {
        console.log(`  - ${row.tablename}.${row.policyname}`);
      });
    }

    console.log('\n✓ Migrations aplicadas com sucesso no banco de testes!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao aplicar migrations:', error);
    process.exit(1);
  }
}

applyTestMigrations();
