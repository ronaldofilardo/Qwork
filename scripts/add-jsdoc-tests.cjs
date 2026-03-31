// Script para adicionar JSDoc header em arquivos de teste que não possuem.
// Uso: node scripts/add-jsdoc-tests.cjs

const fs = require('fs');
const path = require('path');

function findTestFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (item.name.match(/\.test\.(ts|tsx)$/)) {
      files.push(fullPath);
    }
  }
  return files;
}

function extractDescribe(content) {
  const match = content.match(/describe\(['"`]([^'"`]+)['"`]/);
  return match ? match[1] : null;
}

function hasJSDoc(content) {
  // Check first 5 lines for any /** comment
  const firstLines = content.split('\n').slice(0, 10).join('\n');
  return firstLines.includes('/**') || firstLines.includes('@file');
}

function processFile(filePath, rootDir) {
  const content = fs.readFileSync(filePath, 'utf-8');

  if (hasJSDoc(content)) return false;

  const relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
  const describeName = extractDescribe(content);

  if (!describeName) return false;

  const jsdoc = `/**
 * @file ${relativePath}
 * Testes: ${describeName}
 */

`;

  fs.writeFileSync(filePath, jsdoc + content, 'utf-8');
  return true;
}

// Main
const rootDir = path.join(__dirname, '..');
const testsDir = path.join(rootDir, '__tests__');
const files = findTestFiles(testsDir);
let count = 0;

for (const file of files) {
  if (processFile(file, rootDir)) {
    count++;
  }
}

console.log(
  `JSDoc adicionado em ${count} de ${files.length} arquivos de teste`
);
