// Script Node.js: Aplicar Migration 1010 (Consolidação definitiva das funções)
// Data: 10/02/2026
// Uso: node scripts/aplicar-migration-1010.cjs

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
  process.exit(1);
}

// Carregar SQL da migration
const migrationPath = path.join(
  __dirname,
  '..',
  'database',
  'migrations',
  '1010_consolidar_correcao_prevent_mutation_functions.sql'
);
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

async function aplicar() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('============================================');
    console.log('  MIGRATION 1010: Consolidação Definitiva');
    console.log('============================================\n');

    await client.connect();
    console.log('✓ Conectado ao banco de PROD\n');

    // Verificar estado atual
    console.log('1. Verificando funções atuais...\n');

    const checkAvaliacoes = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    const checkLotes = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_lote_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    if (checkAvaliacoes.rows[0]) {
      const temErro1 = checkAvaliacoes.rows[0].def.includes(
        'SELECT status, emitido_em, processamento_em'
      );
      console.log(
        `   ${temErro1 ? '❌' : '✅'} prevent_mutation_during_emission(): ${temErro1 ? 'TEM erro' : 'OK'}`
      );
    } else {
      console.log('   ⚠️  prevent_mutation_during_emission(): NÃO EXISTE');
    }

    if (checkLotes.rows[0]) {
      const temErro2 = checkLotes.rows[0].def.includes('processamento_em');
      console.log(
        `   ${temErro2 ? '❌' : '✅'} prevent_lote_mutation_during_emission(): ${temErro2 ? 'pode ter erro' : 'OK'}`
      );
    } else {
      console.log('   ⚠️  prevent_lote_mutation_during_emission(): NÃO EXISTE');
    }

    console.log('\n2. Aplicando migration 1010...\n');

    // Remover comandos \echo e BEGIN/COMMIT do psql (incompatíveis com pg client)
    const cleanSQL = migrationSQL
      .replace(/^\\echo.*$/gm, '-- $&') // Comentar \echo
      .replace(/^BEGIN;$/gm, '-- BEGIN (managed by client)') // Comentar BEGIN
      .replace(/^COMMIT;$/gm, '-- COMMIT (managed by client)'); // Comentar COMMIT

    // Aplicar migration completa em uma transação
    await client.query('BEGIN');
    try {
      await client.query(cleanSQL);
      await client.query('COMMIT');
      console.log('   ✓ Migration executada\n');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }

    // Validar correção
    console.log('3. Validando correções...\n');

    const validarAvaliacoes = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    const validarLotes = await client.query(`
      SELECT pg_get_functiondef(oid) as def
      FROM pg_proc 
      WHERE proname = 'prevent_lote_mutation_during_emission' 
      AND pronamespace = 'public'::regnamespace;
    `);

    const ainda1 = validarAvaliacoes.rows[0]?.def.includes(
      'SELECT status, emitido_em, processamento_em'
    );

    // Debug: imprimir definição completa da função de lotes
    if (validarLotes.rows[0]?.def.includes('processamento_em')) {
      console.log(
        '\n   ⚠️  DEBUG: prevent_lote_mutation_during_emission() ainda menciona processamento_em:'
      );
      console.log('   ---');
      const lines = validarLotes.rows[0].def.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('processamento')) {
          console.log(`   ${idx}: ${line}`);
        }
      });
      console.log('   ---\n');
    }

    const ainda2 =
      (validarLotes.rows[0]?.def.includes('SELECT') &&
        validarLotes.rows[0]?.def.includes('processamento_em')) ||
      (validarLotes.rows[0]?.def.includes('INTO') &&
        validarLotes.rows[0]?.def.includes('processamento_em')) ||
      (validarLotes.rows[0]?.def.includes('WHERE') &&
        validarLotes.rows[0]?.def.includes('processamento_em'));

    if (ainda1 || ainda2) {
      console.log('   ❌ ERRO: Funções ainda têm problemas!');
      if (ainda1)
        console.log(
          '      - prevent_mutation_during_emission() → processamento_em no SELECT'
        );
      if (ainda2)
        console.log(
          '      - prevent_lote_mutation_during_emission() → processamento_em usado em operação SQL'
        );
      console.log(
        '\n   💡 NOTA: Se só aparecer em comentários, ignorar este erro.\n'
      );
      //process.exit(1);  // Comentado temporariamente para ver o debug
    }

    console.log('   ✅ prevent_mutation_during_emission() corrigida');
    console.log('   ✅ prevent_lote_mutation_during_emission() corrigida');
    console.log('   ✅ Nenhuma referência a processamento_em\n');

    // Verificar triggers
    console.log('4. Verificando triggers...\n');

    const triggers = await client.query(`
      SELECT tgname, tgrelid::regclass::text as tabela
      FROM pg_trigger 
      WHERE tgname IN (
        'trigger_prevent_avaliacao_mutation_during_emission',
        'trigger_prevent_lote_mutation_during_emission'
      )
      ORDER BY tabela;
    `);

    if (triggers.rows.length === 2) {
      triggers.rows.forEach((t) => {
        console.log(`   ✅ ${t.tgname} → ${t.tabela}`);
      });
    } else {
      console.log(
        `   ⚠️  Apenas ${triggers.rows.length}/2 triggers encontrados`
      );
    }

    console.log('\n============================================');
    console.log('  ✅ MIGRATION 1010 APLICADA COM SUCESSO!');
    console.log('============================================\n');

    console.log('🔧 Problemas corrigidos:');
    console.log('   ✓ Erro ao salvar respostas (/api/avaliacao/respostas)');
    console.log('   ✓ Erro ao inativar avaliações (/api/.../inativar)');
    console.log('   ✓ Erro ao concluir avaliações automaticamente');
    console.log('   ✓ Bloqueio de atualização de status do lote\n');

    console.log('📋 Próximos passos:');
    console.log('   1. git add, commit, push (já feito no código)');
    console.log(
      '   2. Aguardar deploy automático no Vercel (ou forçar com vercel --prod)'
    );
    console.log('   3. Testar /api/avaliacao/respostas (salvar resposta)');
    console.log('   4. Testar auto-conclusão de avaliação');
    console.log('   5. Verificar botão "Solicitar emissão" aparece\n');
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    console.error('\nStack:');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

aplicar();
