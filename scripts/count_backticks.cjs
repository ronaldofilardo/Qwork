const fs = require('fs');
const s = fs.readFileSync('app/api/pagamento/confirmar/route.ts', 'utf8');
let total = 0;
const lines = s.split(/\r?\n/);
lines.forEach((l, i) => {
  const c = (l.match(/`/g) || []).length;
  total += c;
  if (c % 2 !== 0) console.log('Line', i + 1, 'has odd backticks:', c);
});
console.log('Total backticks:', total);
console.log('Parity (0=even,1=odd):', total % 2);
