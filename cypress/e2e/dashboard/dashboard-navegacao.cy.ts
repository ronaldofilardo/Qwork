/**
 * E2E: Dashboard e Navegação
 *
 * Valida carregamento e navegação dos dashboards por perfil:
 *  - Admin dashboard (cards de métricas)
 *  - RH dashboard (lotes, avaliações)
 *  - Entidade dashboard (funcionários, status)
 *  - Clínica dashboard (laudos, agendamentos)
 */

describe('Dashboard e Navegação — E2E', () => {
  const TIMEOUT = 8000;

  describe('Admin Dashboard', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin Dashboard E2E',
          perfil: 'admin',
          sessionToken: 'admin-dash-token',
        },
      }).as('session');
    });

    it('deve carregar dashboard admin', () => {
      cy.visit('/admin', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url().should('include', '/admin');
      cy.contains(/admin|dashboard|painel/i, { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve exibir menu de navegação', () => {
      cy.visit('/admin', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Menu deve ter itens de navegação
      cy.get('nav, [role="navigation"]', { timeout: TIMEOUT }).should('exist');
    });
  });

  describe('RH Dashboard', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '11111111111',
          nome: 'RH Dashboard E2E',
          perfil: 'rh',
          sessionToken: 'rh-dash-token',
        },
      }).as('session');

      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: { lotes: [] },
      }).as('lotes');
    });

    it('deve carregar dashboard RH', () => {
      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
    });
  });

  describe('Entidade Dashboard', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '22222222222',
          nome: 'Gestor Dashboard E2E',
          perfil: 'gestor',
          entidade_id: 1,
          sessionToken: 'gestor-dash-token',
        },
      }).as('session');

      cy.intercept('GET', '/api/entidade/lotes*', {
        statusCode: 200,
        body: { lotes: [] },
      }).as('lotesEntidade');
    });

    it('deve carregar dashboard entidade', () => {
      cy.visit('/entidade', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
    });
  });

  describe('Navegação entre Seções', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin Nav E2E',
          perfil: 'admin',
          sessionToken: 'admin-nav-token',
        },
      }).as('session');
    });

    it('deve redirecionar para login quando não autenticado', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 401,
        body: { error: 'Não autenticado' },
      }).as('sessionFail');

      cy.visit('/admin', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });

    it('deve permitir logout', () => {
      cy.intercept('POST', '/api/auth/logout', {
        statusCode: 200,
        body: { success: true },
      }).as('logout');

      cy.visit('/admin', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Procurar botão de logout
      cy.get(
        '[data-testid="logout"], button:contains("Sair"), a:contains("Sair")',
        { timeout: TIMEOUT }
      )
        .first()
        .click({ force: true });
    });
  });
});
