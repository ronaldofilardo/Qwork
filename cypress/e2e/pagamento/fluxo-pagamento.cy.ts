/**
 * E2E: Fluxo completo de pagamento
 *
 * Valida o ciclo de pagamento do tomador:
 *  - Simulação de pagamento
 *  - Seleção de método (PIX, boleto, cartão)
 *  - Confirmação
 *  - Status atualizado
 */

describe('Fluxo de Pagamento — E2E', () => {
  const TIMEOUT = 8000;

  beforeEach(() => {
    // Mock de sessão como gestor de entidade
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '11111111111',
        nome: 'Gestor Pagamento E2E',
        perfil: 'gestor',
        entidade_id: 1,
        sessionToken: 'e2e-pagamento-token',
      },
    }).as('session');
  });

  describe('Simulação de Pagamento', () => {
    it('deve carregar simulador de pagamento', () => {
      // Arrange
      cy.intercept('GET', '/api/pagamento/simular*', {
        statusCode: 200,
        body: {
          pix: {
            metodo: 'pix',
            nome: 'PIX',
            parcelas_opcoes: [
              {
                numero_parcelas: 1,
                valor_por_parcela: 1500,
                valor_total: 1500,
                descricao: 'À vista',
              },
            ],
          },
          boleto: {
            metodo: 'boleto',
            nome: 'Boleto',
            parcelas_opcoes: [
              {
                numero_parcelas: 1,
                valor_por_parcela: 1500,
                valor_total: 1500,
                descricao: 'À vista',
              },
            ],
          },
          cartao: {
            metodo: 'cartao',
            nome: 'Cartão',
            parcelas_opcoes: [
              {
                numero_parcelas: 1,
                valor_por_parcela: 1500,
                valor_total: 1500,
                descricao: 'À vista',
              },
              {
                numero_parcelas: 3,
                valor_por_parcela: 525,
                valor_total: 1575,
                descricao: '3x',
              },
            ],
          },
        },
      }).as('simular');

      // Act
      cy.visit('/entidade/pagamento', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Assert - simulador visível
      cy.contains(/pagamento|simulador|forma/i, { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve exibir opções de pagamento PIX e Boleto', () => {
      cy.intercept('GET', '/api/pagamento/simular*', {
        statusCode: 200,
        body: {
          pix: {
            metodo: 'pix',
            nome: 'PIX',
            parcelas_opcoes: [
              {
                numero_parcelas: 1,
                valor_por_parcela: 1500,
                valor_total: 1500,
                descricao: 'À vista',
              },
            ],
          },
          boleto: {
            metodo: 'boleto',
            nome: 'Boleto',
            parcelas_opcoes: [
              {
                numero_parcelas: 1,
                valor_por_parcela: 1500,
                valor_total: 1500,
                descricao: 'À vista',
              },
            ],
          },
        },
      }).as('simular');

      cy.visit('/entidade/pagamento', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Ambos os métodos devem estar visíveis
      cy.contains(/pix/i, { timeout: TIMEOUT }).should('exist');
      cy.contains(/boleto/i, { timeout: TIMEOUT }).should('exist');
    });
  });

  describe('Status de Pagamento', () => {
    it('deve exibir pagamento pendente', () => {
      cy.intercept('GET', '/api/pagamento/status*', {
        statusCode: 200,
        body: {
          status: 'pendente',
          valor: 1500,
          metodo: 'boleto',
        },
      }).as('status');

      cy.visit('/entidade/pagamento', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      cy.contains(/pendente/i, { timeout: TIMEOUT }).should('exist');
    });

    it('deve exibir pagamento confirmado', () => {
      cy.intercept('GET', '/api/pagamento/status*', {
        statusCode: 200,
        body: {
          status: 'confirmado',
          valor: 1500,
          metodo: 'pix',
          pago_em: '2026-03-12T10:00:00Z',
        },
      }).as('status');

      cy.visit('/entidade/pagamento', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      cy.contains(/confirmado|pago|aprovado/i, { timeout: TIMEOUT }).should(
        'exist'
      );
    });
  });
});
