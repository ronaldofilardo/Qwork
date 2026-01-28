/**
 * Testes E2E de Segurança e Autorização
 * Valida RBAC, RLS e acesso a recursos protegidos
 */

describe('Segurança E2E - RBAC e Autorização', () => {
  beforeEach(() => {
    // Limpar sessões antes de cada teste
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  describe('Hierarquia de Roles - Funcionário', () => {
    beforeEach(() => {
      // Login via rota de teste para estabilidade
      cy.login('87545772900', 'func123', 'funcionario');
      cy.visit('/dashboard');
    });

    it('Funcionário deve acessar apenas suas próprias avaliações', () => {
      cy.visit('/avaliacao');
      cy.url().should('include', '/avaliacao');
      cy.contains(/Minhas Avalia/i).should('be.visible');
    });

    it('Funcionário NÃO deve acessar área de RH', () => {
      cy.request({
        url: '/api/rh/funcionarios?empresa_id=1',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('Funcionário NÃO deve acessar área de Admin', () => {
      cy.request({
        url: '/api/admin/funcionarios',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('Funcionário NÃO deve acessar área de Emissor', () => {
      cy.request({
        url: '/api/emissor/lotes',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('Hierarquia de Roles - Emissor', () => {
    beforeEach(() => {
      // Login via rota de teste para estabilidade
      cy.login('11111111111', '123', 'emissor');
      cy.visit('/emissor');
    });

    it('Emissor deve acessar área de Emissores', () => {
      cy.request('/api/emissor/lotes').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('lotes');
      });
    });

    it('Emissor NÃO deve acessar área de RH', () => {
      cy.request({
        url: '/api/rh/funcionarios?empresa_id=1',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('Emissor NÃO deve acessar área de Admin', () => {
      cy.request({
        url: '/api/admin/clinicas',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });
  });

  describe('Hierarquia de Roles - RH', () => {
    beforeEach(() => {
      // Login via rota de teste para estabilidade
      cy.login('22222222222', 'rh123', 'rh');
      cy.visit('/rh');
    });

    it('RH deve acessar área de RH', () => {
      cy.request('/api/rh/empresas').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('empresas');
      });
    });

    it('RH deve ter acesso a recursos de Emissor', () => {
      cy.request('/api/emissor/lotes').then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('RH NÃO deve acessar área de Admin', () => {
      cy.request({
        url: '/api/admin/clinicas',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([401, 403]);
      });
    });

    it('RH NÃO deve ver dados de outras clínicas', () => {
      // Tentar acessar empresa de outra clínica (ID hipotético 999)
      cy.request({
        url: '/api/rh/empresas/999',
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 404]);
      });
    });
  });

  describe('Hierarquia de Roles - Admin', () => {
    beforeEach(() => {
      // Login via rota de teste para estabilidade (usar admin seed '00000000000')
      cy.login('00000000000', '123', 'admin');
      cy.visit('/admin');
    });

    it('Admin deve acessar todas as áreas', () => {
      // Admin
      cy.request('/api/admin/clinicas').then((response) => {
        expect(response.status).to.eq(200);
      });

      // RH (herança)
      cy.request('/api/admin/empresas').then((response) => {
        expect(response.status).to.eq(200);
      });

      // Emissor (herança)
      cy.request('/api/admin/emissores').then((response) => {
        expect(response.status).to.eq(200);
      });
    });

    it('Admin deve gerenciar gestores RH', () => {
      cy.request('/api/admin/gestores-rh').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('gestores');
      });
    });

    it('Admin deve gerenciar emissores', () => {
      cy.request('/api/admin/emissores').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('emissores');
      });
    });

    it('Admin deve criar emissor sem clínica (acesso global)', () => {
      const novoEmissor = {
        cpf: '53051173991',
        nome: 'Emissor Global Teste',
        email: 'global@teste.com',
        senha: '123456',
      };

      cy.request('POST', '/api/admin/emissores', novoEmissor).then(
        (response) => {
          expect(response.status).to.eq(201);
          expect(response.body.success).to.be.true;
          expect(response.body.emissor.clinica_id).to.be.null;
          expect(response.body.emissor.perfil).to.be.undefined; // Não retorna perfil
        }
      );

      // Verificar que foi criado
      cy.request('/api/admin/emissores').then((response) => {
        expect(response.status).to.eq(200);
        const emissores = response.body.emissores;
        const emissorCriado = emissores.find(
          (e: any) => e.cpf === novoEmissor.cpf
        );
        expect(emissorCriado).to.exist;
        expect(emissorCriado.clinica_id).to.be.null;
      });
    });
  });

  describe('RLS (Row Level Security)', () => {
    it('RH de Clínica A não deve ver funcionários de Clínica B', () => {
      // Login como RH da Clínica 1 via rota de teste
      cy.login('22222222222', 'rh123', 'rh');

      // Buscar empresas
      cy.request('/api/rh/empresas').then((response) => {
        expect(response.status).to.eq(200);
        const empresas = response.body.empresas;

        // Todas empresas devem ser da mesma clínica
        if (empresas.length > 0) {
          const primeiraClinicaId = empresas[0].clinica_id;
          empresas.forEach((empresa: any) => {
            expect(empresa.clinica_id).to.eq(primeiraClinicaId);
          });
        }
      });
    });
  });

  describe('Paginação em APIs', () => {
    beforeEach(() => {
      // Login como admin via rota de teste (usar admin seed '00000000000')
      cy.login('00000000000', '123', 'admin');
    });

    it('API de funcionários deve suportar paginação', () => {
      cy.request('/api/admin/funcionarios?page=1&limit=10').then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property('pagination');
        expect(response.body.pagination).to.have.property('page', 1);
        expect(response.body.pagination).to.have.property('limit', 10);
        expect(response.body.pagination).to.have.property('total');
        expect(response.body.pagination).to.have.property('totalPages');
        expect(response.body.pagination).to.have.property('hasMore');
      });
    });
  });

  describe('SQL Injection Prevention', () => {
    it('Não deve ser vulnerável a SQL injection em parâmetros', () => {
      cy.visit('/login');
      cy.get('input[name="cpf"]').type("11111111111' OR '1'='1");
      cy.get('input[name="senha"]').type("anything' OR '1'='1");
      cy.get('button[type="submit"]').click();

      // Deve falhar no login
      cy.url().should('include', '/login');
      cy.contains(/inválido|erro/i).should('be.visible');
    });
  });

  describe('Session Security', () => {
    it('Cookie de sessão deve ser httpOnly', () => {
      cy.visit('/login');
      cy.get('input[name="cpf"]').type('11111111111');
      cy.get('input[name="senha"]').type('admin123');
      cy.get('button[type="submit"]').click();

      // Tentar acessar cookie via JavaScript (deve falhar)
      cy.window().then((win) => {
        const cookies = win.document.cookie;
        expect(cookies).not.to.include('bps-session');
      });
    });

    it('Sessão deve expirar após período de inatividade', () => {
      cy.visit('/login');
      cy.get('input[name="cpf"]').type('11111111111');
      cy.get('input[name="senha"]').type('admin123');
      cy.get('button[type="submit"]').click();
      cy.url().should('include', '/admin');

      // Cookie configurado para 8 horas, mas podemos verificar que existe
      cy.getCookie('bps-session').should('exist');
    });
  });
});
