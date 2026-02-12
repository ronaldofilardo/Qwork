import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const projectRoot = process.cwd();

console.log('\n=== SIMULANDO CARREGAMENTO DE .ENV DO NEXT.JS ===\n');

// Simular a ordem de carregamento do Next.js em desenvolvimento
const filesToLoad = [
  { file: '.env', desc: 'Base (sempre carregado)' },
  { file: '.env.development', desc: 'Desenvolvimento' },
  { file: '.env.local', desc: 'Local (sempre sobrescreve)' },
];

// Se NODE_ENV=test, também carregaria .env.test
if (process.env.NODE_ENV === 'test') {
  filesToLoad.push({ file: '.env.test', desc: 'Testes' });
}

let loadedVars = {};

console.log(`NODE_ENV atual: ${process.env.NODE_ENV || 'undefined'}\n`);

for (const { file, desc } of filesToLoad) {
  const filePath = path.join(projectRoot, file);
  if (fs.existsSync(filePath)) {
    console.log(`📄 Carregando ${file} (${desc}):`);
    const result = dotenv.config({ path: filePath, override: true });
    if (result.parsed) {
      // Mostrar apenas variáveis de banco de dados
      Object.entries(result.parsed).forEach(([key, value]) => {
        if (key.includes('DATABASE') || key.includes('NODE_ENV')) {
          console.log(
            `   ${key}=${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`
          );
          loadedVars[key] = value;
        }
      });
    }
  } else {
    console.log(`❌ ${file} não encontrado`);
  }
  console.log('');
}

console.log('\n=== RESULTADO FINAL (Após todas as cargas) ===\n');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log(
  'DATABASE_URL:',
  (process.env.DATABASE_URL || 'undefined').substring(0, 60) + '...'
);
console.log(
  'LOCAL_DATABASE_URL:',
  (process.env.LOCAL_DATABASE_URL || 'undefined').substring(0, 60) + '...'
);
console.log(
  'TEST_DATABASE_URL:',
  (process.env.TEST_DATABASE_URL || 'undefined').substring(0, 60) + '...'
);

console.log('\n=== QUAL BANCO DEVE SER USADO? ===\n');

if (process.env.NODE_ENV === 'test') {
  console.log('✔️ Ambiente = TESTE');
  console.log(
    '✔️ Deve usar TEST_DATABASE_URL:',
    process.env.TEST_DATABASE_URL ? '✅ Definido' : '❌ NÃO DEFINIDO'
  );
} else if (process.env.NODE_ENV === 'production') {
  console.log('✔️ Ambiente = PRODUÇÃO');
  console.log(
    '✔️ Deve usar DATABASE_URL:',
    process.env.DATABASE_URL ? '✅ Definido' : '❌ NÃO DEFINIDO'
  );
} else {
  console.log('✔️ Ambiente = DESENVOLVIMENTO');
  console.log(
    '✔️ Deve usar LOCAL_DATABASE_URL:',
    process.env.LOCAL_DATABASE_URL ? '✅ Definido' : '❌ NÃO DEFINIDO'
  );
}

console.log('\n=====================================\n');
