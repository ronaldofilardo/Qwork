/**
 * Test Environment Variables Loading
 * Verifica quais variáveis estão disponíveis
 */

import dotenv from 'dotenv';

console.log('=== TESTE DE CARREGAMENTO DE VARIÁVEIS DE AMBIENTE ===\n');
console.log('NODE_ENV:', process.env.NODE_ENV || 'undefined');

console.log('\n--- Carregando .env.local ---');
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
