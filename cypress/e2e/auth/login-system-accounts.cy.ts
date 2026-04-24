/**
 * @file cypress/e2e/auth/login-system-accounts.cy.ts
 * Testes E2E: Login de contas de sistema (suporte, comercial)
 * 
 * Valida o fluxo completo de login para Amanda (suporte) e Talita Parteka (comercial)
 */

describe('Login - Contas de Sistema (E2E)', () => {
  const AMANDA = { cpf: '09777228996', senha: '123456', nome: 'Amanda', tipo: 'suporte' };
  const TALITA = { cpf: '04256059903', senha: '123456', nome: 'Talita Parteka', tipo: 'comercial' };

  beforeEach(() => {
    // Navegar para página de login
    cy.visit('/login');
    cy.url().should('include', '/login');
  });

  describe('Login - Amanda (Suporte)', () => {
    it('deve fazer login com sucesso', () => {
      // Preencher formulário
      cy.get('input[name="cpf"]').type(AMANDA.cpf);
      cy.get('input[name="senha"]').type(AMANDA.senha);
      
      // Submeter
      cy.get('button[type="submit"]').click();
      
      // Validar redirecionamento (não deve ficar em /login)
      cy.url().should('not.include', '/login');
      cy.url().should('not.match', /\/login\/?$/);
    });

    it('deve exibir erro com CPF ou senha inválidos', () => {
      // Tentar com senha errada
      cy.get('input[name="cpf"]').type(AMANDA.cpf);
      cy.get('input[name="senha"]').type('senhaerrada');
      
      cy.get('button[type="submit"]').click();
      
      // Validar mensagem de erro
      cy.contains(/CPF ou senha inv[á]lido/i).should('be.visible');
    });

    it('deve exibir erro com CPF inválido', () => {
      cy.get('input[name="cpf"]').type('99999999999');
      cy.get('input[name="senha"]').type(AMANDA.senha);
      
      cy.get('button[type="submit"]').click();
      
      cy.contains(/CPF ou senha inv[á]lido/i).should('be.visible');
    });
  });

  describe('Login - Talita (Comercial)', () => {
    it('deve fazer login com sucesso', () => {
      cy.get('input[name="cpf"]').type(TALITA.cpf);
      cy.get('input[name="senha"]').type(TALITA.senha);
      
      cy.get('button[type="submit"]').click();
      
      cy.url().should('not.include', '/login');
      cy.url().should('not.match', /\/login\/?$/);
    });

    it('deve exibir erro com CPF ou senha inválidos', () => {
      cy.get('input[name="cpf"]').type(TALITA.cpf);
      cy.get('input[name="senha"]').type('senhaerrada');
      
      cy.get('button[type="submit"]').click();
      
      cy.contains(/CPF ou senha inv[á]lido/i).should('be.visible');
    });
  });

  describe('Validações de campo', () => {
    it('deve exigir CPF', () => {
      cy.get('input[name="senha"]').type('123456');
      cy.get('button[type="submit"]').click();
      
      // Validação nativa do HTML5 ou mensagem customizada
      cy.contains(/obrigat[ó]rio|requerido|CPF/i).should('exist');
    });

    it('deve exigir senha ou data de nascimento', () => {
      cy.get('input[name="cpf"]').type(AMANDA.cpf);
      cy.get('button[type="submit"]').click();
      
      cy.contains(/obrigat[ó]rio|requerido|senha|nascimento/i).should('exist');
    });
  });

  describe('Rate limiting', () => {
    it('deve bloquear após múltiplas tentativas falhas', () => {
      // Simular 5+ tentativas com CPF/senha errados
      for (let i = 0; i < 5; i++) {
        cy.get('input[name="cpf"]').clear().type('09777228996');
        cy.get('input[name="senha"]').clear().type(`senhaerrada${i}`);
        cy.get('button[type="submit"]').click();
        
        // Aguardar antes da próxima tentativa
        cy.wait(200);
      }
      
      // Validar que foi bloqueado
      cy.contains(/rate limit|muitas tentativas|bloqueado/i).should('be.visible');
    });
  });

  describe('Persistência de sessão', () => {
    it('Amanda deve permanecer logada após redirecionar', () => {
      // Fazer login
      cy.get('input[name="cpf"]').type(AMANDA.cpf);
      cy.get('input[name="senha"]').type(AMANDA.senha);
      cy.get('button[type="submit"]').click();
      
      // Esperar redirecionamento
      cy.url().should('not.include', '/login');
      
      // Navegar para outra rota e voltar
      cy.visit('/dashboard');
      cy.url().should('include', '/dashboard');
      
      // Não deve ser redirecionado para login
      cy.url().should('not.include', '/login');
    });
  });
});
