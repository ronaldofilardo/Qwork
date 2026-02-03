import { loadEnv } from './load-env';
loadEnv();

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function applyMigration151() {
  console.log('='.repeat(60));
  console.log('MIGRATION 151: Remover Criação Automática de Laudos');
  console.log('='.repeat(60));
  console.log('');

  try {
    console.log('📄 Lendo migration...');
    const migrationPath = join(process.cwd(), 'database', 'migrations', '151_remove_auto_laudo_creation_trigger.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`   ✓ Migration carregada (${migrationSQL.length} caracteres)`);
    console.log('');

    console.log('⚙️  Executando migration 151...');
    const startTime = Date.now();
    await query(migrationSQL);
    const duration = Date.now() - startTime;
    console.log(`   ✅ Migration executada em ${duration}ms`);
    console.log('');

    console.log('✅ MIGRATION 151 CONCLUÍDA!');
    console.log('   - Trigger removido');
    console.log('   - Função removida');
    console.log('   - Laudos órfãos limpos');
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration151().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
