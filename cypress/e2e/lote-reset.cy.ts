describe('Lote — Resetar avaliação (fluxo)', () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
    cy.loginAsEntidade(); // helper from cypress/support
  });

  it('exibe botão Reset e permite apagar respostas (fluxo happy path)', () => {
    cy.intercept('GET', '/api/entidade/lote/4', {
      fixture: 'entidade/lote-4.json',
    }).as('getLote');

    cy.intercept('POST', '/api/entidade/lotes/4/avaliacoes/10/reset', (req) => {
      expect(req.body).to.have.property('reason');
      req.reply({ statusCode: 200, body: { success: true, resetId: 'r1' } });
    }).as('postReset');

    cy.visit('/entidade/lote/4');
    cy.wait('@getLote');

    cy.contains('↻ Reset')
      .first()
      .scrollIntoView()
      .should('be.visible')
      .click({ force: true });

    // Modal should open and allow input
    cy.get('[role="dialog"]').should('be.visible');
    cy.get('textarea#motivo')
      .type('Corrigir duplicidade de respostas')
      .should('have.value', 'Corrigir duplicidade de respostas');
    cy.contains('button', 'Resetar Avaliação')
      .should('not.be.disabled')
      .click();

    // Wait for API call (give extra time in CI-like envs)
    cy.wait('@postReset', { timeout: 10000 })
      .its('response.statusCode')
      .should('eq', 200);
    cy.get('body').should('contain.text', 'Avaliação resetada com sucesso');
  });

  it("após reset a avaliação volta a 'iniciada' (UI atualiza)", () => {
    // Preparar duas respostas sequenciais: antes -> 'concluida', depois -> 'iniciada'
    const initial = {
      success: true,
      lote: { id: 4, titulo: 'Lote 4', status: 'ativo' },
      estatisticas: {},
      funcionarios: [
        {
          cpf: '00000000000',
          nome: 'Funcionario Teste',
          setor: 'Operações',
          funcao: 'Operador',
          avaliacao: {
            id: 10,
            status: 'concluida',
            data_inicio: null,
            data_conclusao: new Date().toISOString(),
          },
        },
      ],
    };

    const afterReset = JSON.parse(JSON.stringify(initial));
    afterReset.funcionarios[0].avaliacao.status = 'iniciada';
    afterReset.funcionarios[0].avaliacao.data_inicio = new Date().toISOString();
    afterReset.funcionarios[0].avaliacao.data_conclusao = null;

    const seq = [
      { statusCode: 200, body: initial },
      { statusCode: 200, body: afterReset },
    ];

    cy.intercept('GET', '/api/entidade/lote/4', (req) => {
      const reply = seq.shift() || { statusCode: 200, body: afterReset };
      req.reply(reply);
    }).as('getLoteSeq');

    cy.intercept('POST', '/api/entidade/lotes/4/avaliacoes/10/reset', (req) => {
      expect(req.body).to.have.property('reason');
      req.reply({
        statusCode: 200,
        body: { success: true, resetId: 'r2', respostasDeleted: 3 },
      });
    }).as('postResetSeq');

    cy.visit('/entidade/lote/4');
    cy.wait('@getLoteSeq');

    // Confirma estado inicial
    cy.contains('Funcionario Teste')
      .parents('tr')
      .within(() => {
        cy.contains('Concluída').should('be.visible');
      });

    // Executa reset
    cy.contains('↻ Reset').first().click();
    cy.get('textarea#motivo').type('Teste E2E: reset completo');
    cy.contains('Resetar Avaliação').click();

    cy.wait('@postResetSeq');
    cy.wait('@getLoteSeq');

    // Verifica que UI foi atualizada para 'Iniciada'
    cy.contains('Funcionario Teste')
      .parents('tr')
      .within(() => {
        cy.contains('Iniciada').should('be.visible');
      });
  });
});
