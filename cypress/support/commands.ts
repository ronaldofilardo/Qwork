/// <reference types="cypress" />
import 'cypress-file-upload';

// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a user
       * @example cy.login('12345678901', 'senha123')
       */
      login(cpf: string, senha: string, perfil?: string): Chainable<void>;
      /**
       * Convenience: login as an entity manager (gestor)
       */
      loginAsEntidade(): Chainable<void>;

      /**
       * Custom command to seed database with test data
       * @example cy.seedDatabase()
       */
      seedDatabase(): Chainable<void>;
    }
  }
}

// Custom login command
Cypress.Commands.add(
  'login',
  (cpf: string, senha: string, perfil = 'funcionario') => {
    // Limpar cookies existentes
    cy.clearCookies();

    // Buscar dados do usuário no banco para obter clinica_id/empresa_id
    cy.request({
      method: 'POST',
      url: '/api/test/session',
      body: {
        cpf,
        nome: 'Usuário Teste',
        perfil,
        // Para RH, precisa clinica_id
        clinica_id: 1, // ID da clínica de teste
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.ok).to.be.true;

      // Aguardar cookie ser setado
      cy.getCookie('bps-session').should('exist');
    });
  }
);

// Convenience: login as an entity manager (uses default test CPF)
Cypress.Commands.add('loginAsEntidade', () => {
  // Create a session that includes tomador_id so entitlement checks pass
  return cy
    .request({
      method: 'POST',
      url: '/api/test/session',
      body: {
        cpf: '00000000000',
        nome: 'Gestor Entidade Teste',
        perfil: 'gestor',
        tomador_id: 2,
      },
      failOnStatusCode: false,
    })
    .then((resp) => {
      expect(resp.status).to.eq(200);
      cy.getCookie('bps-session').should('exist');
    });
});

// Database seeding command (executes seeding script locally)
Cypress.Commands.add('seedDatabase', () => {
  // Run the same seed script used by CI/`pnpm test:e2e`.
  // Use failOnNonZeroExit=false to allow the script to return non-zero in some envs
  // without failing the Cypress command execution.
  cy.exec('npx tsx scripts/insert-login-test-data.ts', {
    failOnNonZeroExit: false,
  });
});

export {};
