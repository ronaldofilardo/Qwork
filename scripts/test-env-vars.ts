/**
 * Test Environment Variables Loading
 * Verifica quais variáveis estão disponíveis no servidor Next.js
 */

import dotenv from 'dotenv';
import path from 'path';

console.log('=== TESTE DE CARREGAMENTO DE VARIÁVEIS DE AMBIENTE ===\n');

// Simular comportamento do Next.js
const possibleEnvFiles = ['.env.local', '.env.development', '.env'];

console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('\nArquivos .env carregados pelo Next.js (ordem de precedência):');

possibleEnvFiles.forEach((file) => {
  const _filePath = path.join(process.cwd(), file);
  console.log(`  - ${file}`);
});

console.log('\n--- Carregando .env.local manualmente ---');
dotenv.config({ path: '.env.local' });

console.log('\n=== VARIÁVEIS RELEVANTES ===\n');
console.log(
  'DATABASE_URL:',
  process.env.DATABASE_URL ? '✓ (definido)' : '✗ (não definido)'
);
console.log(
  'LOCAL_DATABASE_URL:',
  process.env.LOCAL_DATABASE_URL ? '✓ (definido)' : '✗ (não definido)'
);

console.log(
  '\nNOTE: Storage is local by default (storage/ and public/uploads/).'
);
