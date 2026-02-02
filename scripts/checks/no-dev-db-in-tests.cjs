#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function findFiles(dir, results = []) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      findFiles(filePath, results);
    } else if (/\.(js|ts|tsx|jsx|cjs)$/i.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

const testsDir = path.join(process.cwd(), '__tests__');
if (!fs.existsSync(testsDir)) {
  console.log('No __tests__ directory found; skipping dev-db scan.');
  process.exit(0);
}

const files = findFiles(testsDir);
const offenders = [];
for (const file of files) {
  // Skip database configuration test file as it needs to reference database names for testing
  if (file.includes('database-configuration.test.ts')) {
    continue;
  }

  // Skip test-database-guard.ts as it's a protection module that intentionally references nr-bps_db
  if (file.includes('test-database-guard.ts')) {
    continue;
  }

  // Skip database-environment.test.ts as it validates environment configuration
  if (file.includes('database-environment.test.ts')) {
    continue;
  }

  const content = fs.readFileSync(file, 'utf8');
  // Use regex to match nr-bps_db but NOT nr-bps_db_test
  if (
    /nr-bps_db(?!_test)/.test(content) ||
    /nr-bps-db(?!-test)/.test(content)
  ) {
    offenders.push(file);
  }
}

if (offenders.length > 0) {
  console.error(
    '\n❌ ERRO: Foram encontradas referências ao banco de desenvolvimento (nr-bps_db) dentro de testes:'
  );
  offenders.forEach((f) =>
    console.error(' - ' + path.relative(process.cwd(), f))
  );
  console.error(
    '\nCorrija esses arquivos para usar TEST_DATABASE_URL apontando para um banco de testes (ex: nr-bps_db_test) ou remova o hardcode.'
  );
  process.exit(1);
}

console.log(
  '✅ Nenhuma referência direta a nr-bps_db encontrada em __tests__.'
);
process.exit(0);
