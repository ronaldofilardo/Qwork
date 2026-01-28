#!/usr/bin/env node
// Verificador simples para detectar INSERTs com mais colunas do que placeholders ($n)
// Uso: node scripts/checks/validate-insert-placeholders.cjs

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const GLOB = ['app', 'lib', 'scripts', '__tests__'];
const exts = ['.ts', '.tsx', '.js', '.jsx'];

function readFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (item.name === 'node_modules' || item.name === '.git') continue;
    const full = path.join(dir, item.name);
    if (item.isDirectory()) results.push(...readFiles(full));
    else if (exts.includes(path.extname(item.name))) {
      results.push(full);
    }
  }
  return results;
}

function countParenthesisContent(s, startIdx) {
  let depth = 0;
  let i = startIdx;
  for (; i < s.length; i++) {
    if (s[i] === '(') depth++;
    else if (s[i] === ')') {
      depth--;
      if (depth === 0) return s.slice(startIdx + 1, i);
    }
  }
  return null;
}

function analyzeFile(file) {
  const content = fs.readFileSync(file, 'utf8');
  const lc = content.toLowerCase();
  let idx = 0;
  const findings = [];

  while (true) {
    const pos = lc.indexOf('insert into', idx);
    if (pos === -1) break;

    // try to parse columns list
    const after = content.slice(pos);
    const parenStart = after.indexOf('(');
    const columns = countParenthesisContent(after, parenStart);
    // Limit the search for VALUES to the current statement (up to the next INSERT) to avoid cross-matching
    const nextInsertPos = after.toLowerCase().indexOf('insert into', 10);
    const stmtScope =
      nextInsertPos === -1 ? after : after.slice(0, nextInsertPos);
    let valuesIdx = stmtScope.toLowerCase().indexOf('values');
    if (columns && valuesIdx !== -1) {
      const valuesStart = after.indexOf('(', valuesIdx);
      const values = countParenthesisContent(after, valuesStart);
      if (values) {
        const colCount = columns
          .split(',')
          .filter((s) => s.trim().length > 0).length;

        // split values at top-level commas (ignore commas inside parentheses or quotes)
        function splitTopLevel(s) {
          const parts = [];
          let buf = '';
          let depth = 0;
          let inSingle = false;
          let inDouble = false;
          for (let i = 0; i < s.length; i++) {
            const ch = s[i];
            if (ch === "'" && !inDouble) {
              inSingle = !inSingle;
              buf += ch;
              continue;
            }
            if (ch === '"' && !inSingle) {
              inDouble = !inDouble;
              buf += ch;
              continue;
            }
            if (!inSingle && !inDouble) {
              if (ch === '(') {
                depth++;
                buf += ch;
                continue;
              }
              if (ch === ')') {
                if (depth > 0) depth--;
                buf += ch;
                continue;
              }
              if (ch === ',' && depth === 0) {
                parts.push(buf.trim());
                buf = '';
                continue;
              }
            }
            buf += ch;
          }
          if (buf.trim() !== '') parts.push(buf.trim());
          return parts;
        }

        const valueParts = splitTopLevel(values);
        const valuesCount = valueParts.length;
        const placeholderMatches = values.match(/\$\d+/g) || [];
        const placeholderCount = placeholderMatches.length;

        // Flag only when the total number of values doesn't match columns, or
        // when placeholders exist but are fewer than provided value items (possible missing placeholders)
        if (
          valuesCount !== colCount ||
          (placeholderCount > 0 && placeholderCount < valuesCount)
        ) {
          findings.push({
            pos: pos + 1,
            colCount,
            placeholderCount,
            valuesCount,
            columns: columns.trim(),
            values: values.trim().slice(0, 200),
          });
        }
      }
    }

    idx = pos + 10;
  }

  return findings;
}

let totalFindings = 0;
const hardFiles = [];
for (const folder of GLOB) {
  const dir = path.join(root, folder);
  if (!fs.existsSync(dir)) continue;
  const files = readFiles(dir);
  for (const f of files) {
    const findings = analyzeFile(f);
    if (findings.length > 0) {
      const hard = findings.filter(
        (fn) => fn.valuesCount !== undefined && fn.valuesCount !== fn.colCount
      );
      const soft = findings.filter((fn) => !hard.includes(fn));

      console.warn(
        `\n[WARN] Arquivo: ${path.relative(root, f)} -> Possíveis INSERTs inconsistentes:`
      );

      // Print hard (fail) findings first
      hard.forEach((fn) => {
        const valuesCountPart =
          fn.valuesCount !== undefined ? `, values=${fn.valuesCount}` : '';
        console.warn(
          `  - [ERROR] pos ${fn.pos}: colunas=${fn.colCount}, placeholders=${fn.placeholderCount}${valuesCountPart}`
        );
        console.warn(`    columns: ${fn.columns.slice(0, 200)}`);
        console.warn(`    values: ${fn.values}`);
        console.warn(
          `    -> Atenção: número de items em VALUES (${fn.valuesCount}) difere das colunas (${fn.colCount}). Revise a declaração.`
        );
      });

      // Print softer warnings (likely intentional mixes of literals and placeholders)
      soft.forEach((fn) => {
        const valuesCountPart =
          fn.valuesCount !== undefined ? `, values=${fn.valuesCount}` : '';
        console.warn(
          `  - [WARN] pos ${fn.pos}: colunas=${fn.colCount}, placeholders=${fn.placeholderCount}${valuesCountPart}`
        );
        console.warn(`    columns: ${fn.columns.slice(0, 200)}`);
        console.warn(`    values: ${fn.values}`);
      });

      if (hard.length > 0) {
        console.error(`  -> Hard mismatches in this file: ${hard.length}`);
        hardFiles.push({ file: path.relative(root, f), count: hard.length });
      }

      totalFindings += hard.length; // only count hard findings as failures
    }
  }
}

if (hardFiles.length > 0) {
  console.error('\nSummary of files with hard mismatches:');
  hardFiles.forEach((h) => console.error(` - ${h.file}: ${h.count} issue(s)`));
}

if (totalFindings === 0) {
  console.log(
    '\n✔ Nenhuma inconsistência óbvia detectada em INSERT placeholders.'
  );
  process.exit(0);
} else {
  console.error(
    `\n✖ Detectadas ${totalFindings} possíveis inconsistências. Revise manualmente.`
  );
  process.exit(2);
}
