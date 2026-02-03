import { loadEnv } from './load-env';
loadEnv();

import { readFileSync } from 'fs';
import { join } from 'path';
import { query } from '../lib/db';

async function applyMigration152() {
  console.log('='.repeat(60));
  console.log('MIGRATION 152: Adicionar Tipo de Notificação');
  console.log('='.repeat(60));
  console.log('');

  try {
    console.log('📄 Lendo migration...');
    const migrationPath = join(process.cwd(), 'database', 'migrations', '152_add_tipo_notificacao_emissao_solicitada.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    console.log(`   ✓ Migration carregada (${migrationSQL.length} caracteres)`);
    console.log('');

    console.log('⚙️  Executando migration 152...');
    const startTime = Date.now();
    await query(migrationSQL);
    const duration = Date.now() - startTime;
    console.log(`   ✅ Migration executada em ${duration}ms`);
    console.log('');

    console.log('✅ MIGRATION 152 CONCLUÍDA!');
    console.log('   Tipo de notificação "emissao_solicitada_sucesso" adicionado');
    console.log('');

  } catch (error: any) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

applyMigration152().catch((e) => {
  console.error('Erro fatal:', e);
  process.exit(1);
});
