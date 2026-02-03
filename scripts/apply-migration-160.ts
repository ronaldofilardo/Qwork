/**
 * Script para aplicar Migration 160: Remove 'codigo' e padroniza em 'id'
 *
 * ATENÇÃO: Esta migration faz mudanças estruturais significativas:
 * - Remove coluna lotes_avaliacao.codigo
 * - Remove função gerar_codigo_lote()
 * - Remove coluna funcionarios.ultimo_lote_codigo
 * - Recria views sem referências a codigo
 *
 * Certifique-se de:
 * 1. Fazer backup do banco antes de executar
 * 2. Atualizar código frontend/backend para usar apenas 'id'
 * 3. Testar completamente após aplicação
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Carrega variáveis de ambiente para conexão com produção
const envPath = join(process.cwd(), '.env.emissor.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  console.log('✅ Variáveis de ambiente carregadas de .env.emissor.local');
} catch (error) {
  console.warn(
    '⚠️ Arquivo .env.emissor.local não encontrado, usando .env padrão'
  );
}

async function applyMigration160() {
  const startTime = Date.now();

  console.log('========================================');
  console.log('APLICANDO MIGRATION 160');
  console.log('Remove codigo e padroniza em id');
  console.log('========================================\n');

  // Importar db após carregar env
  const { query } = await import('../lib/db.js');

  // Ler arquivo SQL da migration
  const migrationPath = join(
    process.cwd(),
    'database',
    'migrations',
    '160_remove_codigo_padronizar_id.sql'
  );
  const migrationSQL = readFileSync(migrationPath, 'utf-8');

  console.log(`📄 Lendo migration de: ${migrationPath}`);
  console.log(`📏 Tamanho: ${migrationSQL.length} caracteres\n`);

  try {
    // Executar migration
    console.log('⏳ Executando migration...\n');
    await query(migrationSQL);

    const duration = Date.now() - startTime;
    console.log('\n✅ Migration 160 aplicada com sucesso!');
    console.log(`⏱️  Tempo de execução: ${duration}ms`);
    console.log('\n========================================');
    console.log('PRÓXIMOS PASSOS:');
    console.log('========================================');
    console.log('1. ✅ Coluna codigo removida de lotes_avaliacao');
    console.log('2. ✅ Função gerar_codigo_lote() removida');
    console.log('3. ✅ Coluna ultimo_lote_codigo removida de funcionarios');
    console.log('4. ⏳ ATUALIZAR CÓDIGO: APIs, componentes, páginas');
    console.log('5. ⏳ TESTAR: Todos os fluxos de lote/laudo');
    console.log('6. ⏳ VALIDAR: Display de lotes em UIs');
    console.log('========================================\n');
  } catch (error) {
    console.error('\n❌ ERRO ao aplicar migration 160:');
    console.error(error);
    console.error(
      '\n⚠️ IMPORTANTE: Verifique o estado do banco e faça rollback se necessário'
    );
    process.exit(1);
  }

  process.exit(0);
}

applyMigration160();
