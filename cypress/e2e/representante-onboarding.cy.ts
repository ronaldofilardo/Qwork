/**
 * @file cypress/e2e/representante-onboarding.cy.ts
 *
 * E2E: Fluxo completo de onboarding do representante
 *
 * Valida o ciclo completo:
 *  1. Acesso à URL de criação de senha com token válido
 *  2. Preenchimento e submissão do formulário de senha
 *  3. Redirecionamento para /representante/aceitar-contrato
 *  4. Aceite do contrato (clicar em "Li e concordo")
 *  5. Redirecionamento para /login (com msg=termos_aceitos)
 *  6. Login com CPF e senha criada
 *  7. Redirecionamento DIRETO para dashboard (sem tela de trocar senha)
 *  8. Dashboard carregado sem modal de termos
 *
 * Também valida cenários de erro:
 *  - Token expirado → mensagem adequada
 *  - Token já usado → mensagem adequada
 *  - Senha fraca → erros de validação
 */

describe('Representante — Fluxo de Onboarding Completo', () => {
  // ─────────────────────────────────────────────────────────────────
  // Bloco 1: validação do token na tela de criação de senha
  // ─────────────────────────────────────────────────────────────────

  describe('Validação de token', () => {
    it('exibe erro quando token é inválido ou inexistente', () => {
      cy.intercept('GET', '/api/representante/criar-senha*', {
        statusCode: 400,
        body: { valido: false, motivo: 'token_invalido' },
      }).as('validarToken');

      cy.visit(
        '/representante/criar-senha?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );
      cy.wait('@validarToken');

      cy.contains(/inválido|expirado|não encontrado/i).should('be.visible');
    });

    it('exibe mensagem de link expirado', () => {
      cy.intercept('GET', '/api/representante/criar-senha*', {
        statusCode: 400,
        body: { valido: false, motivo: 'token_expirado' },
      }).as('validarToken');

      cy.visit(
        '/representante/criar-senha?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );
      cy.wait('@validarToken');

      cy.contains(/expirado/i).should('be.visible');
    });

    it('exibe mensagem de link já utilizado', () => {
      cy.intercept('GET', '/api/representante/criar-senha*', {
        statusCode: 400,
        body: { valido: false, motivo: 'token_ja_usado' },
      }).as('validarToken');

      cy.visit(
        '/representante/criar-senha?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );
      cy.wait('@validarToken');

      cy.contains(/já foi utilizado|já usado/i).should('be.visible');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Bloco 2: validação de senha no formulário
  // ─────────────────────────────────────────────────────────────────

  describe('Validação de senha no formulário', () => {
    beforeEach(() => {
      cy.intercept('GET', '/api/representante/criar-senha*', {
        statusCode: 200,
        body: { valido: true, nome: 'Rep Teste E2E', email: 'rep@test.com' },
      }).as('validarToken');

      cy.visit(
        '/representante/criar-senha?token=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );
      cy.wait('@validarToken');
    });

    it('exibe erro se senha for muito curta', () => {
      cy.intercept('POST', '/api/representante/criar-senha', {
        statusCode: 400,
        body: { error: 'Senha deve ter pelo menos 8 caracteres' },
      }).as('criarSenha');

      cy.get('input[type="password"]').first().type('Ab1!');
      cy.get('input[type="password"]').last().type('Ab1!');
      cy.get('button[type="submit"]').click();

      cy.wait('@criarSenha');
      cy.contains(/8 caracteres/i).should('be.visible');
    });

    it('exibe erro se senha não tiver maiúscula', () => {
      cy.intercept('POST', '/api/representante/criar-senha', {
        statusCode: 400,
        body: { error: 'Senha deve conter pelo menos uma letra maiúscula' },
      }).as('criarSenha');

      cy.get('input[type="password"]').first().type('semmaius1!');
      cy.get('input[type="password"]').last().type('semmaius1!');
      cy.get('button[type="submit"]').click();

      cy.wait('@criarSenha');
      cy.contains(/maiúscula/i).should('be.visible');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Bloco 3: fluxo completo (happy path) com mocks
  // ─────────────────────────────────────────────────────────────────

  describe('Fluxo completo — happy path', () => {
    const token = 'a'.repeat(64);
    const cpf = '12345678901';
    const senha = 'Senha123!';

    it('cria senha → aceita contrato → faz login → acessa dashboard sem loop', () => {
      // Passo 1: validar token
      cy.intercept('GET', '/api/representante/criar-senha*', {
        statusCode: 200,
        body: { valido: true, nome: 'Rep Teste E2E', email: 'rep@test.com' },
      }).as('validarToken');

      // Passo 2: criar senha (sucesso)
      cy.intercept('POST', '/api/representante/criar-senha', {
        statusCode: 200,
        body: {
          success: true,
          message:
            'Senha criada com sucesso! Aceite o contrato e termos para continuar.',
        },
      }).as('criarSenha');

      cy.visit(`/representante/criar-senha?token=${token}`);
      cy.wait('@validarToken');

      cy.get('input[type="password"]').first().type(senha);
      cy.get('input[type="password"]').last().type(senha);
      cy.get('button[type="submit"]').click();
      cy.wait('@criarSenha');

      // Passo 3: redireciona para aceitar-contrato
      cy.url().should('include', '/representante/aceitar-contrato');

      // Passo 4: mockar endpoint de sessão para aceitar-contrato page
      cy.intercept('GET', '/api/representante/me', {
        statusCode: 200,
        body: {
          id: 42,
          nome: 'Rep Teste E2E',
          email: 'rep@test.com',
          status: 'apto',
          perfil: 'representante',
          precisa_trocar_senha: false,
          aceite_politica_privacidade: false,
        },
      }).as('getMe');

      // Passo 5: aceitar termos (clicar em "Li e concordo")
      cy.intercept('POST', '/api/representante/aceitar-termos', {
        statusCode: 200,
        body: { success: true },
      }).as('aceitarTermos');

      cy.wait('@getMe');

      // Rolar o modal até o fim e clicar em aceitar
      cy.get('button')
        .contains(/Li e concordo|aceito|concordo/i)
        .click({ force: true });

      // Passo 6: redireciona para /login
      cy.url().should('include', '/login');

      // Passo 7: fazer login
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          perfil: 'representante',
          precisa_trocar_senha: false,
        },
      }).as('login');

      cy.get(
        'input[name="cpf"], input[placeholder*="CPF"], input[id*="cpf"]'
      ).type(cpf);
      cy.get('input[type="password"]').type(senha);
      cy.get('button[type="submit"]').click();
      cy.wait('@login');

      // Passo 8: dashboard carregado — sem redirect para trocar-senha
      cy.url().should('include', '/representante');
      cy.url().should('not.include', '/trocar-senha');
    });
  });

  // ─────────────────────────────────────────────────────────────────
  // Bloco 4: dashboard sem modal de termos após aceite
  // ─────────────────────────────────────────────────────────────────

  describe('Dashboard após onboarding concluído', () => {
    beforeEach(() => {
      // Simular sessão já com todos os aceites e senha alterada
      cy.intercept('GET', '/api/representante/me', {
        statusCode: 200,
        body: {
          id: 42,
          nome: 'Rep Teste E2E',
          email: 'rep@test.com',
          status: 'apto',
          perfil: 'representante',
          precisa_trocar_senha: false,
          aceite_politica_privacidade: true,
          aceite_termos: true,
          aceite_disclaimer_nv: true,
        },
      }).as('getMe');
    });

    it('não exibe modal de termos quando todos os aceites estão completos', () => {
      cy.visit('/representante/painel');
      cy.wait('@getMe');

      cy.get('[data-testid="modal-termos"]').should('not.exist');
      cy.get('dialog').should('not.exist');
    });

    it('não redireciona para trocar-senha quando primeira_senha_alterada=TRUE', () => {
      cy.visit('/representante/painel');
      cy.url().should('not.include', '/trocar-senha');
    });
  });
});
