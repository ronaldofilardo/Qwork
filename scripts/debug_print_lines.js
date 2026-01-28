const fs = require('fs');
const path = 'app/api/pagamento/confirmar/route.ts';
const s = fs.readFileSync(path, 'utf8');
const lines = s.split(/\r?\n/);
const start = 670;
const end = 700;
for (let i = start - 1; i < end; i++) {
  const l = lines[i] ?? '';
  const codes = Array.from(l)
    .map((c) => c.charCodeAt(0))
    .join(' ');
  console.log(`${i + 1}: ${l}`);
  console.log(`chars: ${codes}`);
  console.log('----');
}
