/**
 * Script para remover console.log dos arquivos de teste
 * Mantém apenas console.warn e console.error que são válidos para debugging
 */

const fs = require('fs');
const path = require('path');

const testDirs = [
  path.join(__dirname, '..', '__tests__'),
  path.join(__dirname, '..', 'tests'),
];

let filesModified = 0;
let logsRemoved = 0;

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      // Ignorar node_modules
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        // Preservar helpers e guards
        if (
          !file.includes('test-helpers') &&
          !file.includes('test-database-guard')
        ) {
          arrayOfFiles.push(filePath);
        }
      }
    }
  });

  return arrayOfFiles;
}

function removeConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;

  let newContent = content;

  // Padrão 1: console.log simples em uma linha
  newContent = newContent.replace(
    /(\s*)console\.log\([^;]*\);?\n?/g,
    (match, indent) => {
      // Extrair mensagem se for string literal simples
      const msgMatch = match.match(/console\.log\(['"](.*?)['"]\)/);
      if (msgMatch && msgMatch[1].length < 100) {
        logsRemoved++;
        return `${indent}// ${msgMatch[1]}\n`;
      }
      // Para logs complexos, apenas comentar
      logsRemoved++;
      return match.replace('console.log', '// console.log');
    }
  );

  // Padrão 2: console.log multi-linha
  newContent = newContent.replace(
    /console\.log\(\s*\n[\s\S]*?\);?/g,
    (match) => {
      logsRemoved++;
      return match.replace('console.log', '// console.log');
    }
  );

  // Remover múltiplas linhas em branco consecutivas
  newContent = newContent.replace(/\n\n\n+/g, '\n\n');

  if (newContent !== originalContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    filesModified++;
    return true;
  }

  return false;
}

console.log('🧹 Removendo console.log dos testes...\n');

testDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    console.log(`⚠️  Diretório não encontrado: ${dir}`);
    return;
  }

  console.log(`📁 Processando arquivos em ${path.basename(dir)}/...`);
  const files = getAllFiles(dir);

  files.forEach((file) => {
    if (removeConsoleLogs(file)) {
      console.log(`  ✓ ${path.relative(process.cwd(), file)}`);
    }
  });
});

console.log(`\n✅ Concluído!`);
console.log(`📊 ${filesModified} arquivos modificados`);
console.log(`🗑️  ${logsRemoved} console.log removidos/comentados`);

if (filesModified > 0) {
  console.log(
    '\n💡 Execute `node scripts/analyze-test-quality.cjs` para validar melhorias'
  );
}
