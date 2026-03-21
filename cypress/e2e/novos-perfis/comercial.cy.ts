/**
 * E2E: Perfil Comercial
 *
 * Valida acesso e funcionalidades do perfil comercial:
 *  - Acesso às rotas /comercial e /comercial/representantes
 *  - Acesso às APIs de representantes, leads, comissões-aprovação, vínculos
 *  - Bloqueio de rotas exclusivas de outros perfis
 */

describe('Perfil Comercial — E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login('44444444444', 'comercial123', 'comercial');
  });

  // ──────────────────────────────────────────────────────
  // Acesso ao Dashboard Comercial
  // ──────────────────────────────────────────────────────

  describe('Acesso ao Dashboard Comercial', () => {
    it('deve carregar /comercial com sessão mockada', () => {
      cy.clearCookies();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '44444444444',
          nome: 'Usuário Comercial',
          perfil: 'comercial',
          sessionToken: 'token-comercial',
        },
      }).as('session');

      cy.visit('/comercial');
      cy.wait('@session');
      cy.url().should('include', '/comercial');
    });

    it('deve bloquear acesso a /comercial sem sessão', () => {
      cy.clearCookies();
      cy.visit('/comercial', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });

    it('deve bloquear acesso a /comercial/representantes sem sessão', () => {
      cy.clearCookies();
      cy.visit('/comercial/representantes', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  // ──────────────────────────────────────────────────────
  // APIs permitidas — Representantes
  // ──────────────────────────────────────────────────────

  describe('APIs permitidas — Representantes', () => {
    it('deve acessar GET /api/admin/representantes', () => {
      cy.request({
        url: '/api/admin/representantes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });

    it('deve acessar GET /api/admin/representantes-leads', () => {
      cy.request({
        url: '/api/admin/representantes-leads',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });

    it('deve acessar GET /api/admin/representantes/leads', () => {
      cy.request({
        url: '/api/admin/representantes/leads',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });
  });

  // ──────────────────────────────────────────────────────
  // APIs permitidas — Comissões (aprovação/geração)
  // ──────────────────────────────────────────────────────

  describe('APIs permitidas — Comissões', () => {
    it('deve acessar GET /api/admin/comissoes', () => {
      cy.request({
        url: '/api/admin/comissoes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });
  });

  // ──────────────────────────────────────────────────────
  // APIs bloqueadas para comercial
  // ──────────────────────────────────────────────────────

  describe('APIs bloqueadas — Exclusivas de Admin', () => {
    it('NÃO deve acessar GET /api/admin/emissores', () => {
      cy.request({
        url: '/api/admin/emissores',
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

    it('NÃO deve acessar GET /api/admin/auditorias/acessos-rh', () => {
      cy.request({
        url: '/api/admin/auditorias/acessos-rh',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('APIs bloqueadas — Exclusivas de Suporte (financeiro)', () => {
    it('NÃO deve acessar GET /api/admin/cobranca', () => {
      cy.request({
        url: '/api/admin/cobranca',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('NÃO deve acessar GET /api/admin/parcelas-a-vencer', () => {
      cy.request({
        url: '/api/admin/parcelas-a-vencer',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

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
  // Funcionalidades de UI — Representantes
  // ──────────────────────────────────────────────────────

  describe('UI — Dashboard Comercial (mocked)', () => {
    beforeEach(() => {
      cy.clearCookies();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '44444444444',
          nome: 'Comercial Teste',
          perfil: 'comercial',
          sessionToken: 'token-comercial',
        },
      }).as('session');

      cy.intercept('GET', '/api/admin/representantes*', {
        statusCode: 200,
        body: { representantes: [], total: 0 },
      }).as('representantes');

      cy.intercept('GET', '/api/admin/representantes-leads*', {
        statusCode: 200,
        body: { leads: [], total: 0 },
      }).as('leads');

      cy.intercept('GET', '/api/admin/comissoes*', {
        statusCode: 200,
        body: { comissoes: [], total: 0 },
      }).as('comissoes');
    });

    it('deve exibir dashboard comercial sem erros', () => {
      cy.visit('/comercial');
      cy.wait('@session');
      cy.url().should('include', '/comercial');
    });

    it('deve navegar para lista de representantes', () => {
      cy.visit('/comercial/representantes');
      cy.wait('@session');
      cy.url().should('include', '/comercial/representantes');
    });
  });
});
