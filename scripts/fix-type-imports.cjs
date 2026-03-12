/**
 * Script para adicionar 'type' qualifier em imports de tipo nos testes.
 *
 * Converte:
 *   import { SomeInterface } from '@/lib/types'
 * Para:
 *   import type { SomeInterface } from '@/lib/types'
 *
 * Apenas para arquivos de tipo conhecidos (types, interfaces, schemas).
 *
 * Uso: node scripts/fix-type-imports.cjs
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Patterns de módulos que são 100% tipos
const TYPE_ONLY_MODULES = [
  '@/lib/types',
  '@/database/types',
  '@/lib/interfaces',
  '@/types/',
  '@/lib/services/error-logger',
];

// Patterns de exports que são tipos conhecidos
const TYPE_NAMES = [
  'ErroEstruturado',
  'CodigoErro',
  'StatusEmissao',
  'Perfil',
  'PerfilUsuarioType',
  'Session',
  'Entidade',
  'CreateEntidadeDTO',
  'StatusPagamento',
  'Plano',
  'Contrato',
  'Pagamento',
  'IniciarPagamentoDTO',
  'QueryResult',
  'PoolClient',
];

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

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Pattern 1: Convert imports from type-only modules
  for (const mod of TYPE_ONLY_MODULES) {
    const regex = new RegExp(
      `^(import )\\{([^}]+)\\}( from '${mod.replace('/', '\\/')}[^']*')`,
      'gm'
    );
    const newContent = content.replace(regex, (match, p1, p2, p3) => {
      if (match.includes('import type')) return match;
      return `import type {${p2}}${p3}`;
    });
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  }

  // Pattern 2: Convert imports where ALL named exports are known types
  const importRegex = /^import \{([^}]+)\} from '([^']+)'/gm;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const names = match[1]
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean);
    const allAreTypes = names.every((name) => TYPE_NAMES.includes(name));
    if (allAreTypes && !match[0].includes('import type')) {
      const replacement = match[0].replace('import {', 'import type {');
      content = content.replace(match[0], replacement);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// Main
const testsDir = path.join(__dirname, '..', '__tests__');
const files = findTestFiles(testsDir);
let count = 0;

for (const file of files) {
  if (processFile(file)) {
    count++;
    console.log(`✅ ${path.relative(path.join(__dirname, '..'), file)}`);
  }
}

console.log(
  `\nTotal: ${count} arquivos atualizados de ${files.length} analisados`
);
