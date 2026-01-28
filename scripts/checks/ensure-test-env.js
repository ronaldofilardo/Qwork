#!/usr/bin/env node

// Script para validar TEST_DATABASE_URL localmente antes de executar testes
// Saída com código 1 em caso de problema, com mensagem clara

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

const raw = process.env.TEST_DATABASE_URL;

if (!raw) {
  fail(
    "TEST_DATABASE_URL não está definida. Defina TEST_DATABASE_URL (ex: postgresql://postgres:senha@localhost:5432/nr-bps_db_test) antes de executar os testes."
  );
}

let dbName = "";
try {
  const parsed = new URL(raw);
  dbName = parsed.pathname.replace(/^\/+/, "").split(/[\/?]/)[0];
} catch (_err) {
  // fallback simples: extrair trecho após última barra
  const m = raw.match(/\/([^\/?]+)(\?|$)/);
  if (m && m[1]) dbName = m[1];
}

if (!dbName) {
  fail(
    `Não foi possível extrair o nome do banco a partir de TEST_DATABASE_URL: ${raw}`
  );
}

if (dbName === "nr-bps_db" || dbName === "nr-bps-db") {
  fail(
    'TEST_DATABASE_URL aponta para o banco de desenvolvimento "nr-bps_db". Não execute testes contra este banco.'
  );
}

if (!/test/i.test(dbName)) {
  fail(
    `TEST_DATABASE_URL (${dbName}) não parece apontar para um banco de testes. Use um nome contendo "test" (ex: nr-bps_db_test).`
  );
}

console.log(
  `✅ TEST_DATABASE_URL está definida e aponta para um banco de teste: ${dbName}`
);
process.exit(0);
