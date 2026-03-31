#!/usr/bin/env node

/**
 * check-imports.mjs — Analisador de imports para refatoração segura
 *
 * Uso:
 *   node scripts/check-imports.mjs <caminho-do-arquivo>
 *   node scripts/check-imports.mjs lib/db.ts
 *   node scripts/check-imports.mjs lib/db.ts --json
 *   node scripts/check-imports.mjs lib/db.ts --json > report.json
 *
 * O que faz:
 * - Encontra TODOS os arquivos que importam do módulo especificado
 * - Lista os símbolos importados por cada consumidor
 * - Detecta imports estáticos (import ... from), dinâmicos (import(...)) e require(...)
 * - Gera relatório human-readable ou JSON
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// ── Configuração ──────────────────────────────────────────────────────────
const SCAN_DIRS = [
  'app',
  'lib',
  'components',
  'hooks',
  'scripts',
  '__tests__',
  'cypress',
  'middleware.ts',
];
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts'];
const IGNORE_DIRS = new Set([
  'node_modules',
  '.next',
  'dist',
  'build',
  '.git',
  '__obsolete_tests__',
]);

// ── Parsing de argumentos ─────────────────────────────────────────────────
const args = process.argv.slice(2);
const jsonMode = args.includes('--json');
const targetFile = args.find((a) => !a.startsWith('--'));

if (!targetFile) {
  console.error(
    'Uso: node scripts/check-imports.mjs <caminho-do-arquivo> [--json]'
  );
  console.error('Exemplo: node scripts/check-imports.mjs lib/db.ts');
  process.exit(1);
}

// ── Resolver o módulo alvo ────────────────────────────────────────────────
// Normalizar o caminho: remover extensão para matching de imports
const targetAbsolute = path.resolve(rootDir, targetFile);
if (!fs.existsSync(targetAbsolute)) {
  console.error(`Arquivo não encontrado: ${targetAbsolute}`);
  process.exit(1);
}

// Gerar variantes de import path que consumidores podem usar
const targetRelFromRoot = path
  .relative(rootDir, targetAbsolute)
  .replace(/\\/g, '/');
const targetWithoutExt = targetRelFromRoot.replace(
  /\.(ts|tsx|js|jsx|mjs|cjs|mts)$/,
  ''
);
const targetAliased = `@/${targetWithoutExt}`;
const targetAliasedWithExt = `@/${targetRelFromRoot}`;

// Também considerar imports de diretório (index.ts)
const targetDirVariants = [];
if (
  targetRelFromRoot.endsWith('/index.ts') ||
  targetRelFromRoot.endsWith('/index.js')
) {
  const dir = path.dirname(targetRelFromRoot);
  targetDirVariants.push(dir, `@/${dir}`, `./${dir}`);
}

// ── Coletar todos os arquivos do projeto ──────────────────────────────────
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

// ── Regex para detectar imports ───────────────────────────────────────────
// Static: import { foo, bar } from './lib/db'
// Static: import type { Foo } from '@/lib/db'
// Static: import * as db from './lib/db'
// Static: import db from './lib/db'
// Dynamic: import('./lib/db')  or  await import('./lib/db')
// Require: require('./lib/db')
// Re-export: export { foo } from './lib/db'  or  export * from './lib/db'

function analyzeFileImports(filePath, targetPatterns) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];

  // Pattern: import { named, symbols } from 'path'
  // Also matches: import type { Named } from 'path'
  const staticNamedRe =
    /import\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;

  // Pattern: import * as name from 'path'
  const staticStarRe = /import\s+\*\s+as\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

  // Pattern: import defaultName from 'path'
  const staticDefaultRe = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;

  // Pattern: import('path') or await import('path')
  const dynamicRe = /(?:await\s+)?import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Pattern: require('path')
  const requireRe = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  // Pattern: export { foo } from 'path' or export * from 'path'
  const reExportNamedRe =
    /export\s+(?:type\s+)?{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  const reExportStarRe = /export\s+\*\s+from\s+['"]([^'"]+)['"]/g;

  function matchesTarget(importPath) {
    // Normalize the import path to compare
    const normalized = importPath.replace(/\\/g, '/');

    for (const pattern of targetPatterns) {
      if (normalized === pattern) return true;
      if (normalized.endsWith('/' + pattern)) return true;
      // Handle relative imports
      if (normalized.startsWith('./') || normalized.startsWith('../')) {
        const resolvedFromFile = path
          .resolve(path.dirname(filePath), normalized)
          .replace(/\\/g, '/');
        const resolvedTarget = path
          .resolve(rootDir, targetWithoutExt)
          .replace(/\\/g, '/');
        const resolvedTargetWithExt = targetAbsolute.replace(/\\/g, '/');
        if (
          resolvedFromFile === resolvedTarget ||
          resolvedFromFile === resolvedTargetWithExt
        )
          return true;
        // Also check with extensions
        for (const ext of EXTENSIONS) {
          if (resolvedFromFile + ext === resolvedTargetWithExt) return true;
        }
        // Check index files
        if (resolvedFromFile + '/index.ts' === resolvedTargetWithExt)
          return true;
        if (resolvedFromFile + '/index.js' === resolvedTargetWithExt)
          return true;
      }
    }
    return false;
  }

  // Analyze static named imports
  let match;
  while ((match = staticNamedRe.exec(content)) !== null) {
    const [, symbols, importPath] = match;
    if (matchesTarget(importPath)) {
      const symbolList = symbols
        .split(',')
        .map((s) => {
          const trimmed = s.trim();
          // Handle "type Foo" and "Foo as Bar"
          return trimmed
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]
            .trim();
        })
        .filter(Boolean);
      results.push({ type: 'static-named', symbols: symbolList, importPath });
    }
  }

  // Analyze star imports
  while ((match = staticStarRe.exec(content)) !== null) {
    const [, alias, importPath] = match;
    if (matchesTarget(importPath)) {
      results.push({
        type: 'static-star',
        symbols: [`* as ${alias}`],
        importPath,
      });
    }
  }

  // Analyze default imports (be careful to not double-count named imports)
  while ((match = staticDefaultRe.exec(content)) !== null) {
    const [fullMatch, name, importPath] = match;
    if (matchesTarget(importPath)) {
      // Skip if this was already matched as a named import (contains {})
      if (!fullMatch.includes('{') && !fullMatch.includes('*')) {
        results.push({ type: 'static-default', symbols: [name], importPath });
      }
    }
  }

  // Analyze dynamic imports
  while ((match = dynamicRe.exec(content)) !== null) {
    const [, importPath] = match;
    if (matchesTarget(importPath)) {
      results.push({ type: 'dynamic', symbols: ['(dynamic)'], importPath });
    }
  }

  // Analyze require
  while ((match = requireRe.exec(content)) !== null) {
    const [, importPath] = match;
    if (matchesTarget(importPath)) {
      results.push({ type: 'require', symbols: ['(require)'], importPath });
    }
  }

  // Analyze re-exports
  while ((match = reExportNamedRe.exec(content)) !== null) {
    const [, symbols, importPath] = match;
    if (matchesTarget(importPath)) {
      const symbolList = symbols
        .split(',')
        .map((s) => {
          const trimmed = s.trim();
          return trimmed
            .replace(/^type\s+/, '')
            .split(/\s+as\s+/)[0]
            .trim();
        })
        .filter(Boolean);
      results.push({
        type: 're-export-named',
        symbols: symbolList,
        importPath,
      });
    }
  }

  while ((match = reExportStarRe.exec(content)) !== null) {
    const [, importPath] = match;
    if (matchesTarget(importPath)) {
      results.push({ type: 're-export-star', symbols: ['*'], importPath });
    }
  }

  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────
function main() {
  const targetPatterns = [
    targetWithoutExt,
    targetRelFromRoot,
    targetAliased,
    targetAliasedWithExt,
    `./${targetWithoutExt}`,
    `./${targetRelFromRoot}`,
    ...targetDirVariants,
  ];

  // Collect all source files
  const allFiles = [];
  for (const scanDir of SCAN_DIRS) {
    const fullPath = path.join(rootDir, scanDir);
    collectFiles(fullPath, allFiles);
  }

  // Remove the target file itself from analysis
  const filesToAnalyze = allFiles.filter((f) => {
    const normalized = f.replace(/\\/g, '/');
    const targetNormalized = targetAbsolute.replace(/\\/g, '/');
    return normalized !== targetNormalized;
  });

  // Analyze each file
  const importers = [];
  const symbolUsage = new Map(); // symbol -> count

  for (const file of filesToAnalyze) {
    const imports = analyzeFileImports(file, targetPatterns);
    if (imports.length > 0) {
      const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
      const allSymbols = imports.flatMap((i) => i.symbols);
      const types = imports.map((i) => i.type);

      importers.push({
        file: relPath,
        imports,
        symbols: [...new Set(allSymbols)],
        types: [...new Set(types)],
      });

      // Count symbol usage
      for (const sym of allSymbols) {
        symbolUsage.set(sym, (symbolUsage.get(sym) || 0) + 1);
      }
    }
  }

  // Sort by file path
  importers.sort((a, b) => a.file.localeCompare(b.file));

  // ── Output ────────────────────────────────────────────────────────────
  if (jsonMode) {
    const report = {
      target: targetRelFromRoot,
      totalImporters: importers.length,
      symbolUsage: Object.fromEntries(
        [...symbolUsage.entries()].sort((a, b) => b[1] - a[1])
      ),
      importers: importers.map((i) => ({
        file: i.file,
        symbols: i.symbols,
        types: i.types,
      })),
    };
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`\n📦 Análise de imports para: ${targetRelFromRoot}`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`Total de importadores: ${importers.length}`);
    console.log();

    // Symbol usage summary
    console.log(`📊 Símbolos mais importados:`);
    const sortedSymbols = [...symbolUsage.entries()].sort(
      (a, b) => b[1] - a[1]
    );
    for (const [sym, count] of sortedSymbols.slice(0, 20)) {
      console.log(`   ${String(count).padStart(4)}x  ${sym}`);
    }
    if (sortedSymbols.length > 20) {
      console.log(`   ... e mais ${sortedSymbols.length - 20} símbolos`);
    }
    console.log();

    // Group by directory
    const byDir = new Map();
    for (const imp of importers) {
      const dir = path.dirname(imp.file);
      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir).push(imp);
    }

    console.log(`📁 Importadores por diretório:`);
    for (const [dir, files] of [...byDir.entries()].sort()) {
      console.log(`\n   ${dir}/ (${files.length} arquivo(s))`);
      for (const f of files) {
        const typeTag = f.types.includes('dynamic')
          ? ' [dynamic]'
          : f.types.includes('require')
            ? ' [require]'
            : f.types.includes('re-export-star')
              ? ' [re-export *]'
              : f.types.includes('re-export-named')
                ? ' [re-export]'
                : '';
        console.log(`      ${f.file}${typeTag}`);
        console.log(`         → { ${f.symbols.join(', ')} }`);
      }
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(
      `✅ Análise completa. ${importers.length} arquivo(s) dependem de ${targetRelFromRoot}`
    );
  }
}

main();
