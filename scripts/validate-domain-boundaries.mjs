#!/usr/bin/env node

/**
 * validate-domain-boundaries.mjs — Validador de fronteiras de domínio
 *
 * Uso:
 *   node scripts/validate-domain-boundaries.mjs
 *   node scripts/validate-domain-boundaries.mjs --json
 *   node scripts/validate-domain-boundaries.mjs --fix  (mostra sugestões de correção)
 *
 * Regras validadas:
 * 1. components/ não importa diretamente de 'pg' ou '@neondatabase/serverless'
 * 2. app/ (exceto api/) não importa de lib/db/pool, lib/infrastructure/database/connection
 * 3. lib/domain/ não importa de lib/infrastructure/ (inversão de dependência)
 * 4. Adapters (lib/db.ts, lib/db-security.ts) são puros (apenas re-exports) após refatoração
 * 5. Detecção de imports circulares entre módulos lib/db/* e lib/infrastructure/database/*
 * 6. components/ não importa de app/api/ (vazamento de camada)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// ── Configuração ──────────────────────────────────────────────────────────
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '__obsolete_tests__',
]);

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const fixMode = args.includes('--fix');

// ── Regras de fronteira ───────────────────────────────────────────────────
const BOUNDARY_RULES = [
  {
    id: 'NO_PG_IN_COMPONENTS',
    description: 'Components não devem importar drivers de banco diretamente',
    sourcePattern: /^components\//,
    forbiddenImports: [/^pg$/, /^@neondatabase\/serverless$/],
    severity: 'error',
    suggestion: 'Importe de lib/db ou lib/infrastructure/database ao invés',
  },
  {
    id: 'NO_DB_INTERNALS_IN_PAGES',
    description: 'Pages (exceto API routes) não devem importar internals de DB',
    sourcePattern: /^app\/(?!api\/)/,
    forbiddenImports: [
      /lib\/infrastructure\/database\/connection/,
      /lib\/db\/pool/,
      /^pg$/,
      /^@neondatabase\/serverless$/,
    ],
    severity: 'error',
    suggestion:
      'Use lib/db (adapter) ou server actions ao invés de imports diretos',
  },
  {
    id: 'NO_INFRA_IN_DOMAIN',
    description:
      'Domain não deve importar de Infrastructure (inversão de dependência)',
    sourcePattern: /^lib\/domain\//,
    forbiddenImports: [
      /lib\/infrastructure\//,
      /lib\/db(?:\.ts)?$/,
      /lib\/db\//,
      /^pg$/,
    ],
    severity: 'error',
    suggestion:
      'Use ports/interfaces para inversão de dependência (Hexagonal Architecture)',
  },
  {
    id: 'NO_API_IN_COMPONENTS',
    description:
      'Components não devem importar de app/api/ (vazamento de camada)',
    sourcePattern: /^components\//,
    forbiddenImports: [/app\/api\//],
    severity: 'error',
    suggestion: 'Use hooks ou fetch() para chamar APIs',
  },
  {
    id: 'NO_CROSS_DOMAIN_DB',
    description: 'Módulos db/ não devem importar de camada de componentes',
    sourcePattern: /^lib\/(db|infrastructure\/database)\//,
    forbiddenImports: [/^components\//, /^app\//],
    severity: 'error',
    suggestion: 'Camada de DB não deve conhecer componentes ou pages',
  },
];

// ── Regras de adapter (ativadas após refatoração) ─────────────────────────
// Estas regras validam que adapters são puros (apenas re-exports)
const ADAPTER_RULES = [
  {
    id: 'ADAPTER_DB_PURE',
    file: 'lib/db.ts',
    description: 'lib/db.ts deve ser adapter puro (apenas re-exports)',
    maxNonExportLines: 30, // Tolera imports, comentários e configuração mínima
  },
  {
    id: 'ADAPTER_DB_SECURITY_PURE',
    file: 'lib/db-security.ts',
    description: 'lib/db-security.ts deve ser adapter puro (apenas re-exports)',
    maxNonExportLines: 30,
  },
];

// ── Coletar arquivos ──────────────────────────────────────────────────────
function collectFiles(dir, collected = []) {
  if (!fs.existsSync(dir)) return collected;

  const stat = fs.statSync(dir);
  if (stat.isFile()) {
    if (EXTENSIONS.some((ext) => dir.endsWith(ext))) {
      collected.push(dir);
    }
    return collected;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(fullPath, collected);
    } else if (
      entry.isFile() &&
      EXTENSIONS.some((ext) => entry.name.endsWith(ext))
    ) {
      collected.push(fullPath);
    }
  }
  return collected;
}

// ── Extrair imports de um arquivo ─────────────────────────────────────────
function extractImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const imports = [];

  // Static imports: import ... from 'path'
  const staticRe =
    /import\s+(?:(?:type\s+)?{[^}]*}|[^'";\n]+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = staticRe.exec(content)) !== null) {
    imports.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // Dynamic imports: import('path')
  const dynamicRe = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = dynamicRe.exec(content)) !== null) {
    imports.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // Require: require('path')
  const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((match = requireRe.exec(content)) !== null) {
    imports.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // Re-exports: export ... from 'path'
  const reExportRe =
    /export\s+(?:(?:type\s+)?{[^}]*}|\*)\s+from\s+['"]([^'"]+)['"]/g;
  while ((match = reExportRe.exec(content)) !== null) {
    imports.push({
      path: match[1],
      line: content.substring(0, match.index).split('\n').length,
      isReExport: true,
    });
  }

  return imports;
}

// ── Resolver import path para path relativo do projeto ────────────────────
function resolveImportPath(importPath, fromFile) {
  // Handle @/ alias
  if (importPath.startsWith('@/')) {
    return importPath.substring(2);
  }

  // Handle relative imports
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const resolved = path
      .relative(rootDir, path.resolve(path.dirname(fromFile), importPath))
      .replace(/\\/g, '/');
    return resolved;
  }

  // Package import (pg, @neondatabase/serverless, etc.)
  return importPath;
}

// ── Validar adapter purity ────────────────────────────────────────────────
function validateAdapterPurity(rule) {
  const filePath = path.join(rootDir, rule.file);
  if (!fs.existsSync(filePath)) {
    return {
      passed: true,
      skipped: true,
      reason: 'Arquivo não existe (ainda não refatorado)',
    };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  let nonExportLines = 0;
  let hasLogic = false;
  const logicLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, comments, and import/export statements
    if (
      !line ||
      line.startsWith('//') ||
      line.startsWith('/*') ||
      line.startsWith('*') ||
      line.startsWith('*/') ||
      line.startsWith('import ') ||
      line.startsWith('export ') ||
      line.startsWith("'use ") ||
      line.startsWith('"use ')
    ) {
      continue;
    }

    // This is a "logic" line — functions, variables, control flow
    if (
      line.startsWith('function ') ||
      line.startsWith('async function ') ||
      line.startsWith('const ') ||
      line.startsWith('let ') ||
      line.startsWith('var ') ||
      line.startsWith('if ') ||
      line.startsWith('class ') ||
      line.startsWith('for ') ||
      line.startsWith('while ') ||
      line.startsWith('try ') ||
      line.startsWith('await ') ||
      line.startsWith('return ')
    ) {
      hasLogic = true;
      logicLines.push({ line: i + 1, content: line.substring(0, 80) });
    }

    nonExportLines++;
  }

  const passed = nonExportLines <= rule.maxNonExportLines && !hasLogic;

  return {
    passed,
    skipped: false,
    nonExportLines,
    maxAllowed: rule.maxNonExportLines,
    hasLogic,
    logicLines: logicLines.slice(0, 5),
  };
}

