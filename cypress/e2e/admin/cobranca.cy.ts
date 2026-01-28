describe('Admin - Cobrança', () => {
  it('exibe lista de contratantes na aba Cobrança', () => {
    // Login como admin (seed do usuário admin existente)
    cy.login('00000000000', '123');

    cy.visit('/admin');

    // Abrir menu Financeiro e clicar em Cobrança
    cy.contains('Financeiro').click();
    cy.contains('Cobrança').click();

    // Página deve conter o título e cabeçalho Data Pagamento
    cy.contains('Gestão de Cobranças');
    cy.contains('Data Pagamento');

    // Deve listar pelo menos uma linha de contrato
    cy.get('table').find('tbody tr').should('have.length.greaterThan', 0);
  });
});
