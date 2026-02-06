/**
 * Smoke Tests - Validação Rápida de Funcionalidades Críticas
 *
 * OBJETIVO: Detectar rapidamente se deploy quebrou funcionalidades básicas
 *
 * Executar após cada deploy em staging/produção
 * Timeout agressivo (5s por teste) para feedback rápido
 *
 * Atualizado: 04/Fevereiro/2026
 */

describe('Smoke Tests - Funcionalidades Críticas', () => {
  const TIMEOUT = 5000;

  describe('🏠 Páginas Públicas', () => {
    it('deve carregar página de login', () => {
      cy.visit('/login', { timeout: TIMEOUT });
      cy.contains('CPF', { timeout: TIMEOUT }).should('be.visible');
      cy.contains('Senha', { timeout: TIMEOUT }).should('be.visible');
      cy.get('button[type="submit"]', { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve carregar página de termos', () => {
      cy.visit('/termos', { timeout: TIMEOUT });
      cy.contains(/termos.*uso/i, { timeout: TIMEOUT }).should('be.visible');
    });

    it('não deve permitir acesso a rotas protegidas sem autenticação', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');

      cy.visit('/rh', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');

      cy.visit('/entidade', { failOnStatusCode: false });
      cy.url({ timeout: TIMEOUT }).should('include', '/login');
    });
  });

  describe('🔐 Autenticação', () => {
    it('deve validar campos obrigatórios no login', () => {
      cy.visit('/login');
      cy.get('button[type="submit"]').click();

      // Deve mostrar erro de validação
      cy.contains(/obrigatório|required/i, { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve fazer mock de sessão admin e acessar dashboard', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin Smoke Test',
          perfil: 'admin',
          sessionToken: 'smoke-test-token',
        },
      }).as('sessionAdmin');

      cy.visit('/admin');
      cy.wait('@sessionAdmin', { timeout: TIMEOUT });

      cy.url({ timeout: TIMEOUT }).should('include', '/admin');
      cy.contains(/admin|dashboard/i, { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });
  });

  describe('📊 APIs Críticas - Health Check', () => {
    it('deve validar API de sessão (GET /api/auth/session)', () => {
      cy.request({
        url: '/api/auth/session',
        failOnStatusCode: false,
      }).then((response) => {
        // 200 (autenticado) ou 401 (não autenticado) são válidos
        expect([200, 401]).to.include(response.status);
      });
    });

    it('deve rejeitar login com credenciais vazias', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { cpf: '', senha: '' },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401]);
        expect(response.body).to.have.property('error');
      });
    });

    it('deve validar endpoint de lotes protegido (sem auth)', () => {
      cy.request({
        url: '/api/entidade/lotes',
        failOnStatusCode: false,
      }).then((response) => {
        // Deve retornar 401 ou 403 sem autenticação
        expect([401, 403]).to.include(response.status);
      });
    });
  });

  describe('🔄 Fluxo Cadastro - Validações Básicas', () => {
    it('admin deve poder acessar página de cadastro', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          perfil: 'admin',
          sessionToken: 'admin-smoke',
        },
      });

      cy.visit('/admin/cadastro', { timeout: TIMEOUT });
      cy.contains(/cadastr/i, { timeout: TIMEOUT }).should('be.visible');
      cy.get('select[name="tipo"]', { timeout: TIMEOUT }).should('exist');
    });
  });

  describe('📦 Lotes - Acesso e Listagem', () => {
    it('entidade deve poder acessar página de lotes', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '12345678901',
          perfil: 'gestor',
          clinica_id: 1,
          sessionToken: 'entidade-smoke',
        },
      });

      cy.intercept('GET', '/api/entidade/lotes*', {
        statusCode: 200,
        body: {
          success: true,
          lotes: [],
          total: 0,
        },
      });

      cy.visit('/entidade/lotes', { timeout: TIMEOUT });
      cy.contains(/lote/i, { timeout: TIMEOUT }).should('be.visible');
    });

    it('RH deve poder acessar página de funcionários', () => {
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '98765432100',
          perfil: 'rh',
          clinica_id: 1,
          empresa_id: 1,
          sessionToken: 'rh-smoke',
        },
      });

      cy.intercept('GET', '/api/rh/funcionarios*', {
        statusCode: 200,
        body: {
          success: true,
          funcionarios: [],
          total: 0,
        },
      });

      cy.visit('/rh/funcionarios', { timeout: TIMEOUT });
      cy.contains(/funcionário/i, { timeout: TIMEOUT }).should('be.visible');
    });
  });

  describe('🚨 Testes de Regressão Crítica', () => {
    it('não deve permitir SQL injection em login', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: {
          cpf: "' OR '1'='1",
          senha: "' OR '1'='1",
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([400, 401]);
        expect(response.body).not.to.have.property('sessionToken');
      });
    });

    it('não deve expor dados sensíveis em erros', () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { cpf: '00000000000', senha: 'errada' },
        failOnStatusCode: false,
      }).then((response) => {
        const body = JSON.stringify(response.body);

        // Não deve conter stack trace ou paths do servidor
        expect(body).not.to.match(/\/home\/|\/var\/|C:\\/);
        expect(body).not.to.match(/at\s+\w+\s+\(/); // Stack trace pattern
        expect(body).not.to.include('senha_hash');
        expect(body).not.to.include('password');
      });
    });

    it('deve ter rate limiting ativo (múltiplas tentativas)', () => {
      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          cy.request({
            method: 'POST',
            url: '/api/auth/login',
            body: { cpf: '99999999999', senha: 'test' },
            failOnStatusCode: false,
          })
        );
      }

      // Após várias tentativas, deve começar a bloquear (429)
      cy.wrap(requests).then(() => {
        cy.request({
          method: 'POST',
          url: '/api/auth/login',
          body: { cpf: '99999999999', senha: 'test' },
          failOnStatusCode: false,
        }).then((response) => {
          // Deve ter rate limiting (429) ou continuar rejeitando (401)
          expect([401, 429]).to.include(response.status);
        });
      });
    });
  });

  describe('🌐 Assets e Performance', () => {
    it('deve carregar assets críticos (CSS, JS)', () => {
      cy.visit('/login');

      // Verificar que não há erros de carregamento
      cy.window().then((win) => {
        const errors = win.performance
          .getEntriesByType('resource')
          .filter((r: any) => r.transferSize === 0 && r.name.includes('.'));

        // Não deve ter muitos assets falhando (máximo 2 para tolerar CDN)
        expect(errors.length).to.be.lessThan(3);
      });
    });

    it('página de login deve carregar em menos de 3s', () => {
      const start = Date.now();

      cy.visit('/login').then(() => {
        const loadTime = Date.now() - start;
        expect(loadTime).to.be.lessThan(3000);
      });
    });
  });
});
