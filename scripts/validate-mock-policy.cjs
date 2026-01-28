#!/usr/bin/env node

/**
 * Validador de Padrão de Mocks - QWork
 *
 * Este script valida se os testes seguem a Política de Mocks
 * documentada em docs/testing/MOCKS_POLICY.md
 *
 * Uso: node scripts/validate-mock-policy.js [arquivo-teste]
 */

const fs = require('fs');
const path = require('path');

class MockPolicyValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
  }

  /**
   * Valida um arquivo de teste
   */
  validateFile(filePath) {
    console.log(`🔍 Validando: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      this.violations.push(`Arquivo não encontrado: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    this.checkMockPatterns(content, filePath);
    this.checkImportPatterns(content, filePath);
    this.checkTestStructure(content, filePath);
  }

  /**
   * Verifica padrões de mock
   */
  checkMockPatterns(content, filePath) {
    // ❌ Padrão não recomendado: mockResolvedValueOnce sem controle preciso
    if (
      content.includes('mockResolvedValueOnce') &&
      !content.includes('mockImplementationOnce')
    ) {
      this.warnings.push(
        `${filePath}: Considere usar mockImplementationOnce para controle mais preciso`
      );
    }

    // ✅ Padrão recomendado: mockImplementationOnce presente
    if (content.includes('mockImplementationOnce')) {
      console.log(`  ✅ Usa mockImplementationOnce`);
    }

    // ❌ Problema: fetch mock sem Promise.resolve/Promise.reject
    const fetchMocks = content.match(/mockFetch\.mock\w+\([^)]*\)/g) || [];
    fetchMocks.forEach((mock) => {
      if (
        !mock.includes('Promise.resolve') &&
        !mock.includes('Promise.reject') &&
        !mock.includes('mockImplementationOnce')
      ) {
        this.warnings.push(
          `${filePath}: Mock de fetch pode ser inconsistente: ${mock}`
        );
      }
    });

    // ✅ Bom: usa clearAllMocks
    if (
      content.includes('jest.clearAllMocks()') ||
      content.includes('clearAllTestMocks')
    ) {
      console.log(`  ✅ Usa limpeza de mocks`);
    } else {
      this.warnings.push(
        `${filePath}: Considere usar jest.clearAllMocks() ou clearAllTestMocks()`
      );
    }
  }

  /**
   * Verifica padrões de import
   */
  checkImportPatterns(content, filePath) {
    // ✅ Bom: importa helpers de teste
    if (
      content.includes("from '../__tests__/lib/test-helpers'") ||
      content.includes("from '@/__tests__/lib/test-helpers'")
    ) {
      console.log(`  ✅ Usa helpers de teste padronizados`);
    }

    // ✅ Bom: importa waitFor corretamente
    if (
      content.includes('waitFor') &&
      content.includes('@testing-library/react')
    ) {
      console.log(`  ✅ Usa waitFor para assincronia`);
    }
  }

  /**
   * Verifica estrutura do teste
   */
  checkTestStructure(content, filePath) {
    // ✅ Bom: usa describe/it
    if (content.includes('describe(') && content.includes('it(')) {
      console.log(`  ✅ Estrutura de teste adequada`);
    }

    // ✅ Bom: usa beforeEach para setup
    if (content.includes('beforeEach')) {
      console.log(`  ✅ Usa beforeEach para setup`);
    }

    // ❌ Problema: console.log em produção
    if (
      content.includes('console.log') &&
      !content.includes('// console.log')
    ) {
      this.warnings.push(
        `${filePath}: console.log encontrado - considere remover ou comentar`
      );
    }
  }

  /**
   * Executa validação completa
   */
  validate(testFiles) {
    console.log('🚀 Iniciando validação da Política de Mocks\n');

    testFiles.forEach((file) => this.validateFile(file));

    this.printReport();
  }

  /**
   * Imprime relatório final
   */
  printReport() {
    console.log('\n📊 RELATÓRIO DE VALIDAÇÃO\n');

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ Todos os arquivos seguem a Política de Mocks!');
      return;
    }

    if (this.violations.length > 0) {
      console.log('❌ VIOLAÇÕES CRÍTICAS:');
      this.violations.forEach((v) => console.log(`  - ${v}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  SUGESTÕES DE MELHORIA:');
      this.warnings.forEach((w) => console.log(`  - ${w}`));
    }

    console.log('\n📖 Consulte: docs/testing/MOCKS_POLICY.md');
  }
}

// Função principal
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Validar todos os arquivos de teste
    const testDir = path.join(__dirname, '..', '__tests__');
    const testFiles = findTestFiles(testDir);
    const validator = new MockPolicyValidator();
    validator.validate(testFiles);
  } else {
    // Validar arquivo específico
    const validator = new MockPolicyValidator();
    validator.validate(args);
  }
}

/**
 * Encontra todos os arquivos de teste
 */
function findTestFiles(dir) {
  const files = [];

  function scan(directory) {
    const items = fs.readdirSync(directory);

    items.forEach((item) => {
      const fullPath = path.join(directory, item);
      const stat = fs.statSync(fullPath);

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules'
      ) {
        scan(fullPath);
      } else if (
        item.endsWith('.test.ts') ||
        item.endsWith('.test.tsx') ||
        item.endsWith('.test.js')
      ) {
        files.push(fullPath);
      }
    });
  }

  scan(dir);
  return files;
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = MockPolicyValidator;
