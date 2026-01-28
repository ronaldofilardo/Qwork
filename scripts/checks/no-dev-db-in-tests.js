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
    } else if (/\.(js|ts|tsx|jsx)$/i.test(file)) {
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
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('nr-bps_db') || content.includes('nr-bps-db')) {
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
