/**
 * E2E: Perfil Vendedor
 *
 * Valida acesso e funcionalidades do perfil vendedor:
 *  - Acesso à rota /vendedor
 *  - Bloqueio de rotas de outros perfis (segregação RBAC)
 *  - Dashboard carrega sem erros
 */

describe('Perfil Vendedor — E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login('55555555555', 'vendedor123', 'vendedor');
  });

  // ──────────────────────────────────────────────────────
  // Acesso ao Dashboard Vendedor
  // ──────────────────────────────────────────────────────

  describe('Acesso ao Dashboard Vendedor', () => {
    it('deve carregar /vendedor com sessão mockada', () => {
      cy.clearCookies();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '55555555555',
          nome: 'Usuário Vendedor',
          perfil: 'vendedor',
          sessionToken: 'token-vendedor',
        },
      }).as('session');

      cy.visit('/vendedor');
      cy.wait('@session');
      cy.url().should('include', '/vendedor');
    });

    it('deve bloquear acesso a /vendedor sem sessão', () => {
      cy.clearCookies();
      cy.visit('/vendedor', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  // ──────────────────────────────────────────────────────
  // Segregação RBAC — Rotas de outros perfis bloqueadas
  // ──────────────────────────────────────────────────────

  describe('Rotas de outros perfis bloqueadas pelo middleware', () => {
    it('NÃO deve acessar rota /admin', () => {
      cy.request({
        url: '/admin',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 302]);
      });
    });

    it('NÃO deve acessar rota /suporte', () => {
      cy.request({
        url: '/suporte',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 302]);
      });
    });

    it('NÃO deve acessar rota /comercial', () => {
      cy.request({
        url: '/comercial',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 302]);
      });
    });

    it('NÃO deve acessar rota /rh', () => {
      cy.request({
        url: '/rh',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 302]);
      });
    });
  });

  // ──────────────────────────────────────────────────────
  // APIs bloqueadas para vendedor
  // ──────────────────────────────────────────────────────

  describe('APIs bloqueadas — Admin exclusivas', () => {
    it('NÃO deve acessar GET /api/admin/emissores', () => {
      cy.request({
        url: '/api/admin/emissores',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('NÃO deve acessar GET /api/admin/cobranca', () => {
      cy.request({
        url: '/api/admin/cobranca',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('NÃO deve acessar GET /api/admin/representantes', () => {
      cy.request({
        url: '/api/admin/representantes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('NÃO deve acessar GET /api/admin/gestores-rh', () => {
      cy.request({
        url: '/api/admin/gestores-rh',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('NÃO deve acessar GET /api/rh/empresas', () => {
      cy.request({
        url: '/api/rh/empresas',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  // ──────────────────────────────────────────────────────
  // UI — Dashboard Vendedor
  // ──────────────────────────────────────────────────────

  describe('UI — Dashboard Vendedor (mocked)', () => {
    it('deve exibir cards de KPI em breve', () => {
      cy.clearCookies();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '55555555555',
          nome: 'Vendedor Teste',
          perfil: 'vendedor',
          sessionToken: 'token-vendedor',
        },
      }).as('session');

      cy.visit('/vendedor');
      cy.wait('@session');

      // Dashboard do vendedor exibe cards placeholder
      cy.contains(/Leads Indicados/i).should('exist');
      cy.contains(/Em breve/i).should('exist');
    });
  });
});
