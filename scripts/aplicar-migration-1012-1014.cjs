// Script Node.js: Aplicar Migrations 1012, 1013 e 1014 em produção
// Data: 26/04/2026
// Problema: Tabela confirmacao_identidade não existe em produção
// Erro: NeonDbError: relation "confirmacao_identidade" does not exist
// Rota afetada: POST /api/avaliacao/confirmar-identidade
//
// Migrations aplicadas em ordem:
//   1012_create_confirmacao_identidade.sql    — cria a tabela
//   1013_make_confirmacao_identidade_avaliacao_id_nullable.sql — torna avaliacao_id nullable
//   1014_remove_trigger_auditoria_confirmacao_identidade.sql   — remove trigger com estrutura incorreta
//
// Uso: node scripts/aplicar-migration-1012-1014.cjs

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Carregar DATABASE_URL
let DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env.production.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL=(.+)$/m);
    if (match) {
      DATABASE_URL = match[1].trim().replace(/["']/g, '');
    }
  }
}

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada!');
  console.error('   Configure DATABASE_URL ou crie .env.production.local');
  process.exit(1);
}

const migrations = [
  '1012_create_confirmacao_identidade.sql',
  '1013_make_confirmacao_identidade_avaliacao_id_nullable.sql',
  '1014_remove_trigger_auditoria_confirmacao_identidade.sql',
];

async function aplicar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Conectado ao banco de produção');

    // Verificar se a tabela já existe
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'confirmacao_identidade'
      ) AS exists
    `);
    const tableExists = checkResult.rows[0].exists;
    console.log(`📋 Tabela confirmacao_identidade já existe: ${tableExists}`);

    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, '..', 'database', 'migrations', migrationFile);

      if (!fs.existsSync(migrationPath)) {
        console.error(`❌ Migration não encontrada: ${migrationPath}`);
        process.exit(1);
      }

      // Migration 1012 é sempre aplicada (idempotente via IF NOT EXISTS + DROP POLICY IF EXISTS)
      // Isso garante que as RLS policies sejam (re)criadas mesmo se a tabela já existir

      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      console.log(`\n⚙️  Aplicando ${migrationFile}...`);

      await client.query(migrationSQL);
      console.log(`✅ ${migrationFile} aplicada com sucesso`);
    }

    // Verificar estado final
    const finalCheck = await client.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'confirmacao_identidade'
      ORDER BY ordinal_position
    `);
    console.log('\n📊 Estrutura final da tabela confirmacao_identidade:');
    finalCheck.rows.forEach(row => {
      console.log(`   ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });

    console.log('\n✅ Todas as migrations aplicadas com sucesso!');
    console.log('   A rota /api/avaliacao/confirmar-identidade deve funcionar agora.');
  } catch (err) {
    console.error('❌ Erro ao aplicar migration:', err.message);
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

aplicar();
