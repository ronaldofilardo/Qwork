describe('Avaliação - auto conclusão e redirecionamento', () => {
  it('Funcionário é redirecionado para comprovante quando avaliação é concluída automaticamente', () => {
    // Mockar sessão de funcionário
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: { cpf: '12345678909', nome: 'Teste', perfil: 'funcionario' },
    });

    // Interceptar POST de respostas e retornar completed = true (wildcard URL)
    cy.intercept({ method: 'POST', url: '**/api/avaliacao/respostas**' }, (req) => {
      req.reply({ statusCode: 200, body: { success: true, completed: true } });
    }).as('postResposta');

    // Usar viewport mobile para garantir versão mobile da UI
    cy.viewport('iphone-6');

    // Visitar página de avaliação com id fictício 16
    cy.visit('/avaliacao?id=16');

    // Esperar o carregamento da pergunta e clicar na primeira opção (escala) visível
    cy.get('button[aria-pressed="false"]').filter(':visible').first().click();

    // Aguarda a chamada (aumentar timeout) e verifica o redirecionamento
    cy.wait('@postResposta', { timeout: 10000 });
    cy.location('pathname', { timeout: 10000 }).should(
      'include',
      '/avaliacao/concluida'
    );
    cy.location('search').should('include', 'avaliacao_id=16');
  });

  it('Dashboard mostra "Ver Comprovante" para avaliação concluída (RH e Entidade)', () => {
    const perfis = ['rh', 'gestor_entidade'];

    perfis.forEach((perfil) => {
      // Mockar sessão com o perfil
      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: { cpf: '00000000000', nome: 'Teste', perfil },
      });

      // Mockar endpoint de listagem para retornar uma avaliação concluída
      cy.intercept('GET', '/api/avaliacao/todas', {
        statusCode: 200,
        body: {
          avaliacoes: [
            {
              id: 99,
              status: 'concluida',
              criado_em: new Date().toISOString(),
              total_respostas: 37,
            },
          ],
        },
      }).as('getAvaliacoes');

      cy.visit('/dashboard');
      cy.wait('@getAvaliacoes');

      // Deve mostrar o card com o botão Ver Comprovante
      cy.contains('Ver Comprovante').should('exist');
    });
  });
});
