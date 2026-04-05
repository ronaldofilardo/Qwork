#!/usr/bin/env node
// scripts/check-test-database.js
// Verifica se TEST_DATABASE_URL aponta para um banco de testes e NÃO para nr-bps_db

const { URL } = require('url');

const testDbUrl = process.env.TEST_DATABASE_URL || '';

if (!testDbUrl) {
  console.log(
    'ℹ️  TEST_DATABASE_URL não definida — pulando verificação estrita (validate-test-db.yml fará validação quando aplicável).'
  );
  process.exit(0);
}

try {
  const parsed = new URL(testDbUrl);
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'nr-bps_db' || dbName === 'nr-bps-db') {
    console.error(
      `❌ ERRO: TEST_DATABASE_URL aponta para o banco de desenvolvimento: "${dbName}"`
    );
    process.exit(1);
  }

  if (!dbName.includes('_test')) {
    console.error(
      `❌ ERRO: TEST_DATABASE_URL ("${dbName}") não parece ser um banco de testes (nome sem "_test").`
    );
    process.exit(1);
  }

  console.log(
    `✅ OK: TEST_DATABASE_URL aponta para o banco de testes "${dbName}"`
  );
  process.exit(0);
} catch (err) {
  console.error(
    `❌ ERRO: não foi possível analisar TEST_DATABASE_URL: ${err.message}`
  );
  process.exit(1);
}
