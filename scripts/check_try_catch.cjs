const fs = require('fs');
const s = fs.readFileSync('app/api/pagamento/confirmar/route.ts', 'utf8');
const lines = s.split(/\r?\n/);
let depth = 0;
const tries = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const indexTry = line.indexOf('try {');
  if (indexTry !== -1) {
    tries.push({ line: i + 1, depth, matched: false });
  }
  const indexCatch = line.indexOf('} catch');
  if (indexCatch !== -1) {
    const currentDepth = depth; // depth before processing this line's braces
    // Find last unmatched try
    const lastTry = [...tries].reverse().find((t) => !t.matched);
    if (!lastTry) {
      console.log('Unmatched catch at line', i + 1, 'no prior try');
    } else if (lastTry.depth === currentDepth) {
      lastTry.matched = true;
      console.log(
        'Matched catch at line',
        i + 1,
        'to try at line',
        lastTry.line,
        'depth',
        currentDepth
      );
    } else {
      console.log(
        'Possible mismatch: catch at line',
        i + 1,
        'depth',
        currentDepth,
        'last try at line',
        lastTry.line,
        'depth',
        lastTry.depth
      );
    }
  }
  // count braces in line
  for (const ch of line) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
  }
}
console.log('Final depth', depth);
console.log('Tries:', tries);
