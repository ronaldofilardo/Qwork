#!/usr/bin/env node

/**
 * VALIDADOR DE ISOLAMENTO DE AMBIENTES
 *
 * Este script valida que o ambiente de testes está corretamente isolado
 * do ambiente de desenvolvimento antes de executar qualquer teste.
 *
 * POLÍTICA: Código fonte é a fonte da verdade (TESTING-POLICY.md)
 * OBJETIVO: Garantir que testes NUNCA usem o banco nr-bps_db
 */

console.log('\n🔍 Validando isolamento de ambientes...\n');

let hasErrors = false;

// ============================================================================
// VALIDAÇÃO 1: TEST_DATABASE_URL está definida
// ============================================================================

if (!process.env.TEST_DATABASE_URL) {
  console.error('❌ FALHA CRÍTICA: TEST_DATABASE_URL não está definida');
  console.error(
    '   Configure: TEST_DATABASE_URL=postgres://postgres:123456@localhost:5432/nr-bps_db_test'
  );
  console.error('   Arquivo: .env.test\n');
  hasErrors = true;
}

// ============================================================================
// VALIDAÇÃO 2: TEST_DATABASE_URL aponta para banco de teste
// ============================================================================

if (process.env.TEST_DATABASE_URL) {
  try {
    const parsed = new URL(process.env.TEST_DATABASE_URL);
    const dbName = parsed.pathname.replace(/^\//, '');

    if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
      console.error(
        '❌ FALHA CRÍTICA: TEST_DATABASE_URL aponta para banco de DESENVOLVIMENTO'
      );
      console.error(`   Banco atual: ${dbName}`);
      console.error('   Esperado: nr-bps_db_test');
      console.error(
        '   NUNCA execute testes contra o banco de desenvolvimento!\n'
      );
      hasErrors = true;
    } else if (dbName !== 'nr-bps_db_test') {
      console.warn(`⚠️  AVISO: Banco de teste não é o padrão: ${dbName}`);
      console.warn('   Padrão recomendado: nr-bps_db_test\n');
    } else {
      console.log(`✅ TEST_DATABASE_URL: ${dbName}`);
    }
  } catch (err) {
    console.error('❌ FALHA: Não foi possível parsear TEST_DATABASE_URL');
    console.error(`   Erro: ${err.message}\n`);
    hasErrors = true;
  }
}

// ============================================================================
// VALIDAÇÃO 3: DATABASE_URL não está definida (testes não devem usar)
// ============================================================================

if (process.env.DATABASE_URL) {
  console.warn('⚠️  AVISO: DATABASE_URL está definida em ambiente de teste');
  console.warn('   Testes devem usar exclusivamente TEST_DATABASE_URL');
  console.warn('   DATABASE_URL é para produção apenas\n');
}

// ============================================================================
// VALIDAÇÃO 4: LOCAL_DATABASE_URL não contamina testes
// ============================================================================

if (process.env.LOCAL_DATABASE_URL) {
  try {
    const parsed = new URL(process.env.LOCAL_DATABASE_URL);
    const dbName = parsed.pathname.replace(/^\//, '');

    if (dbName.includes('test')) {
      console.warn('⚠️  AVISO: LOCAL_DATABASE_URL aponta para banco de teste');
      console.warn(`   Banco: ${dbName}`);
      console.warn(
        '   LOCAL_DATABASE_URL deve apontar para nr-bps_db (desenvolvimento)\n'
      );
    }
  } catch {
    // Ignorar erros de parsing
  }
}

// ============================================================================
// VALIDAÇÃO 5: NODE_ENV está configurado para teste
// ============================================================================

if (process.env.NODE_ENV !== 'test') {
  console.error('❌ FALHA: NODE_ENV não está configurado como "test"');
  console.error(`   Valor atual: ${process.env.NODE_ENV || 'undefined'}`);
  console.error('   Esperado: test\n');
  hasErrors = true;
}

// ============================================================================
// VALIDAÇÃO 6: JEST_WORKER_ID existe (confirmação de ambiente Jest)
// ============================================================================

if (process.env.JEST_WORKER_ID) {
  console.log(
    `✅ JEST_WORKER_ID: ${process.env.JEST_WORKER_ID} (ambiente Jest confirmado)`
  );
} else {
  console.warn(
    '⚠️  AVISO: JEST_WORKER_ID não definida (executando fora do Jest?)\n'
  );
}

// ============================================================================
// RESULTADO FINAL
// ============================================================================

console.log('\n' + '='.repeat(70));

if (hasErrors) {
  console.error('\n❌ VALIDAÇÃO FALHOU: Ambiente de teste NÃO está seguro');
  console.error('   Corrija os erros acima antes de executar testes');
  console.error('   Consulte: TESTING-POLICY.md\n');
  process.exit(1);
}

console.log('\n✅ VALIDAÇÃO PASSOU: Ambiente de teste está isolado e seguro');
console.log('   Banco de testes: nr-bps_db_test');
console.log('   Banco de desenvolvimento protegido: nr-bps_db');
console.log('   Política: TESTING-POLICY.md\n');

process.exit(0);
