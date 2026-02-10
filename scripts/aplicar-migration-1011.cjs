// Script Node.js: Aplicar Migration 1011 (Remover processamento_em de audit_lote_change)
// Data: 10/02/2026
// Problema: Trigger audit_lote_change() referencia coluna processamento_em (removida na Migration 130)
// Erro: "record "old" has no field "processamento_em"" ao concluir avaliações
// Uso: node scripts/aplicar-migration-1011.cjs

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

// Carregar SQL da migration
const migrationPath = path.join(
  __dirname,
  '..',
  'database',
  'migrations',
  '1011_fix_audit_lote_remove_processamento_em.sql'
);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration não encontrada: ${migrationPath}`);
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function aplicar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('================================================================');
    console.log('  MIGRATION 1011: Remover processamento_em de audit_lote_change');
    console.log('================================================================\n');

    await client.connect();
    console.log('✅ Conectado ao banco de PROD\n');

    // VERIFICAR ESTADO ATUAL
    console.log('1. Verificando função audit_lote_change() atual...\n');

    const checkResult = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'audit_lote_change' 
      AND pronamespace = 'public'::regnamespace;
    `);

    if (checkResult.rows.length === 0) {
      console.error('❌ ERRO: Função audit_lote_change() não encontrada!');
      process.exit(1);
    }

    const currentDef = checkResult.rows[0].def;
    const hasProcessamentoEm = currentDef.includes('processamento_em');

    if (hasProcessamentoEm) {
      console.log('   ❌ audit_lote_change() REFERENCIA processamento_em (PRECISA CORREÇÃO)');
    } else {
      console.log('   ✅ audit_lote_change() NÃO referencia processamento_em (JÁ CORRIGIDA)');
      console.log('\n⚠️  Migration já foi aplicada. Encerrando.\n');
      return;
    }

    console.log('\n2. Aplicando Migration 1011...\n');

    // Remover comandos incompatíveis com pg client
    const cleanSQL = migrationSQL
      .replace(/^\\echo.*$/gm, '-- $&') // Comentar \echo
      .replace(/^BEGIN;$/gm, '-- BEGIN (managed by client)') // Comentar BEGIN
      .replace(/^COMMIT;$/gm, '-- COMMIT (managed by client)'); // Comentar COMMIT

    // Aplicar migration em uma transação
    await client.query('BEGIN');
    try {
      await client.query(cleanSQL);
      await client.query('COMMIT');
      console.log('   ✅ Migration 1011 aplicada com sucesso!\n');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    // VALIDAR RESULTADO
    console.log('3. Validando correção...\n');

    const validateResult = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'audit_lote_change' 
      AND pronamespace = 'public'::regnamespace;
    `);

    const newDef = validateResult.rows[0].def;
    const stillHasProcessamentoEm = newDef.includes('processamento_em');

    if (stillHasProcessamentoEm) {
      console.error('   ❌ FALHA: audit_lote_change() AINDA referencia processamento_em');
      console.error('   Por favor, verifique a migration manualmente.\n');
      process.exit(1);
    } else {
      console.log('   ✅ audit_lote_change() não referencia mais processamento_em');
    }

    // Verificar registros na audit_logs
    const auditCheck = await client.query(`
      SELECT id, created_at, action, details->>'lote_id' as lote_id
      FROM audit_logs
      WHERE action = 'MIGRATION_APPLIED'
      AND resource = 'audit_lote_change'
      ORDER BY created_at DESC
      LIMIT 1;
    `);

    if (auditCheck.rows.length > 0) {
      const log = auditCheck.rows[0];
      console.log(`   ✅ Registro de auditoria criado: ID ${log.id} em ${log.created_at}`);
    }

    console.log('\n================================================================');
    console.log('                    ✅ MIGRAÇÃO CONCLUÍDA                       ');
    console.log('================================================================\n');
    console.log('🎯 Teste agora:');
    console.log('   1. Login como funcionário');
    console.log('   2. Responder todas as perguntas');
    console.log('   3. Auto-conclusão deve salvar sem erro "processamento_em"\n');

  } catch (erro) {
    console.error('\n❌ ERRO ao aplicar Migration 1011:\n');
    console.error(erro);
    console.error('\n');
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão encerrada.\n');
  }
}

// Executar
aplicar().catch(console.error);
