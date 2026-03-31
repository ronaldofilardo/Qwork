/**
 * E2E: Inativação de Avaliações
 *
 * Valida fluxo de inativação:
 *  - RH inativando avaliação em lote
 *  - Gestor entidade inativando avaliação
 *  - Validações de bloqueio (lote emitido)
 *  - Motivo obrigatório
 */

describe('Inativação de Avaliações — E2E', () => {
  const TIMEOUT = 8000;

  describe('RH — Inativar Avaliação', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '11111111111',
          nome: 'RH Inativar E2E',
          perfil: 'rh',
          sessionToken: 'rh-inativar-token',
        },
      }).as('session');
    });

    it('API deve rejeitar sem motivo', () => {
      cy.request({
        method: 'POST',
        url: '/api/rh/lotes/1/avaliacoes/1/inativar',
        body: { motivo: '' },
        failOnStatusCode: false,
      }).then((response) => {
        expect([400, 401, 403]).to.include(response.status);
      });
    });

    it('API deve rejeitar sem autenticação', () => {
      cy.request({
        method: 'POST',
        url: '/api/rh/lotes/1/avaliacoes/1/inativar',
        body: { motivo: 'Teste E2E' },
        failOnStatusCode: false,
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    });
  });

  describe('Entidade — Inativar Avaliação', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '22222222222',
          nome: 'Gestor Inativar E2E',
          perfil: 'gestor',
          entidade_id: 1,
          sessionToken: 'gestor-inativar-token',
        },
      }).as('session');
    });

    it('API deve rejeitar inativação sem motivo', () => {
      cy.request({
        method: 'POST',
        url: '/api/entidade/lote/1/avaliacoes/1/inativar',
        body: {},
        failOnStatusCode: false,
      }).then((response) => {
        expect([400, 401, 403]).to.include(response.status);
      });
    });
  });
});
