const fs = require('fs');
const s = fs.readFileSync('app/api/pagamento/confirmar/route.ts', 'utf8');
const lines = s.split(/\r?\n/);
const stack = [];
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    const ch = line[j];
    if (ch === '{') stack.push({ line: i + 1, col: j + 1 });
    else if (ch === '}') stack.pop();
  }
}
console.log('Unmatched opens count:', stack.length);
console.log(stack.slice(-20));
