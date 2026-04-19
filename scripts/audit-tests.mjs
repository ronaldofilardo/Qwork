#!/usr/bin/env node
/**
 * Audit Script — Pipeline de Testes QWork
 *
 * Analisa o estado dos testes e gera relatório JSON + Markdown.
 * Execução: node scripts/audit-tests.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TESTS_DIR = path.join(ROOT, '__tests__');
const CYPRESS_DIR = path.join(ROOT, 'cypress');

// ── Helpers ──────────────────────────────────────────────────────────────────

function walkDir(dir, ext = '.test.ts') {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (
      entry.name.endsWith(ext) ||
      entry.name.endsWith('.test.tsx') ||
      entry.name.endsWith('.cy.ts') ||
      entry.name.endsWith('.spec.ts') ||
      entry.name.endsWith('.old')
    ) {
      results.push(full);
    }
  }
  return results;
}

function relativePath(absPath) {
  return path.relative(ROOT, absPath).replace(/\\/g, '/');
}

// ── Contagem por Categoria ───────────────────────────────────────────────────

function countByCategory() {
  const categories = {
    api: path.join(TESTS_DIR, 'api'),
    integration: path.join(TESTS_DIR, 'integration'),
    database: path.join(TESTS_DIR, 'database'),
    regression: path.join(TESTS_DIR, 'regression'),
    unit: path.join(TESTS_DIR, 'unit'),
    lib: path.join(TESTS_DIR, 'lib'),
    components: path.join(TESTS_DIR, 'components'),
    hooks: path.join(TESTS_DIR, 'hooks'),
    'e2e-jest': path.join(TESTS_DIR, 'e2e'),
    security: path.join(TESTS_DIR, 'security'),
    'rls-rbac': path.join(TESTS_DIR, 'security'),
    cypress: path.join(CYPRESS_DIR, 'e2e'),
  };

  const counts = {};
  for (const [name, dir] of Object.entries(categories)) {
    const files = walkDir(dir);
    counts[name] = {
      files: files.length,
      paths: files.map(relativePath),
    };
  }
  return counts;
}

// ── Detectar .skip() ─────────────────────────────────────────────────────────

function findSkips() {
  const allFiles = walkDir(TESTS_DIR);
  const skips = [];

  for (const file of allFiles) {
    if (file.endsWith('.old')) continue;
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const patterns = [
        /describe\.skip\s*\(/,
        /it\.skip\s*\(/,
        /test\.skip\s*\(/,
        /xit\s*\(/,
        /xdescribe\s*\(/,
        /xtest\s*\(/,
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          // Extract the test description
          const descMatch = line.match(
            /(?:describe|it|test|xit|xdescribe|xtest)\.?skip?\s*\(\s*['"`]([^'"`]+)['"`]/
          );
          skips.push({
            file: relativePath(file),
            line: i + 1,
            type: pattern.source.includes('describe')
              ? 'describe.skip'
              : 'it.skip',
            description: descMatch ? descMatch[1] : line.trim().slice(0, 100),
          });
          break;
        }
      }
    }
  }

  return skips;
}

// ── Detectar Arquivos Obsoletos ──────────────────────────────────────────────

function findObsolete() {
  const allFiles = walkDir(TESTS_DIR);
  const obsolete = [];

  for (const file of allFiles) {
    const rel = relativePath(file);

    // .old files
    if (file.endsWith('.old')) {
      obsolete.push({ file: rel, reason: 'Arquivo .old (backup/legado)' });
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');

    // Entire file is describe.skip
    if (
      /^(?:\s*\/\/[^\n]*\n)*\s*(?:import[^\n]*\n)*\s*describe\.skip\s*\(/.test(
        content
      )
    ) {
      const hasActiveTests = /(?:^|\n)\s*(?:it|test)\s*\(/.test(content);
      if (!hasActiveTests) {
        obsolete.push({
          file: rel,
          reason: 'Arquivo inteiro em describe.skip sem testes ativos',
        });
      }
    }

    // @deprecated
    if (
      content.includes('@deprecated') ||
      content.includes('OBSOLETO') ||
      content.includes('DEPRECADO')
    ) {
      obsolete.push({ file: rel, reason: 'Marcado como @deprecated/OBSOLETO' });
    }

    // LEGADO/REMOVIDO in describe.skip
    if (/describe\.skip\([^)]*(?:LEGADO|REMOVIDO|REFATORADO)/.test(content)) {
      obsolete.push({
        file: rel,
        reason: 'describe.skip com tag LEGADO/REMOVIDO/REFATORADO',
      });
    }
  }

  // Deduplicate
  const seen = new Set();
  return obsolete.filter((o) => {
    const key = o.file;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Detectar Duplicatas API vs Integration ───────────────────────────────────

function findDuplicates() {
  const apiFiles = walkDir(path.join(TESTS_DIR, 'api'));
  const integrationFiles = walkDir(path.join(TESTS_DIR, 'integration'));

  const duplicates = [];

  // Extract endpoint patterns from files
  function extractEndpoints(file) {
    const content = fs.readFileSync(file, 'utf-8');
    const endpoints = [];
    const patterns = [
      /(?:fetch|get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
      /\/api\/[a-z0-9\-\/]+/gi,
    ];
    for (const p of patterns) {
      let match;
      while ((match = p.exec(content)) !== null) {
        const ep = match[1] || match[0];
        if (ep.startsWith('/api/')) endpoints.push(ep.replace(/\?.+$/, ''));
      }
    }
    return [...new Set(endpoints)];
  }

  const apiEndpoints = {};
  for (const f of apiFiles) {
    for (const ep of extractEndpoints(f)) {
      if (!apiEndpoints[ep]) apiEndpoints[ep] = [];
      apiEndpoints[ep].push(relativePath(f));
    }
  }

  for (const f of integrationFiles) {
    for (const ep of extractEndpoints(f)) {
      if (apiEndpoints[ep]) {
        duplicates.push({
          endpoint: ep,
          apiFiles: apiEndpoints[ep],
          integrationFile: relativePath(f),
        });
      }
    }
  }

  return duplicates;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const report = {
  timestamp: new Date().toISOString(),
  counts: countByCategory(),
  skips: findSkips(),
  obsolete: findObsolete(),
  duplicates: findDuplicates(),
};

// Summary
report.summary = {
  totalFiles: Object.values(report.counts).reduce((s, c) => s + c.files, 0),
  totalSkips: report.skips.length,
  describeSkips: report.skips.filter((s) => s.type === 'describe.skip').length,
  itSkips: report.skips.filter((s) => s.type === 'it.skip').length,
  obsoleteFiles: report.obsolete.length,
  duplicateEndpoints: report.duplicates.length,
};

// Write JSON
const jsonPath = path.join(ROOT, 'audit-tests-report.json');
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

// Write Markdown
const mdLines = [
  '# Audit de Testes — QWork',
  `> Gerado em: ${report.timestamp}`,
  '',
  '## Resumo',
  `| Métrica | Valor |`,
  `|---------|-------|`,
  `| Total arquivos de teste | ${report.summary.totalFiles} |`,
  `| Total .skip() | ${report.summary.totalSkips} |`,
  `| describe.skip | ${report.summary.describeSkips} |`,
  `| it.skip / test.skip | ${report.summary.itSkips} |`,
  `| Arquivos obsoletos | ${report.summary.obsoleteFiles} |`,
  `| Endpoints duplicados | ${report.summary.duplicateEndpoints} |`,
  '',
  '## Contagem por Categoria',
  `| Categoria | Arquivos |`,
  `|-----------|----------|`,
  ...Object.entries(report.counts).map(
    ([name, data]) => `| ${name} | ${data.files} |`
  ),
  '',
  '## Testes Skipped',
  `| Arquivo | Linha | Tipo | Descrição |`,
  `|---------|-------|------|-----------|`,
  ...report.skips.map(
    (s) =>
      `| ${s.file} | ${s.line} | ${s.type} | ${s.description.slice(0, 80)} |`
  ),
  '',
  '## Arquivos Obsoletos',
  `| Arquivo | Razão |`,
  `|---------|-------|`,
  ...report.obsolete.map((o) => `| ${o.file} | ${o.reason} |`),
  '',
  '## Duplicatas API vs Integration',
  `| Endpoint | API Test | Integration Test |`,
  `|----------|----------|-----------------|`,
  ...report.duplicates.map(
    (d) => `| ${d.endpoint} | ${d.apiFiles[0]} | ${d.integrationFile} |`
  ),
];

const mdPath = path.join(ROOT, 'docs', 'testing', 'AUDIT-REPORT.md');
fs.mkdirSync(path.dirname(mdPath), { recursive: true });
fs.writeFileSync(mdPath, mdLines.join('\n'));

console.log(`✅ Relatório JSON: ${relativePath(jsonPath)}`);
console.log(`✅ Relatório MD: ${relativePath(mdPath)}`);
console.log(`\n📊 Resumo:`);
console.log(`   Total arquivos: ${report.summary.totalFiles}`);
console.log(`   Total .skip(): ${report.summary.totalSkips}`);
console.log(`   Obsoletos: ${report.summary.obsoleteFiles}`);
console.log(`   Duplicatas: ${report.summary.duplicateEndpoints}`);
