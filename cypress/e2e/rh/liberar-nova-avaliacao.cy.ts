/**
 * Teste E2E: RH libera nova avaliação
 * Item 18: RH libera → nova avaliação aparece
 */

describe('RH - Liberar Nova Avaliação', () => {
  const rhCPF = '11111111111';
  const rhSenha = '123';
  const funcionarioCPF = '22222222222';
  const funcionarioSenha = '123';

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('deve permitir RH fazer login (via sessão de teste)', () => {
    // Usar endpoint de sessão para evitar fragilidade do fluxo de login na E2E
    cy.request('POST', '/api/test/session', {
      cpf: rhCPF,
      nome: 'RH Teste',
      perfil: 'rh',
    });

    cy.visit('/rh');

    cy.url().should('include', '/rh');
    cy.contains(/dashboard|gerenciar|liberar/i, { timeout: 10000 }).should(
      'be.visible'
    );
  });

  it('deve exibir opção de liberar avaliações no dashboard do RH', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Primeiro deve haver empresas listadas
    cy.contains(/empresas|gerenciar/i, { timeout: 10000 }).should('be.visible');

    // Clicar na primeira empresa para ir ao dashboard
    cy.contains('Ver Dashboard').first().click();

    // Agora deve estar na página da empresa e ter o botão de liberar
    cy.url().should('include', '/rh/empresa/');
    cy.contains(/liberar/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve permitir liberar avaliações em massa', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    // Clicar em liberar avaliações
    cy.contains(/liberar/i).click();

    // Deve abrir o modal de liberação
    cy.contains(/Iniciar Ciclo/i, { timeout: 5000 }).should('be.visible');

    // Preencher os campos necessários (empresa já está selecionada)
    // Selecionar todos os funcionários
    cy.get('input[type="checkbox"]').first().check();

    // Clicar em liberar
    cy.contains('button', /Iniciar Ciclo/i).click();

    // Deve exibir mensagem de sucesso
    cy.contains(/sucesso|criado/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve permitir liberar para níveis específicos', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    cy.contains(/liberar/i).click();

    // Selecionar nível específico no modal
    cy.get('select[name="nivel"]').select('operacional');

    // Selecionar funcionários
    cy.get('input[type="checkbox"]').first().check();

    cy.contains('button', /Iniciar Ciclo/i).click();

    cy.contains(/sucesso|criado/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve exibir número de avaliações criadas após liberação', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    cy.contains(/liberar/i).click();
    cy.get('input[type="checkbox"]').first().check();
    cy.contains('button', /Iniciar Ciclo/i).click();

    // Deve exibir quantas foram criadas
    cy.contains(/\d+ avaliações?/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve fazer avaliação aparecer no dashboard do funcionário após liberação', () => {
    // 1. RH libera avaliação
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    cy.contains(/liberar/i).click();
    cy.get('input[type="checkbox"]').first().check();
    cy.contains('button', /Iniciar Ciclo/i).click();
    cy.contains(/sucesso|criado/i, { timeout: 10000 }).should('be.visible');

    // 2. Logout do RH
    cy.clearCookies();

    // 3. Funcionário faz login
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/dashboard');

    // 4. Nova avaliação deve aparecer
    cy.contains(/iniciar avaliação/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve permitir múltiplas liberações', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Primeira liberação
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');
    cy.contains(/liberar/i).click();
    cy.get('input[type="checkbox"]').first().check();
    cy.contains('button', /Iniciar Ciclo/i).click();
    cy.contains(/sucesso|criado/i, { timeout: 10000 }).should('be.visible');

    // Voltar para lista de empresas
    cy.contains('Voltar').click();
    cy.url().should('include', '/rh');

    // Segunda liberação
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');
    cy.contains(/liberar/i).click();
    cy.get('input[type="checkbox"]').first().check();
    cy.contains('button', /Iniciar Ciclo/i).click();
    cy.contains(/sucesso|criado/i, { timeout: 10000 }).should('be.visible');
  });

  it('deve validar que apenas RH pode liberar avaliações', () => {
    // Funcionário tenta acessar página de RH
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/rh', { failOnStatusCode: false });

    // Deve ser bloqueado ou redirecionado
    cy.url({ timeout: 5000 }).should('not.include', '/rh');
  });

  it('deve exibir histórico de liberações', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    // Liberar uma avaliação
    cy.contains(/liberar/i).click();
    cy.get('input[type="checkbox"]').first().check();
    cy.contains('button', /Iniciar Ciclo/i).click();
    cy.contains(/sucesso/i, { timeout: 10000 }).should('be.visible');

    // Voltar para lista de empresas
    cy.contains('Voltar').click();
    cy.url().should('include', '/rh');

    // Deve haver algum histórico ou contagem de lotes/avaliações
    cy.contains(/lotes?|avaliações/i).should('be.visible');
  });

  it('deve permitir liberar para toda a empresa', () => {
    cy.login(rhCPF, rhSenha, 'rh');
    cy.visit('/rh');

    // Ir para o dashboard da primeira empresa
    cy.contains('Ver Dashboard').first().click();
    cy.url().should('include', '/rh/empresa/');

    cy.contains(/liberar/i).click();

    // Selecionar todos os funcionários (não filtrar por nível)
    cy.get('input[type="checkbox"]').check({ multiple: true });

    cy.contains('button', /Iniciar Ciclo/i).click();

    cy.contains(/sucesso/i, { timeout: 10000 }).should('be.visible');
    // Deve mostrar que criou para múltiplos funcionários
    cy.contains(/\d+/, { timeout: 5000 }).should('be.visible');
  });
});

