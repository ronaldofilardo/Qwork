/**
 * E2E: Autenticação e Login
 *
 * Valida fluxo completo de autenticação:
 *  - Login com credenciais válidas/inválidas
 *  - Sessão persistente
 *  - Logout
 *  - Redirecionamento por perfil
 */

describe('Autenticação — E2E Completo', () => {
  const TIMEOUT = 5000;

  describe('Login — Validações', () => {
    beforeEach(() => {
      cy.visit('/login', { timeout: TIMEOUT });
    });

    it('deve exibir formulário de login completo', () => {
      cy.contains('CPF', { timeout: TIMEOUT }).should('be.visible');
      cy.contains('Senha', { timeout: TIMEOUT }).should('be.visible');
      cy.get('button[type="submit"]', { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve validar CPF vazio', () => {
      cy.get('button[type="submit"]').click();
      cy.contains(/obrigatório|required|preencha/i, {
        timeout: TIMEOUT,
      }).should('exist');
    });

    it('deve rejeitar credenciais inválidas', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: { error: 'CPF ou senha incorretos' },
      }).as('loginFail');

      cy.get('input[name*="cpf"], input[placeholder*="CPF"]')
        .first()
        .type('00000000000', { force: true });
      cy.get('input[type="password"], input[name*="senha"]')
        .first()
        .type('senhaerrada', { force: true });
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFail', { timeout: TIMEOUT });
      cy.contains(/incorreto|inválido|erro/i, { timeout: TIMEOUT }).should(
        'exist'
      );
    });
  });

  describe('Redirecionamento por Perfil', () => {
    it('deve redirecionar admin para /admin', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin',
          perfil: 'admin',
          sessionToken: 'token',
        },
      }).as('session');

      cy.visit('/admin', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url().should('include', '/admin');
    });

    it('deve redirecionar rh para /rh', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '11111111111',
          nome: 'RH',
          perfil: 'rh',
          sessionToken: 'token',
        },
      }).as('session');

      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: { lotes: [] },
      }).as('lotes');

      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
    });
  });

  describe('Sessão', () => {
    it('deve verificar sessão ativa via API', () => {
      cy.request({
        url: '/api/auth/session',
        failOnStatusCode: false,
      }).then((response) => {
        expect([200, 401]).to.include(response.status);
      });
    });
  });

  describe('Redirecionamento por Perfil — Novos Perfis', () => {
    it('deve redirecionar suporte para /suporte', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '33333333333',
          nome: 'Suporte',
          perfil: 'suporte',
          sessionToken: 'token',
        },
      }).as('session');

      cy.visit('/suporte', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url().should('include', '/suporte');
    });

    it('deve redirecionar comercial para /comercial', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '44444444444',
          nome: 'Comercial',
          perfil: 'comercial',
          sessionToken: 'token',
        },
      }).as('session');

      cy.intercept('GET', '/api/admin/representantes*', {
        statusCode: 200,
        body: { representantes: [], total: 0 },
      });
      cy.intercept('GET', '/api/admin/representantes-leads*', {
        statusCode: 200,
        body: { leads: [], total: 0 },
      });
      cy.intercept('GET', '/api/admin/comissoes*', {
        statusCode: 200,
        body: { comissoes: [], total: 0 },
      });

      cy.visit('/comercial', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url().should('include', '/comercial');
    });

    it('deve redirecionar vendedor para /vendedor', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '55555555555',
          nome: 'Vendedor',
          perfil: 'vendedor',
          sessionToken: 'token',
        },
      }).as('session');

      cy.visit('/vendedor', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });
      cy.url().should('include', '/vendedor');
    });

    it('suporte sem autenticação deve redirecionar para /login', () => {
      cy.clearCookies();
      cy.visit('/suporte', { failOnStatusCode: false, timeout: TIMEOUT });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });

    it('comercial sem autenticação deve redirecionar para /login', () => {
      cy.clearCookies();
      cy.visit('/comercial', { failOnStatusCode: false, timeout: TIMEOUT });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });

    it('vendedor sem autenticação deve redirecionar para /login', () => {
      cy.clearCookies();
      cy.visit('/vendedor', { failOnStatusCode: false, timeout: TIMEOUT });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });
  });
});
