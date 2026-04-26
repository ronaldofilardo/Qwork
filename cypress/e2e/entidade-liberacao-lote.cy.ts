/**
 * Testes E2E para fluxo de liberação de lote por entidade
 * - Botão dispara ação direta (sem modal)
 * - Loading state
 * - Navegação pós-sucesso
 * - Erro inline
 */

describe('Fluxo de Liberação de Lote - Entidade', () => {
  const mockLotes = [
    {
      id: 1,
      titulo: 'Lote Teste 1',
      tipo: 'completo',
      status: 'enviado',
      total_funcionarios: 10,
      funcionarios_concluidos: 7,
      data_criacao: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'Gestor Entidade Teste',
        perfil: 'gestor',
        clinica_id: 1,
      },
    }).as('getSession');

    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true },
    }).as('login');

    cy.intercept('GET', '/api/entidade/lotes*', {
      statusCode: 200,
      body: { success: true, lotes: mockLotes, total: mockLotes.length },
    }).as('getLotes');

    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');
    cy.setCookie(
      'bps-session',
      JSON.stringify({
        cpf: '12345678901',
        nome: 'Gestor Entidade Teste',
        perfil: 'gestor',
        clinica_id: 1,
        sessionToken: 'test-token',
        lastRotation: Date.now(),
      })
    );
    cy.wait('@getSession');
    cy.visit('/entidade/lotes');
    cy.wait('@getLotes');
  });

  describe('Botão de Início de Ciclo', () => {
    it('deve exibir botão "Iniciar Novo Ciclo"', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').should('be.visible');
    });

    it('NÃO deve abrir modal ao clicar no botão', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', (req) => {
        req.reply({ delay: 200, statusCode: 200, body: { success: true } });
      }).as('liberarLote');

      cy.contains('button', 'Iniciar Novo Ciclo').click();

      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve mostrar estado de loading enquanto a API processa', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', (req) => {
        req.reply({
          delay: 1500,
          statusCode: 200,
          body: {
            success: true,
            resultados: [{ loteId: 5, empresaId: 1, created: true }],
          },
        });
      }).as('liberarLento');

      cy.contains('button', 'Iniciar Novo Ciclo').click();

      cy.contains('button', 'Liberando...').should('be.visible').and('be.disabled');
      cy.wait('@liberarLento');
    });
  });

  describe('Sucesso — Navegação', () => {
    it('deve navegar para a página do lote após sucesso', () => {
      const loteId = 55;

      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          resultados: [{ loteId, empresaId: 1, created: true }],
        },
      }).as('liberarSucesso');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarSucesso');

      cy.url().should('include', `/entidade/lote/${loteId}`);
    });

    it('não deve navegar quando a resposta não traz resultados', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 200,
        body: { success: true, resultados: [] },
      }).as('liberarSemResultado');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarSemResultado');

      cy.url().should('not.include', '/lote/');
    });
  });

  describe('Erro — Feedback inline', () => {
    it('deve exibir mensagem de erro quando não há funcionários elegíveis', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Nenhum funcionário elegível encontrado',
        },
      }).as('liberarErro');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarErro');

      cy.contains('Nenhum funcionário elegível encontrado').should('be.visible');
    });
  });
});
