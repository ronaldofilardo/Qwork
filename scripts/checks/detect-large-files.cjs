#!/usr/bin/env node
/**
 * Script para detectar arquivos grandes (>500 linhas)
 * Usado no CI/CD para enforçar política de tamanho
 */

const fs = require('fs');
const path = require('path');

const MAX_LINES = 500;
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage',
  'database',
];
const EXCLUDE_FILES = ['.test.', '.spec.', '.config.', '.d.ts', 'schema'];

function countLines(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return content.split('\n').length;
}

function shouldCheckFile(filePath) {
  const ext = path.extname(filePath);
  if (!EXTENSIONS.includes(ext)) return false;

  const relativePath = path.relative(process.cwd(), filePath);

  // Excluir diretórios
  if (EXCLUDE_DIRS.some((dir) => relativePath.includes(dir))) return false;

  // Excluir arquivos específicos
  if (EXCLUDE_FILES.some((pattern) => relativePath.includes(pattern)))
    return false;

  return true;
}

function scanDirectory(dir, files = []) {
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Não entrar em diretórios excluídos
      if (!EXCLUDE_DIRS.includes(item)) {
        scanDirectory(fullPath, files);
      }
    } else if (stat.isFile() && shouldCheckFile(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log('🔍 Detectando arquivos grandes (>%d linhas)...\n', MAX_LINES);

  const dirs = ['lib', 'components', 'app'];
  const allFiles = [];

  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      const files = scanDirectory(dirPath);
      allFiles.push(...files);
    }
  }

  const largeFiles = [];

  for (const file of allFiles) {
    const lines = countLines(file);
    if (lines > MAX_LINES) {
      const relativePath = path.relative(process.cwd(), file);
      largeFiles.push({ path: relativePath, lines });
    }
  }

  if (largeFiles.length === 0) {
    console.log('✅ Nenhum arquivo grande detectado!');
    process.exit(0);
  }

  // Ordenar por número de linhas (maior primeiro)
  largeFiles.sort((a, b) => b.lines - a.lines);

  console.log('⚠️  Arquivos grandes detectados:\n');
  for (const { path, lines } of largeFiles) {
    console.log(`  ${lines} linhas\t${path}`);
  }

  console.log(
    '\n📖 Consulte docs/architecture/refactor-plan.md para orientações de refatoração.'
  );
  console.log(
    '💡 Use docs/architecture/migration-guide.md para migrar para a nova arquitetura.\n'
  );

  // Não falhar o CI (apenas warning)
  // Para enforçar, mudar para process.exit(1)
  process.exit(0);
}

main();
