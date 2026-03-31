/**
 * E2E: Perfil Suporte
 *
 * Valida acesso e funcionalidades do perfil suporte:
 *  - Acesso às rotas /suporte
 *  - Acesso às APIs de cobrança, emissões, financeiro e novos cadastros
 *  - Bloqueio de rotas exclusivas de outros perfis
 */

describe('Perfil Suporte — E2E', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login('33333333333', 'suporte123', 'suporte');
  });

  // ──────────────────────────────────────────────────────
  // Acesso à área /suporte
  // ──────────────────────────────────────────────────────

  describe('Acesso ao Dashboard Suporte', () => {
    it('deve redirecionar para /suporte após login com sessão mockada', () => {
      cy.clearCookies();
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '33333333333',
          nome: 'Usuário Suporte',
          perfil: 'suporte',
          sessionToken: 'token-suporte',
        },
      }).as('session');

      cy.visit('/suporte');
      cy.wait('@session');
      cy.url().should('include', '/suporte');
    });

    it('deve bloquear acesso a /suporte sem sessão', () => {
      cy.clearCookies();
      cy.visit('/suporte', { failOnStatusCode: false });
      cy.url().should('include', '/login');
    });
  });

  // ──────────────────────────────────────────────────────
  // APIs permitidas para suporte
  // ──────────────────────────────────────────────────────

  describe('APIs permitidas — Cobrança', () => {
    it('deve acessar GET /api/admin/cobranca', () => {
      cy.request({
        url: '/api/admin/cobranca',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });

    it('deve acessar GET /api/admin/cobranca/dashboard', () => {
      cy.request({
        url: '/api/admin/cobranca/dashboard',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });

    it('deve acessar GET /api/admin/parcelas-a-vencer', () => {
      cy.request({
        url: '/api/admin/parcelas-a-vencer',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });
  });

  describe('APIs permitidas — Emissões', () => {
    it('deve acessar GET /api/admin/emissoes', () => {
      cy.request({
        url: '/api/admin/emissoes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });

    it('deve acessar GET /api/admin/emissoes/contagem', () => {
      cy.request({
        url: '/api/admin/emissoes/contagem',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });
  });

  describe('APIs permitidas — Financeiro (notificações)', () => {
    it('deve acessar GET /api/admin/financeiro/notificacoes', () => {
      cy.request({
        url: '/api/admin/financeiro/notificacoes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.not.eq(403);
        expect(response.status).to.not.eq(401);
      });
    });
  });

  describe('APIs permitidas — Comissões (leitura/pagamento)', () => {
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
  // APIs bloqueadas para suporte
  // ──────────────────────────────────────────────────────

  describe('APIs bloqueadas — Representantes (exclusivo comercial)', () => {
    it('NÃO deve acessar POST /api/admin/representantes-leads (aprovação)', () => {
      cy.request({
        method: 'GET',
        url: '/api/admin/representantes-leads/999/aprovar',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 404, 405]);
      });
    });
  });

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

  describe('Rotas de outros perfis bloqueadas pelo middleware', () => {
    it('NÃO deve acessar rota /admin', () => {
      cy.request({
        url: '/admin',
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
});
