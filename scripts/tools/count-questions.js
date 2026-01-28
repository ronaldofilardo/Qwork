const fs = require('fs');
const ts = require('typescript');

// Read and compile the TypeScript file
const code = fs.readFileSync('c:/apps/QWork/lib/questoes.ts', 'utf8');
const result = ts.transpileModule(code, {
  compilerOptions: { module: ts.ModuleKind.CommonJS },
});

// Evaluate the compiled code
const module = { exports: {} };
const require = () => module.exports;
eval(result.outputText);

// Count the questions
const { grupos } = module.exports;
let total = 0;
console.log('Contagem de questões por grupo:');
grupos.forEach((grupo, index) => {
  const count = grupo.itens.length;
  total += count;
  console.log(`Grupo ${grupo.id} (${grupo.titulo}): ${count} questões`);
});
console.log(`\nTotal de questões: ${total}`);
