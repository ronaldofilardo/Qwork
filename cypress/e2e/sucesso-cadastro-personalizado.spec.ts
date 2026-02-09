describe('Sucesso Cadastro - fluxos', () => {
  it('mostra mensagem de dados enviados quando tipo=personalizado e API pública falha', () => {
    cy.intercept('GET', '/api/auth/session', { statusCode: 401, body: {} });
    cy.intercept('GET', '/api/public/tomador?id=50', {
      statusCode: 500,
      body: { error: 'Erro ao buscar dados' },
    });

    cy.visit('/sucesso-cadastro?id=50&tipo=personalizado');

    cy.get('[data-testid="dados-enviados-personalizado"]').should('exist');
    cy.contains('Recebemos seus dados personalizados').should('exist');
  });

  it('mostra fallback "Conta criada com sucesso" quando não há id e sem sessão', () => {
    cy.intercept('GET', '/api/auth/session', { statusCode: 401, body: {} });

    cy.visit('/sucesso-cadastro');

    cy.get('[data-testid="conta-criada"]').should('exist');
    cy.contains('Conta criada com sucesso').should('exist');
  });

  it('mostra tela de pagamento concluído quando sessão indica pagamento_confirmado', () => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        tomador: {
          id: 1,
          nome: 'Empresa Teste',
          pagamento_confirmado: true,
        },
      },
    });

    cy.visit('/sucesso-cadastro');

    cy.contains('Cadastro Concluído!').should('exist');
  });
});
