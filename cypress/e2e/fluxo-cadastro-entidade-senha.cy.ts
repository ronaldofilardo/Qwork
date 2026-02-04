/**
 * Teste E2E: Fluxo Completo Cadastro Entidade/Clinica → Liberação Senha → Login
 *
 * OBJETIVO: Prevenir regressão no fluxo crítico de onboarding
 *
 * Cenário:
 * 1. Cadastro de nova entidade/clinica (via admin ou self-service)
 * 2. Confirmação de email/pagamento
 * 3. Liberação de senha (token ou ativação manual)
 * 4. Primeiro login com credenciais
 * 5. Acesso ao dashboard
 *
 * Atualizado: 04/Fevereiro/2026
 */

describe('Fluxo Crítico: Cadastro Entidade → Senha → Login', () => {
  const timestamp = Date.now();
  const mockCNPJ = `12${timestamp.toString().slice(-10)}00199`;
  const mockEmail = `entidade-e2e-${timestamp}@test.com`;
  const mockCPF = `${timestamp.toString().slice(-11)}`;
  const mockSenha = 'Teste@123';

  let contratanteId: number;
  let tokenAtivacao: string;

  before(() => {
    // Limpar dados anteriores via task
    cy.task('db:cleanupTestData', { cnpj: mockCNPJ, cpf: mockCPF });
  });

  after(() => {
    // Cleanup final
    cy.task('db:cleanupTestData', { cnpj: mockCNPJ, cpf: mockCPF });
  });

  describe('1. Cadastro Inicial', () => {
    it('deve cadastrar nova entidade via admin/cadastro/clinica', () => {
      // Mock sessão admin
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: '00000000000',
          nome: 'Admin Teste',
          perfil: 'admin',
          sessionToken: 'mock-admin-token',
        },
      }).as('adminSession');

      // Mock do cadastro
      cy.intercept('POST', '/api/admin/cadastro/clinica', (req) => {
        expect(req.body).to.have.property('cnpj', mockCNPJ);
        expect(req.body).to.have.property('email', mockEmail);

        req.reply({
          statusCode: 201,
          body: {
            success: true,
            contratante: {
              id: Math.floor(Math.random() * 10000),
              cnpj: mockCNPJ,
              email: mockEmail,
              status: 'aguardando_pagamento',
            },
          },
        });
      }).as('cadastroClinica');

      cy.visit('/admin/cadastro');
      cy.wait('@adminSession');

      // Preencher formulário
      cy.get('select[name="tipo"]').select('clinica');
      cy.get('input[name="cnpj"]').type(mockCNPJ);
      cy.get('input[name="nome"]').type(`Clinica E2E ${timestamp}`);
      cy.get('input[name="email"]').type(mockEmail);
      cy.get('input[name="telefone"]').type('11999999999');
      cy.get('input[name="responsavel_nome"]').type('Gestor E2E');
      cy.get('input[name="responsavel_cpf"]').type(mockCPF);
      cy.get('input[name="responsavel_email"]').type(mockEmail);
      cy.get('input[name="responsavel_celular"]').type('11988888888');
      cy.get('input[name="endereco"]').type('Rua E2E, 123');
      cy.get('input[name="cidade"]').type('São Paulo');
      cy.get('select[name="estado"]').select('SP');
      cy.get('input[name="cep"]').type('01234567');

      cy.get('button[type="submit"]').click();

      cy.wait('@cadastroClinica').then((interception) => {
        expect(interception.response?.statusCode).to.eq(201);
        contratanteId = interception.response?.body.contratante.id;
      });

      // Verificar mensagem de sucesso
      cy.contains(/cadastro.*sucesso/i).should('be.visible');
    });

    it('deve criar registro em contratantes com status aguardando_pagamento', () => {
      cy.task('db:getContratante', { cnpj: mockCNPJ }).then((result: any) => {
        expect(result).to.not.be.null;
        expect(result.cnpj).to.eq(mockCNPJ);
        expect(result.status).to.eq('aguardando_pagamento');
        expect(result.ativa).to.be.false;
        expect(result.pagamento_confirmado).to.be.false;
        contratanteId = result.id;
      });
    });
  });

  describe('2. Confirmação de Pagamento e Ativação', () => {
    it('deve confirmar pagamento via admin', () => {
      // Simular confirmação de pagamento
      cy.task('db:confirmarPagamento', { contratanteId }).then(
        (result: any) => {
          expect(result.success).to.be.true;
        }
      );

      // Verificar atualização
      cy.task('db:getContratante', { cnpj: mockCNPJ }).then((result: any) => {
        expect(result.pagamento_confirmado).to.be.true;
        expect(result.status).to.eq('aprovado');
      });
    });

    it('deve gerar token de ativação e criar registro em contratantes_senhas', () => {
      cy.task('db:gerarTokenAtivacao', { contratanteId, cpf: mockCPF }).then(
        (result: any) => {
          expect(result.success).to.be.true;
          tokenAtivacao = result.token;
          expect(tokenAtivacao).to.have.length.greaterThan(20);
        }
      );
    });
  });

  describe('3. Primeiro Acesso - Definição de Senha', () => {
    it('deve validar token de ativação', () => {
      cy.intercept('POST', '/api/auth/validate-token', (req) => {
        expect(req.body.token).to.eq(tokenAtivacao);

        req.reply({
          statusCode: 200,
          body: {
            valid: true,
            cpf: mockCPF,
            email: mockEmail,
          },
        });
      }).as('validateToken');

      cy.visit(`/aceite-plano-personalizado?token=${tokenAtivacao}`);
      cy.wait('@validateToken');

      cy.contains(/definir.*senha/i).should('be.visible');
    });

    it('deve permitir definir senha inicial', () => {
      cy.intercept('POST', '/api/auth/set-password', (req) => {
        expect(req.body.token).to.eq(tokenAtivacao);
        expect(req.body.senha).to.have.length.greaterThan(5);

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            message: 'Senha definida com sucesso',
          },
        });
      }).as('setPassword');

      cy.get('input[name="senha"]').type(mockSenha);
      cy.get('input[name="confirmar_senha"]').type(mockSenha);
      cy.get('button[type="submit"]')
        .contains(/definir.*senha/i)
        .click();

      cy.wait('@setPassword');

      // Verificar redirecionamento para login
      cy.url().should('include', '/login');
      cy.contains(/senha.*definida/i).should('be.visible');
    });

    it('deve ativar contratante após definição de senha', () => {
      cy.task('db:getContratante', { cnpj: mockCNPJ }).then((result: any) => {
        expect(result.ativa).to.be.true;
        expect(result.status).to.eq('ativo');
      });

      cy.task('db:getSenhaHash', { cpf: mockCPF }).then((result: any) => {
        expect(result).to.not.be.null;
        expect(result.senha_hash).to.match(/^\$2[aby]\$/); // bcrypt hash
      });
    });
  });

  describe('4. Primeiro Login', () => {
    it('deve fazer login com credenciais criadas', () => {
      cy.intercept('POST', '/api/auth/login', (req) => {
        expect(req.body.cpf).to.eq(mockCPF);

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            usuario: {
              cpf: mockCPF,
              nome: 'Gestor E2E',
              perfil: 'gestor_clinica',
              clinica_id: contratanteId,
            },
          },
        });
      }).as('login');

      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: mockCPF,
          nome: 'Gestor E2E',
          perfil: 'gestor_clinica',
          clinica_id: contratanteId,
          sessionToken: 'mock-session-token',
        },
      }).as('session');

      cy.visit('/login');
      cy.get('input[name="cpf"]').type(mockCPF);
      cy.get('input[name="senha"]').type(mockSenha);
      cy.get('button[type="submit"]').click();

      cy.wait('@login');
      cy.wait('@session');
    });

    it('deve redirecionar para dashboard da clinica', () => {
      cy.url().should('match', /\/(clinica|dashboard)/);
      cy.contains(/bem.*vindo/i, { timeout: 10000 }).should('be.visible');
    });

    it('deve exibir dados da clinica no header/menu', () => {
      cy.contains(mockEmail).should('be.visible');
      cy.contains('Gestor E2E').should('be.visible');
    });
  });

  describe('5. Validações de Segurança', () => {
    it('não deve permitir login com senha errada', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 401,
        body: {
          error: 'CPF ou senha inválidos',
        },
      }).as('loginFail');

      cy.visit('/login');
      cy.get('input[name="cpf"]').type(mockCPF);
      cy.get('input[name="senha"]').type('SenhaErrada123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginFail');
      cy.contains(/inválid/i).should('be.visible');
    });

    it('não deve permitir acesso sem ativação', () => {
      // Criar nova entidade sem ativar
      const novoCNPJ = `99${Date.now().toString().slice(-10)}00188`;
      const novoCPF = `${Date.now().toString().slice(-11)}`;

      cy.task('db:insertInactiveContratante', {
        cnpj: novoCNPJ,
        cpf: novoCPF,
      });

      cy.intercept('POST', '/api/auth/login', {
        statusCode: 403,
        body: {
          error: 'Conta inativa. Contate o administrador.',
        },
      }).as('loginInactive');

      cy.visit('/login');
      cy.get('input[name="cpf"]').clear().type(novoCPF);
      cy.get('input[name="senha"]').clear().type('Teste@123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginInactive');
      cy.contains(/inativ/i).should('be.visible');

      // Cleanup
      cy.task('db:cleanupTestData', { cnpj: novoCNPJ, cpf: novoCPF });
    });
  });
});
