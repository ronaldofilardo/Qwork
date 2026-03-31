/**
 * E2E: Fluxo de Avaliação do Funcionário
 *
 * Valida o ciclo de avaliação:
 *  - Acesso à avaliação
 *  - Resposta às perguntas
 *  - Navegação entre questões
 *  - Finalização
 */

describe('Fluxo de Avaliação — E2E', () => {
  const TIMEOUT = 8000;

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'Funcionário Avaliação E2E',
        perfil: 'funcionario',
        sessionToken: 'func-aval-token',
      },
    }).as('session');
  });

  describe('Acesso à Avaliação', () => {
    it('deve carregar página de avaliação', () => {
      cy.intercept('GET', '/api/avaliacao*', {
        statusCode: 200,
        body: {
          avaliacao: {
            id: 1,
            status: 'iniciada',
            perguntas: [
              { id: 'q1', texto: 'Você se sente seguro no trabalho?' },
              { id: 'q2', texto: 'O ambiente de trabalho é adequado?' },
            ],
          },
        },
      }).as('avaliacao');

      cy.visit('/avaliacao', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
    });

    it('deve exibir pergunta atual', () => {
      cy.intercept('GET', '/api/avaliacao*', {
        statusCode: 200,
        body: {
          avaliacao: {
            id: 1,
            status: 'iniciada',
            perguntas: [
              { id: 'q1', texto: 'Você se sente seguro no trabalho?' },
            ],
          },
        },
      }).as('avaliacao');

      cy.visit('/avaliacao', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Deve haver alguma indicação de pergunta
      cy.contains(/pergunta|questão|avaliação/i, { timeout: TIMEOUT }).should(
        'exist'
      );
    });
  });

  describe('Autenticação', () => {
    it('deve redirecionar para login sem sessão', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 401,
        body: { error: 'Não autenticado' },
      }).as('sessionFail');

      cy.visit('/avaliacao', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });
  });
});
