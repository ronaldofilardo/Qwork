/**
 * Teste E2E: Fluxo completo do funcionário
 * Item 16: Login → avaliação → recarregar → continuar
 */

describe('Funcionário - Fluxo Completo de Avaliação', () => {
  const funcionarioCPF = '22222222222';
  const funcionarioSenha = '123';

  beforeEach(() => {
    // Limpar cookies e localStorage
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('deve completar o fluxo: login → dashboard → iniciar avaliação', () => {
    // 1. Login
    cy.visit('/login');
    cy.get('input[name="cpf"]').type(funcionarioCPF);
    cy.get('input[name="senha"]').type(funcionarioSenha);
    cy.get('button[type="submit"]').click();

    // 2. Deve redirecionar para dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');

    // 3. Verificar se há avaliação disponível
    cy.contains(/iniciar|continuar/i, { timeout: 5000 }).should('be.visible');
    cy.contains(/iniciar|continuar/i).click();

    // 4. Deve abrir página de avaliação
    cy.url().should('include', '/avaliacao');
    cy.contains(/de 37/, { timeout: 10000 }).should('be.visible');
  });

  it('deve responder questões e salvar automaticamente', () => {
    // Login
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    // Verificar que está na primeira questão
    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    // Responder primeira questão (clicar em uma opção)
    cy.get('input[type="radio"]').first().click();

    // Verificar que progresso foi atualizado
    cy.contains('1 de 37', { timeout: 5000 }).should('be.visible');

    // Responder segunda questão
    cy.get('input[type="radio"]').first().click();
    cy.contains('2 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve retomar avaliação após recarregar página', () => {
    // Login e iniciar avaliação
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    // Responder 5 questões
    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    for (let i = 0; i < 5; i++) {
      cy.get('input[type="radio"]').first().click();
      cy.wait(500); // Aguardar salvamento
    }

    cy.contains('5 de 37', { timeout: 5000 }).should('be.visible');

    // Recarregar página
    cy.reload();

    // Verificar que progresso foi mantido
    cy.contains('5 de 37', { timeout: 10000 }).should('be.visible');

    // Continuar respondendo
    cy.get('input[type="radio"]').first().click();
    cy.contains('6 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve avançar automaticamente sem botão "Próxima"', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    // Não deve haver botão "Próxima"
    cy.contains('button', /próxima|avançar/i).should('not.exist');

    // Clicar em uma resposta deve avançar automaticamente
    cy.get('input[type="radio"]').first().click();
    cy.contains('1 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve exibir apenas uma questão por vez', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Deve haver apenas um conjunto de radio buttons visível
    cy.get('input[type="radio"]').should('have.length.at.least', 5);
    cy.get('input[type="radio"]').should('have.length.at.most', 10);
  });

  it('deve usar labels descritivos ao invés de números', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Verificar labels descritivos
    cy.contains('Nunca').should('be.visible');
    cy.contains('Raramente').should('be.visible');
    cy.contains('Às vezes').should('be.visible');
    cy.contains('Quase sempre').should('be.visible');
    cy.contains('Sempre').should('be.visible');

    // Não deve exibir percentuais
    cy.get('body').should('not.contain', '0%');
    cy.get('body').should('not.contain', '25%');
    cy.get('body').should('not.contain', '50%');
    cy.get('body').should('not.contain', '75%');
    cy.get('body').should('not.contain', '100%');
  });

  it('deve continuar avaliação do dashboard quando em andamento', () => {
    // Login e responder algumas questões
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    for (let i = 0; i < 3; i++) {
      cy.get('input[type="radio"]').first().click();
      cy.wait(500);
    }

    // Voltar para dashboard
    cy.visit('/dashboard');

    // Deve exibir "Continuar Avaliação"
    cy.contains(/continuar/i, { timeout: 5000 }).should('be.visible');
    cy.contains(/continuar/i).click();

    // Deve retomar na questão 4
    cy.url().should('include', '/avaliacao');
    cy.contains('3 de 37', { timeout: 10000 }).should('be.visible');
  });

  it('deve finalizar avaliação após responder 37 questões', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    // Responder todas as 37 questões
    for (let i = 0; i < 37; i++) {
      cy.get('input[type="radio"]', { timeout: 10000 }).first().click();
      cy.wait(300);
    }

    // Deve redirecionar para página de conclusão ou dashboard
    cy.url({ timeout: 15000 }).should('not.include', '/avaliacao?id=');
    cy.url().should('match', /\/(avaliacao\/concluida|dashboard)/);
  });

  it('deve preservar sessão após recarregar durante avaliação', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Recarregar múltiplas vezes
    cy.reload();
    cy.wait(1000);
    cy.reload();
    cy.wait(1000);

    // Deve ainda estar autenticado e na avaliação
    cy.url().should('include', '/avaliacao');
    cy.contains(/de 37/).should('be.visible');
  });

  it('deve impedir acesso à avaliação sem login', () => {
    cy.visit('/avaliacao?id=1');

    // Deve redirecionar para login
    cy.url({ timeout: 5000 }).should('include', '/login');
  });
});