// ── Detectar ciclos de import ─────────────────────────────────────────────
function detectCircularImports(targetDirs) {
  const graph = new Map(); // file -> Set<file>
  const allFiles = [];

  for (const dir of targetDirs) {
    const fullDir = path.join(rootDir, dir);
    collectFiles(fullDir, allFiles);
  }

  // Build dependency graph
  for (const file of allFiles) {
    const relFile = path.relative(rootDir, file).replace(/\\/g, '/');
    const imports = extractImports(file);
    const deps = new Set();

    for (const imp of imports) {
      const resolved = resolveImportPath(imp.path, file);
      // Only track internal dependencies
      for (const dir of targetDirs) {
        if (resolved.startsWith(dir) || resolved === dir.replace(/\/$/, '')) {
          deps.add(resolved);
        }
      }
    }

    graph.set(relFile, deps);
  }

  // DFS cycle detection
  const cycles = [];
  const visited = new Set();
  const inStack = new Set();
  const stack = [];

  function dfs(node) {
    if (inStack.has(node)) {
      // Found a cycle
      const cycleStart = stack.indexOf(node);
      if (cycleStart >= 0) {
        cycles.push([...stack.slice(cycleStart), node]);
      }
      return;
    }
    if (visited.has(node)) return;

    visited.add(node);
    inStack.add(node);
    stack.push(node);

    const deps = graph.get(node) || new Set();
    for (const dep of deps) {
      // Try to resolve dep to a file in the graph
      const candidates = [...graph.keys()].filter(
        (k) =>
          k === dep ||
          k === dep + '.ts' ||
          k === dep + '.tsx' ||
          k === dep + '/index.ts' ||
          k === dep + '/index.js'
      );
      for (const candidate of candidates) {
        dfs(candidate);
      }
    }

    stack.pop();
    inStack.delete(node);
  }

  for (const node of graph.keys()) {
    dfs(node);
  }

  return cycles;
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  const violations = [];
  const warnings = [];

  // Collect files from app/ and components/ and lib/
  const scanDirs = ['app', 'components', 'lib'];
  const allFiles = [];
  for (const dir of scanDirs) {
    collectFiles(path.join(rootDir, dir), allFiles);
  }

  // ── Check boundary rules ────────────────────────────────────────────
  for (const file of allFiles) {
    const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
    const imports = extractImports(file);

    for (const rule of BOUNDARY_RULES) {
      if (!rule.sourcePattern.test(relPath)) continue;

      for (const imp of imports) {
        const resolvedPath = resolveImportPath(imp.path, file);

        for (const forbidden of rule.forbiddenImports) {
          if (forbidden.test(imp.path) || forbidden.test(resolvedPath)) {
            const violation = {
              ruleId: rule.id,
              severity: rule.severity,
              file: relPath,
              line: imp.line,
              importPath: imp.path,
              description: rule.description,
              suggestion: rule.suggestion,
            };

            if (rule.severity === 'error') {
              violations.push(violation);
            } else {
              warnings.push(violation);
            }
          }
        }
      }
    }
  }

  // ── Check adapter purity ────────────────────────────────────────────
  const adapterResults = [];
  for (const rule of ADAPTER_RULES) {
    const result = validateAdapterPurity(rule);
    adapterResults.push({
      ...rule,
      ...result,
    });

    if (!result.passed && !result.skipped) {
      warnings.push({
        ruleId: rule.id,
        severity: 'warning',
        file: rule.file,
        line: 0,
        importPath: '',
        description: `${rule.description} — ${result.nonExportLines} linhas de lógica encontradas (máx: ${rule.maxNonExportLines})`,
        suggestion:
          'Mova a lógica para submódulos e mantenha apenas re-exports',
      });
    }
  }

  // ── Check circular imports ──────────────────────────────────────────
  const cycles = detectCircularImports([
    'lib/db/',
    'lib/infrastructure/database/',
    'lib/db-security/',
  ]);
  for (const cycle of cycles) {
    violations.push({
      ruleId: 'CIRCULAR_IMPORT',
      severity: 'error',
      file: cycle[0],
      line: 0,
      importPath: cycle.join(' → '),
      description: `Import circular detectado: ${cycle.join(' → ')}`,
      suggestion:
        'Quebre o ciclo movendo tipos compartilhados para um módulo separado',
    });
  }

  // ── Output ──────────────────────────────────────────────────────────
  const totalIssues = violations.length + warnings.length;

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          passed: violations.length === 0,
          totalViolations: violations.length,
          totalWarnings: warnings.length,
          violations,
          warnings,
          adapterStatus: adapterResults,
          circularImports: cycles,
        },
        null,
        2
      )
    );
  } else {
    console.log(`\n🔍 Validação de Fronteiras de Domínio`);
    console.log(`${'═'.repeat(60)}`);

    if (violations.length === 0 && warnings.length === 0) {
      console.log(`\n✅ Nenhuma violação encontrada!`);
    }

    if (violations.length > 0) {
      console.log(`\n❌ ${violations.length} VIOLAÇÃO(ÕES):`);
      for (const v of violations) {
        console.log(`\n   [${v.ruleId}] ${v.description}`);
        console.log(`   Arquivo: ${v.file}${v.line ? `:${v.line}` : ''}`);
        if (v.importPath && !v.importPath.includes('→')) {
          console.log(`   Import: ${v.importPath}`);
        }
        if (fixMode && v.suggestion) {
          console.log(`   💡 Sugestão: ${v.suggestion}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} AVISO(S):`);
      for (const w of warnings) {
        console.log(`\n   [${w.ruleId}] ${w.description}`);
        console.log(`   Arquivo: ${w.file}${w.line ? `:${w.line}` : ''}`);
        if (fixMode && w.suggestion) {
          console.log(`   💡 Sugestão: ${w.suggestion}`);
        }
      }
    }

    // Adapter status
    console.log(`\n📦 Status dos Adapters:`);
    for (const a of adapterResults) {
      if (a.skipped) {
        console.log(`   ⏭️  ${a.file} — Ainda não refatorado`);
      } else if (a.passed) {
        console.log(`   ✅ ${a.file} — Adapter puro`);
      } else {
        console.log(
          `   ⚠️  ${a.file} — Contém lógica (${a.nonExportLines} linhas, ${a.logicLines?.length || 0} blocos de lógica)`
        );
      }
    }

    // Circular imports
    if (cycles.length > 0) {
      console.log(`\n🔄 Ciclos de Import Detectados:`);
      for (const cycle of cycles) {
        console.log(`   ${cycle.join(' → ')}`);
      }
    } else {
      console.log(`\n🔄 Nenhum ciclo de import detectado nos módulos de DB`);
    }

    console.log(`\n${'═'.repeat(60)}`);

    if (violations.length > 0) {
      console.log(
        `❌ ${violations.length} violação(ões), ${warnings.length} aviso(s)`
      );
      process.exit(1);
    } else if (warnings.length > 0) {
      console.log(
        `⚠️  ${warnings.length} aviso(s) (nenhuma violação bloqueante)`
      );
      process.exit(0);
    } else {
      console.log(`✅ Todas as fronteiras de domínio estão corretas`);
      process.exit(0);
    }
  }
}

main();
