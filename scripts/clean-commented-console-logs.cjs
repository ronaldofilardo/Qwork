/**
 * Script para remover completamente linhas com console.log comentados
 * Remove linhas que contêm apenas comentários de console.log
 */

const fs = require('fs');
const path = require('path');

const testDirs = [
  path.join(__dirname, '..', '__tests__'),
  path.join(__dirname, '..', 'tests'),
];

let filesModified = 0;
let linesRemoved = 0;

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (
        (file.endsWith('.ts') || file.endsWith('.tsx')) &&
        !file.includes('test-helpers') &&
        !file.includes('test-database-guard')
      ) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function cleanCommentedConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const originalLineCount = lines.length;

  // Filtrar linhas que são apenas comentários de console.log
  const filteredLines = lines.filter((line) => {
    const trimmed = line.trim();

    // Remover linhas que são apenas comentários de console.log
    const patterns = [
      /^\/\/\s*console\.log\(/, // // console.log(
      /^\/\/\s*\/\/\s*console\.log\(/, // // // console.log(
      /^\/\/\s*console\.log\s*\(/, // // console.log (
      /^\s*\/\/\s*console\.log/, // com indentação
    ];

    const shouldRemove = patterns.some((pattern) => pattern.test(trimmed));
    if (shouldRemove) {
      linesRemoved++;
    }

    return !shouldRemove;
  });

  // Remover múltiplas linhas vazias consecutivas
  const cleanedLines = [];
  let previousWasEmpty = false;

  for (const line of filteredLines) {
    const isEmpty = line.trim() === '';
    if (isEmpty && previousWasEmpty) {
      continue; // Skip consecutive empty lines
    }
    cleanedLines.push(line);
    previousWasEmpty = isEmpty;
  }

  const newContent = cleanedLines.join('\n');

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    return true;
  }

  return false;
}

console.log('🧹 Removendo console.log comentados dos testes...\n');

testDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Diretório não encontrado: ${dir}`);
    return;
  }

  console.log(`📁 Processando arquivos em ${path.basename(dir)}/...`);
  const files = getAllFiles(dir);

  files.forEach((file) => {
    if (cleanCommentedConsoleLogs(file)) {
      console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
    }
  });
});

console.log(`\n✅ Concluído!`);
console.log(`📊 ${filesModified} arquivos modificados`);
console.log(`🗑️  ${linesRemoved} linhas removidas`);

if (filesModified > 0) {
  console.log(
    '\n💡 Execute `node scripts/analyze-test-quality.cjs` para validar melhorias'
  );
}
