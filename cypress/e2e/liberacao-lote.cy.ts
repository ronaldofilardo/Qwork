/**
 * Testes E2E para fluxo de liberação de lote (RH)
 * - Botão dispara ação direta (sem modal)
 * - Loading state
 * - Navegação pós-sucesso
 * - Erro inline
 */

describe('Fluxo de Liberação de Lote - RH', () => {
  const empresaId = 1;
  const empresaNome = 'Empresa Teste E2E';

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      },
    }).as('getSession');

    cy.intercept('GET', '/api/rh/empresas', {
      statusCode: 200,
      body: [{ id: empresaId, nome: empresaNome, cnpj: '12345678000190', ativa: true }],
    }).as('getEmpresas');

    cy.intercept('GET', '/api/rh/lotes*', {
      statusCode: 200,
      body: { success: true, lotes: [], total: 0 },
    }).as('getLotes');

    cy.intercept('POST', '/api/auth/login', (req) => {
      req.reply({
        statusCode: 200,
        body: { redirectTo: `/rh/empresa/${empresaId}?tab=lotes`, perfil: 'rh' },
      });
    }).as('postLogin');

    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@getSession');
    cy.visit(`/rh/empresa/${empresaId}?tab=lotes`);
    cy.wait('@getEmpresas');
    cy.wait('@getLotes');
  });

  describe('Botão de Início de Ciclo', () => {
    it('deve exibir botão "Iniciar Novo Ciclo"', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').should('be.visible');
    });

    it('NÃO deve abrir modal ao clicar no botão', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        req.reply({ delay: 200, statusCode: 200, body: { success: true } });
      }).as('liberarLote');

      cy.contains('button', 'Iniciar Novo Ciclo').click();

      // Não deve existir dialog de modal
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve mostrar estado de loading enquanto a API processa', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        req.reply({
          delay: 1500,
          statusCode: 200,
          body: { success: true, lote: { id: 1, numero_ordem: 1 } },
        });
      }).as('liberarLento');

      cy.contains('button', 'Iniciar Novo Ciclo').click();

      // Botão deve mostrar loading e ficar desabilitado
      cy.contains('button', 'Liberando...').should('be.visible').and('be.disabled');
      cy.wait('@liberarLento');
    });
  });

  describe('Sucesso — Navegação', () => {
    it('deve navegar para a página do lote após sucesso', () => {
      const loteId = 42;

      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          lote: {
            id: loteId,
            numero_ordem: 1,
            tipo: 'completo',
            liberado_em: new Date().toISOString(),
          },
        },
      }).as('liberarSucesso');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarSucesso');

      cy.url().should('include', `/rh/empresa/${empresaId}/lote/${loteId}`);
    });

    it('não deve navegar quando a resposta não traz lote', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: { success: true },
      }).as('liberarSemLote');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarSemLote');

      cy.url().should('not.include', '/lote/');
    });
  });

  describe('Erro — Feedback inline', () => {
    it('deve exibir mensagem de erro quando a API retorna erro', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Nenhum funcionário elegível encontrado',
        },
      }).as('liberarErro');

      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.wait('@liberarErro');

      cy.contains('Nenhum funcionário elegível encontrado').should('be.visible');
    });
  });
});
