import { loadEnv } from './load-env';
loadEnv();

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function applyMigration150() {
  console.log('='.repeat(60));
  console.log('MIGRATION 150: Remover Automação de Emissão');
  console.log('='.repeat(60));
  console.log('');

  try {
    console.log('📄 Lendo migration...');
    const migrationPath = join(process.cwd(), 'database', 'migrations', '150_remove_auto_emission_trigger.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`   ✓ Migration carregada (${migrationSQL.length} caracteres)`);
    console.log('');

    console.log('⚙️  Executando migration 150...');
    const startTime = Date.now();
    await query(migrationSQL);
    const duration = Date.now() - startTime;
    console.log(`   ✅ Migration executada em ${duration}ms`);
    console.log('');

    console.log('✅ MIGRATION 150 CONCLUÍDA!');
    console.log('   Função de recálculo atualizada (não insere mais em fila_emissao)');
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration150().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
