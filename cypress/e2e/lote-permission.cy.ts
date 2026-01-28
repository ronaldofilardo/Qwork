describe('Lote - Permissão (403) UX', () => {
  beforeEach(() => {
    // Mock session as RH
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: { cpf: '123', perfil: 'rh' },
    }).as('getSession');

    // Mock detalhes do lote para retornar 403 permission_clinic_mismatch
    cy.intercept('GET', '/api/rh/lotes/1/funcionarios*', {
      statusCode: 403,
      body: {
        success: false,
        error: 'Acesso negado',
        error_code: 'permission_clinic_mismatch',
        hint: 'Verifique a clínica do seu usuário e tente novamente',
      },
    }).as('getLote403');
  });

  it('exibe mensagem amigável de permissão e permite voltar', () => {
    cy.visit('/rh/empresa/100/lote/1');

    // Esperar a interceptação
    cy.wait('@getSession');
    cy.wait('@getLote403');

    cy.contains('Acesso restrito').should('be.visible');
    cy.contains('Verifique a clínica do seu usuário e tente novamente').should(
      'be.visible'
    );

    cy.get('button').contains('Voltar para empresa').click();

    cy.url().should('include', '/rh/empresa/100');
  });
});
