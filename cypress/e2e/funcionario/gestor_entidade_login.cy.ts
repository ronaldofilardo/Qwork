describe('Fluxo: gestor_entidade login', () => {
  it('faz login e acessa /entidade sem loop', () => {
    cy.visit('/login');

    cy.get('#cpf').clear().type('87545772920');
    cy.get('#senha').clear().type('123456');
    cy.get('button[type=submit]').click();

    // Deve ir para /entidade
    cy.location('pathname', { timeout: 10000 }).should('eq', '/entidade');

    // Verificar que a página de entidade carrega (ex.: título de lotes)
    cy.contains('Ciclos de Coletas Avaliativas', { timeout: 10000 }).should('be.visible');

    // Verificar que não foi redirecionado para /dashboard
    cy.location('pathname').should('not.eq', '/dashboard');
  });
});

