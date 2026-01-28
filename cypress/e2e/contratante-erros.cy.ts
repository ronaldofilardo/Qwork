describe('Cenários negativos no fluxo de cadastro', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('Deve exibir erro quando upload de documentos falha', () => {
    cy.visit('/login');
    cy.contains('Cadastrar Empresa').click();

    cy.get('[data-testid="tipo-entidade"]').click();
    cy.contains('Próximo').click();

    cy.get('[data-testid="plano-card"]').first().click();
    cy.contains('Próximo').click();

    // Preencher dados mínimos para chegar à etapa de upload
    cy.get('input[name="nome"]').type('Empresa Erro Upload');
    cy.get('input[name="cnpj"]').type('12345678000399');
    cy.get('input[name="email"]').type('erro-upload@exemplo.com');
    cy.contains('Próximo').click();

    // Forçar erro ao anexar arquivo: usar um fixture inexistente para provocar falha
    cy.get('input[name="cartao_cnpj"]').attachFile('non-existent-file.pdf');

    // Submeter e verificar mensagem de erro
    cy.contains('Próximo').click();
    cy.contains(/erro|falha|não foi possível/i).should('be.visible');
  });

  it('Deve barrar avanço quando contrato não for aceito', () => {
    cy.visit('/login');
    cy.contains('Cadastrar Empresa').click();

    cy.get('[data-testid="tipo-entidade"]').click();
    cy.contains('Próximo').click();

    cy.get('[data-testid="plano-card"]').first().click();
    cy.contains('Próximo').click();

    cy.get('input[name="nome"]').type('Empresa Sem Aceite');
    cy.get('input[name="cnpj"]').type('12345678000499');
    cy.get('input[name="email"]').type('sem-aceite@exemplo.com');
    cy.contains('Próximo').click();

    cy.get('input[name="responsavel_nome"]').type('Sem Aceite');
    cy.get('input[name="responsavel_cpf"]').type('12345678909');
    cy.contains('Próximo').click();

    // Na etapa do contrato, tentar avançar sem aceitar
    cy.contains('Próximo').click();
    cy.contains(/aceitar o contrato|você precisa aceitar/i).should(
      'be.visible'
    );
  });
});
