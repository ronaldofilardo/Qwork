/**
 * Script para aplicar Migration 520: Sistema de convite e criação de senha para representantes
 *
 * Aplica somente no banco nr-bps_db (desenvolvimento).
 * Carrega .env.local pelo DATABASE_URL apontando para nr-bps_db.
 *
 * Execução:
 *   pnpm tsx scripts/apply-migration-520.ts
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Carrega variáveis de ambiente (.env.local aponta para nr-bps_db)
const envFiles = ['.env.local', '.env'];

for (const envFile of envFiles) {
  const envPath = join(process.cwd(), envFile);
  try {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const value = trimmed.slice(eqIdx + 1).trim();
          if (key && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log(`✅ Variáveis de ambiente carregadas de ${envFile}`);
    break;
  } catch {
    // Tentar próximo arquivo
  }
}

async function applyMigration520() {
  const startTime = Date.now();

  console.log('========================================');
  console.log('APLICANDO MIGRATION 520');
  console.log('Sistema de convite e criação de senha para representantes');
  console.log('Banco alvo: nr-bps_db (desenvolvimento)');
  console.log('========================================\n');

  if (!process.env.DATABASE_URL) {
    console.error(
      '❌ DATABASE_URL não configurada. Verifique .env.local ou .env'
    );
    process.exit(1);
  }

  // Confirmar banco alvo (nr-bps_db)
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl.includes('nr-bps_db') && !dbUrl.includes('localhost')) {
    console.warn('⚠️  DATABASE_URL não parece apontar para nr-bps_db!');
    console.warn(`   URL: ${dbUrl.substring(0, 50)}...`);
    console.warn('   Continuando mesmo assim...\n');
  } else {
    console.log('✅ Banco alvo confirmado: nr-bps_db\n');
  }

  // Importar db após carregar env
  const { query } = await import('../lib/db.js');

  // Ler arquivo SQL da migration
  const migrationPath = join(
    process.cwd(),
    'database',
    'migrations',
    '520_representante_convites_senha.sql'
  );

  let migrationSQL: string;
  try {
    migrationSQL = readFileSync(migrationPath, 'utf-8');
  } catch {
    console.error(`❌ Arquivo SQL não encontrado: ${migrationPath}`);
    process.exit(1);
  }

  console.log(`📄 Lendo migration de: ${migrationPath}`);
  console.log(`📏 Tamanho: ${migrationSQL.length} caracteres\n`);

  // Verificar estado atual da tabela
  console.log('🔍 Verificando estado atual da tabela representantes...');
  try {
    const colsRes = await query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'representantes'
         AND column_name IN ('senha_repres', 'convite_token', 'convite_expira_em', 'convite_tentativas_falhas', 'convite_usado_em')
       ORDER BY column_name`
    );

    if (colsRes.rows.length > 0) {
      console.log('  Colunas já existentes:');
      colsRes.rows.forEach(
        (row: { column_name: string; data_type: string }) => {
          console.log(`    - ${row.column_name} (${row.data_type})`);
        }
      );
    } else {
      console.log('  Nenhuma coluna de convite ainda — migration necessária.');
    }
    console.log();
  } catch (err) {
    console.warn('  ⚠️  Não foi possível verificar estado atual:', err);
    console.log();
  }

  // Aplicar migration
  console.log('📦 Aplicando migration...\n');
  try {
    await query(migrationSQL);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('========================================');
    console.log(`✅ Migration 520 aplicada com sucesso! (${duration}s)`);
    console.log('========================================\n');

    // Verificar colunas criadas
    console.log('🔍 Verificando colunas criadas:\n');
    const verifyRes = await query(
      `SELECT column_name, data_type, column_default, is_nullable
       FROM information_schema.columns
       WHERE table_name = 'representantes'
         AND column_name IN ('senha_repres', 'convite_token', 'convite_expira_em', 'convite_tentativas_falhas', 'convite_usado_em')
       ORDER BY column_name`
    );

    if (verifyRes.rows.length === 0) {
      console.warn(
        '⚠️  Nenhuma coluna encontrada após migration — verifique manualmente'
      );
    } else {
      verifyRes.rows.forEach((row: Record<string, unknown>) => {
        console.log(
          `  ✅ ${row.column_name}: ${row.data_type}` +
            (row.column_default ? ` DEFAULT ${row.column_default}` : '') +
            (row.is_nullable === 'YES' ? ' (nullable)' : ' NOT NULL')
        );
      });
    }

    console.log('\n🏁 Próximos passos:');
    console.log('  1. Iniciar o servidor: pnpm dev');
    console.log('  2. Converter um lead pelo painel admin');
    console.log('  3. Verificar no console o link de convite logado');
    console.log('  4. Acessar o link e criar a senha');
    console.log('  5. Testar login com CPF + nova senha\n');
  } catch (err) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n❌ Erro ao aplicar migration (${duration}s):`);
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}

applyMigration520().catch((err) => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
