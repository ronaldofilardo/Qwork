#!/usr/bin/env node
/**
 * Validador de Nomenclatura de Testes — QWork
 *
 * Verifica se os arquivos de teste seguem as convenções documentadas
 * em docs/testing/GUIA-COMPLETO-TESTES.md:
 *
 *   - Teste simples:      [feature].test.ts
 *   - Teste integração:   [feature].integration.test.ts  (em __tests__/integration/)
 *   - Teste E2E:          [feature].cy.ts                (em cypress/e2e/)
 *
 * Severidade:
 *   ERRO    → exit 1 (bloqueia CI)
 *   WARNING → exit 0 (informa apenas)
 *
 * Uso:  node scripts/validate-test-naming.cjs
 *       pnpm test:naming
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Configuração ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

const RULES = [
  // ── ERROS ──────────────────────────────────────────────────────────────────
  {
    severity: 'error',
    description:
      'Arquivos .spec.ts em __tests__/ são silenciados pelo jest.config.cjs (testPathIgnorePatterns exclui *.spec.ts)',
    dir: '__tests__',
    recursive: true,
    // Exclui __tests__/e2e/ — essa pasta inteira já é ignorada pelo jest config
    // (entrada '<rootDir>/__tests__/e2e/' em testPathIgnorePatterns)
    match: (file) =>
      (file.endsWith('.spec.ts') || file.endsWith('.spec.tsx')) &&
      !file.replace(/\\/g, '/').includes('__tests__/e2e/'),
    message: (file) =>
      `Renomeie para .test.ts (arquivo .spec.ts não roda via Jest): ${file}`,
  },
  {
    severity: 'error',
    description: 'Arquivos em cypress/e2e/ devem terminar em .cy.ts',
    dir: 'cypress/e2e',
    recursive: true,
    match: (file) =>
      (file.endsWith('.ts') || file.endsWith('.tsx')) &&
      !file.endsWith('.cy.ts'),
    message: (file) =>
      `Renomeie para .cy.ts (Cypress ignora arquivos sem .cy extensão): ${file}`,
  },

  // ── WARNINGS ───────────────────────────────────────────────────────────────
  {
    severity: 'warning',
    description:
      'Arquivos em __tests__/integration/ sem sufixo .integration.test.ts reduzem rastreabilidade',
    dir: '__tests__/integration',
    recursive: false,
    match: (file) =>
      (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) &&
      !file.endsWith('.integration.test.ts') &&
      !file.endsWith('.integration.test.tsx') &&
      !file.endsWith('.e2e.test.ts'),
    message: (file) =>
      `Considere renomear para .integration.test.ts para rastreabilidade: ${file}`,
  },
  {
    severity: 'warning',
    description:
      'Arquivos na raiz __tests__/ com padrão de data (correcoes-DD-MM-YYYY) deveriam estar em subpastas',
    dir: '__tests__',
    recursive: false,
    match: (file) => /correcoes-\d{2}-\d{2}-\d{4}/.test(path.basename(file)),
    message: (file) =>
      `Arquivo de correção na raiz — considere mover para __tests__/feature/ ou __tests__/api/: ${file}`,
  },
];

// ─── Lógica ───────────────────────────────────────────────────────────────────

/**
 * Coleta arquivos de um diretório (opcionalmente recursivo)
 * @param {string} dir
 * @param {boolean} recursive
 * @returns {string[]} caminhos relativos ao ROOT
 */
function collectFiles(dir, recursive) {
  const absDir = path.join(ROOT, dir);
  if (!fs.existsSync(absDir)) return [];

  const entries = fs.readdirSync(absDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (recursive) {
        files.push(...collectFiles(relPath, true));
      }
    } else {
      files.push(relPath);
    }
  }

  return files;
}

/**
 * Executa todas as regras e retorna listas de violações por severidade
 */
function validate() {
  const errors = [];
  const warnings = [];

  for (const rule of RULES) {
    const files = collectFiles(rule.dir, rule.recursive);

    for (const file of files) {
      if (rule.match(file)) {
        const entry = { rule: rule.description, message: rule.message(file) };
        if (rule.severity === 'error') {
          errors.push(entry);
        } else {
          warnings.push(entry);
        }
      }
    }
  }

  return { errors, warnings };
}

// ─── Output ───────────────────────────────────────────────────────────────────

const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';

function printSection(label, items, color) {
  console.log(`\n${color}${BOLD}${label}${RESET}`);
  if (items.length === 0) {
    console.log(`  ${GREEN}✅ Nenhuma ocorrência${RESET}`);
    return;
  }

  let lastRule = null;
  for (const item of items) {
    if (item.rule !== lastRule) {
      console.log(`\n  ${CYAN}ℹ ${item.rule}${RESET}`);
      lastRule = item.rule;
    }
    console.log(`  ${color}→ ${item.message}${RESET}`);
  }
}

function run() {
  console.log(
    `\n${BOLD}🔍 Validador de Nomenclatura de Testes — QWork${RESET}`
  );
  console.log(
    `   ${CYAN}Referência: docs/testing/GUIA-COMPLETO-TESTES.md${RESET}\n`
  );

  const { errors, warnings } = validate();

  printSection(`❌ ERROS (${errors.length}) — bloqueiam CI`, errors, RED);
  printSection(
    `⚠️  WARNINGS (${warnings.length}) — apenas informativos`,
    warnings,
    YELLOW
  );

  // ── Resumo ──────────────────────────────────────────────────────────────────
  console.log(
    `\n${BOLD}── Resumo ──────────────────────────────────────────────${RESET}`
  );
  console.log(
    `   Erros:    ${errors.length > 0 ? RED : GREEN}${errors.length}${RESET}`
  );
  console.log(
    `   Warnings: ${warnings.length > 0 ? YELLOW : GREEN}${warnings.length}${RESET}`
  );
  console.log(
    `\n   ${
      errors.length === 0
        ? GREEN + '✅ Nomenclatura OK — sem bloqueios' + RESET
        : RED + '❌ Corrija os erros acima antes de prosseguir' + RESET
    }`
  );
  console.log();

  process.exit(errors.length > 0 ? 1 : 0);
}

run();
