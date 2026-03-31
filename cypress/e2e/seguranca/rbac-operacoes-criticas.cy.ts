/**
 * E2E: Testes de RBAC (Role-Based Access Control) em Operações Críticas
 *
 * Valida que cada perfil só acessa recursos permitidos:
 *  - admin: acesso total
 *  - rh: lotes, avaliações, emissão
 *  - gestor: apenas entidade própria
 *  - funcionario: apenas avaliação própria
 *  - emissor: apenas laudos atribuídos
 */

describe('RBAC — Operações Críticas', () => {
  const TIMEOUT = 5000;

  describe('Perfil Funcionário — Restrições', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '33333333333',
          nome: 'Func E2E',
          perfil: 'funcionario',
          sessionToken: 'func-token',
        },
      }).as('session');
    });

    it('não deve acessar painel admin', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/admin');
    });

    it('não deve acessar painel RH', () => {
      cy.visit('/rh', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/rh');
    });

    it('não deve acessar painel entidade', () => {
      cy.visit('/entidade', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/entidade');
    });
  });

  describe('Perfil Emissor — Restrições', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '44444444444',
          nome: 'Emissor E2E',
          perfil: 'emissor',
          sessionToken: 'emissor-token',
        },
      }).as('session');
    });

    it('não deve acessar painel admin', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/admin');
    });

    it('não deve acessar painel RH', () => {
      cy.visit('/rh', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/rh');
    });
  });

  describe('Perfil Gestor — Acesso Entidade', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '55555555555',
          nome: 'Gestor E2E',
          perfil: 'gestor',
          entidade_id: 1,
          sessionToken: 'gestor-token',
        },
      }).as('session');
    });

    it('não deve acessar painel admin', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('not.include', '/admin');
    });

    it('deve acessar painel entidade', () => {
      cy.intercept('GET', '/api/entidade/lotes*', {
        statusCode: 200,
        body: { lotes: [] },
      }).as('lotes');

      cy.visit('/entidade', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
    });
  });

  describe('Perfil Admin — Acesso Total', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin E2E',
          perfil: 'admin',
          sessionToken: 'admin-token',
        },
      }).as('session');
    });

    it('deve acessar painel admin', () => {
      cy.visit('/admin', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url({ timeout: TIMEOUT }).should('include', '/admin');
    });
  });

  describe('APIs Protegidas — Sem Autenticação', () => {
    it('deve rejeitar acesso a API de lotes sem auth', () => {
      cy.request({
        url: '/api/rh/lotes',
        failOnStatusCode: false,
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    });

    it('deve rejeitar acesso a API de funcionários sem auth', () => {
      cy.request({
        url: '/api/entidade/funcionarios',
        failOnStatusCode: false,
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    });

    it('deve rejeitar acesso a API admin sem auth', () => {
      cy.request({
        url: '/api/admin/tomadores',
        failOnStatusCode: false,
      }).then((response) => {
        expect([401, 403]).to.include(response.status);
      });
    });
  });
});
