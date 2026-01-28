describe('Cadastro de Contratante - Plano Personalizado', () => {
  const ts = Date.now();
  const empresa = {
    nome: `Empresa Teste Plano Personalizado ${ts}`,
    cnpj: '12345678000299',
    email: `teste-personalizado-${ts}@exemplo.com.br`,
  };

  const responsavel = {
    nome: `Responsavel Personalizado ${ts}`,
    cpf: `${String(20000000000 + (ts % 89999999999)).slice(0, 11)}`,
    email: `resp-personalizado-${ts}@exemplo.com.br`,
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Interceptar chamadas críticas para tornar o teste mais determinístico
    cy.intercept('POST', '/api/pagamento/**').as('processarPagamento');
    cy.intercept('POST', '/api/pagamento/**').as('pagamento');
  });

  it('Deve permitir cadastro com plano personalizado e completar fluxo até confirmação', () => {
    cy.visit('/login');
    cy.contains('Cadastrar Empresa').click();

    cy.get('[data-testid="tipo-entidade"]').click();
    cy.contains('Próximo').click();

    // Selecionar plano personalizado (non-Fixo)
    cy.wait(800);
    cy.get('[data-testid="plano-card"]')
      .contains(/Personalizado|personalizado/i)
      .first()
      .click();
    cy.contains('Próximo').click();

    // Preencher dados básicos
    cy.get('input[name="nome"]').type(empresa.nome);
    cy.get('input[name="cnpj"]').type(empresa.cnpj);
    cy.get('input[name="email"]').type(empresa.email);
    cy.contains('Próximo').click();

    // Responsável
    cy.get('input[name="responsavel_nome"]').type(responsavel.nome);
    cy.get('input[name="responsavel_cpf"]').type(responsavel.cpf);
    cy.get('input[name="responsavel_email"]').type(responsavel.email);
    cy.contains('Próximo').click();

    // Aceitar e finalizar
    cy.get('pre').should('contain', empresa.nome);
    cy.get('input[type="checkbox"]').check();
    cy.contains('Finalizar Cadastro').click();

    // Esperar pela criação do contrato
    cy.wait('@processarPagamento');

    // Pagamento (simulado)
    cy.get('input[value="pix"]').check({ force: true });
    cy.contains('Confirmar Pagamento').click();
    cy.wait('@pagamento');

    // Redireciona para login
    cy.url({ timeout: 10000 }).should('include', '/login');

    // Login do responsável com senha padrão (últimos 6 do CNPJ)
    const defaultPassword = empresa.cnpj.replace(/[\.\/-]/g, '').slice(-6);
    cy.get('input[name="cpf"]').clear().type(responsavel.cpf);
    cy.get('input[name="senha"]').clear().type(defaultPassword);
    cy.contains('Entrar').click();

    cy.url({ timeout: 10000 }).should((url) => {
      expect(url).to.match(/(dashboard|rh|avaliacao|gestor)/i);
    });
    cy.contains(responsavel.nome).should('be.visible');
  });
});
