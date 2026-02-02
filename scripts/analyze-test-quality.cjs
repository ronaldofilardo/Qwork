#!/usr/bin/env node

/**
 * Script de Análise de Qualidade de Testes
 * 
 * Analisa a qualidade dos testes e gera relatório
 * Uso: node scripts/analyze-test-quality.js
 */

const fs = require('fs');
const path = require('path');

// Configuração
const TEST_DIRS = ['__tests__', 'tests'];
const REPORT_FILE = '__tests__/quality-report.json';

// Métricas
const metrics = {
  totalFiles: 0,
  withJSDoc: 0,
  withTypeImports: 0,
  withBeforeEach: 0,
  withTsNoCheck: 0,
  withConsoleLog: 0,
  withDescribe: 0,
  withIt: 0,
  files: [],
};

// Padrões para verificar
const patterns = {
  jsDoc: /\/\*\*[\s\S]*?\*\//,
  typeImport: /import type .* from/,
  beforeEach: /beforeEach\s*\(/,
  tsNoCheck: /@ts-nocheck/,
  consoleLog: /console\.log\(/,
  describe: /describe\s*\(/,
  it: /it\s*\(|test\s*\(/,
};

/**
 * Analisa um arquivo de teste
 */
function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(process.cwd(), filePath);
  
  const analysis = {
    path: relativePath,
    hasJSDoc: patterns.jsDoc.test(content),
    hasTypeImports: patterns.typeImport.test(content),
    hasBeforeEach: patterns.beforeEach.test(content),
    hasTsNoCheck: patterns.tsNoCheck.test(content),
    hasConsoleLog: patterns.consoleLog.test(content),
    hasDescribe: patterns.describe.test(content),
    hasIt: patterns.it.test(content),
    lines: content.split('\n').length,
  };

  // Atualizar métricas
  metrics.totalFiles++;
  if (analysis.hasJSDoc) metrics.withJSDoc++;
  if (analysis.hasTypeImports) metrics.withTypeImports++;
  if (analysis.hasBeforeEach) metrics.withBeforeEach++;
  if (analysis.hasTsNoCheck) metrics.withTsNoCheck++;
  if (analysis.hasConsoleLog) metrics.withConsoleLog++;
  if (analysis.hasDescribe) metrics.withDescribe++;
  if (analysis.hasIt) metrics.withIt++;

  // Calcular score de qualidade
  let score = 0;
  if (analysis.hasJSDoc) score += 20;
  if (analysis.hasTypeImports) score += 15;
  if (analysis.hasBeforeEach) score += 15;
  if (!analysis.hasTsNoCheck) score += 20;
  if (!analysis.hasConsoleLog) score += 10;
  if (analysis.hasDescribe) score += 10;
  if (analysis.hasIt) score += 10;

  analysis.qualityScore = score;

  return analysis;
}

/**
 * Busca recursivamente por arquivos de teste
 */
function findTestFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;

  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorar node_modules e outros diretórios
      if (!['node_modules', '.next', '.git', 'coverage'].includes(file)) {
        findTestFiles(filePath, fileList);
      }
    } else if (file.match(/\.test\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Gera relatório
 */
function generateReport() {
  console.log('\n🔍 Analisando qualidade dos testes...\n');

  // Buscar todos os arquivos de teste
  let allTestFiles = [];
  TEST_DIRS.forEach((dir) => {
    allTestFiles = allTestFiles.concat(findTestFiles(dir));
  });

  // Analisar cada arquivo
  allTestFiles.forEach((file) => {
    const analysis = analyzeFile(file);
    metrics.files.push(analysis);
  });

  // Ordenar por score
  metrics.files.sort((a, b) => a.qualityScore - b.qualityScore);

  // Calcular percentuais
  const pctJSDoc = ((metrics.withJSDoc / metrics.totalFiles) * 100).toFixed(1);
  const pctTypeImports = ((metrics.withTypeImports / metrics.totalFiles) * 100).toFixed(1);
  const pctBeforeEach = ((metrics.withBeforeEach / metrics.totalFiles) * 100).toFixed(1);
  const pctTsNoCheck = ((metrics.withTsNoCheck / metrics.totalFiles) * 100).toFixed(1);
  const pctConsoleLog = ((metrics.withConsoleLog / metrics.totalFiles) * 100).toFixed(1);

  // Exibir resumo
  console.log('📊 RESUMO DA QUALIDADE');
  console.log('='.repeat(50));
  console.log(`Total de arquivos de teste: ${metrics.totalFiles}`);
  console.log(`\n✅ Boas Práticas:`);
  console.log(`  - Com JSDoc:           ${metrics.withJSDoc} (${pctJSDoc}%)`);
  console.log(`  - Com Type Imports:    ${metrics.withTypeImports} (${pctTypeImports}%)`);
  console.log(`  - Com beforeEach:      ${metrics.withBeforeEach} (${pctBeforeEach}%)`);
  console.log(`  - Com describe:        ${metrics.withDescribe}`);
  console.log(`  - Com it/test:         ${metrics.withIt}`);
  
  console.log(`\n⚠️  Problemas:`);
  console.log(`  - Com @ts-nocheck:     ${metrics.withTsNoCheck} (${pctTsNoCheck}%)`);
  console.log(`  - Com console.log:     ${metrics.withConsoleLog} (${pctConsoleLog}%)`);

  // Top 10 melhores
  console.log(`\n🏆 TOP 10 MELHORES TESTES (por score):`);
  metrics.files
    .slice(-10)
    .reverse()
    .forEach((file, i) => {
      console.log(`  ${i + 1}. [${file.qualityScore}] ${file.path}`);
    });

  // Top 10 que precisam de melhoria
  console.log(`\n⚠️  TOP 10 QUE PRECISAM DE MELHORIA:`);
  metrics.files.slice(0, 10).forEach((file, i) => {
    const issues = [];
    if (!file.hasJSDoc) issues.push('sem JSDoc');
    if (!file.hasTypeImports) issues.push('sem types');
    if (!file.hasBeforeEach) issues.push('sem beforeEach');
    if (file.hasTsNoCheck) issues.push('@ts-nocheck');
    if (file.hasConsoleLog) issues.push('console.log');

    console.log(`  ${i + 1}. [${file.qualityScore}] ${file.path}`);
    console.log(`     Problemas: ${issues.join(', ')}`);
  });

  // Salvar relatório JSON
  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(metrics, null, 2),
    'utf-8'
  );

  console.log(`\n📄 Relatório completo salvo em: ${REPORT_FILE}`);
  console.log('\n✅ Análise concluída!\n');

  // Retornar código de saída baseado na qualidade
  const avgScore = metrics.files.reduce((sum, f) => sum + f.qualityScore, 0) / metrics.totalFiles;
  
  if (avgScore < 50) {
    console.log('❌ Score médio abaixo de 50. Considere melhorar os testes.');
    process.exit(1);
  } else if (avgScore < 70) {
    console.log('⚠️  Score médio entre 50-70. Há espaço para melhorias.');
  } else {
    console.log('✅ Score médio acima de 70. Qualidade boa!');
  }
}

// Executar análise
try {
  generateReport();
} catch (error) {
  console.error('❌ Erro ao analisar testes:', error.message);
  process.exit(1);
}
