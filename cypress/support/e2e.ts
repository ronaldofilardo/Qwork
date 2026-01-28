// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Ignorar erros de redirecionamento do Next.js (NEXT_REDIRECT) que ocorrem durante navegações internas
Cypress.on('uncaught:exception', (err) => {
  if (
    err &&
    err.message &&
    err.message.includes &&
    err.message.includes('NEXT_REDIRECT')
  ) {
    // retornar false evita que o erro quebre o teste
    return false;
  }
  // return true to let other errors fail the test
  return true;
});

// Alternatively you can use CommonJS syntax:
// require('./commands')
