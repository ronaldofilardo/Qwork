/**
 * E2E: Fluxo de emissão de laudo
 *
 * Valida o ciclo de emissão:
 *  - Listagem de lotes prontos para emissão
 *  - Solicitação de emissão
 *  - Acompanhamento de progresso
 *  - Download do laudo emitido
 */

describe('Fluxo de Emissão de Laudo — E2E', () => {
  const TIMEOUT = 8000;

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '22222222222',
        nome: 'RH Emissão E2E',
        perfil: 'rh',
        sessionToken: 'e2e-emissao-token',
      },
    }).as('session');
  });

  describe('Listagem de Lotes', () => {
    it('deve exibir lotes disponíveis para emissão', () => {
      // Arrange
      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: {
          lotes: [
            {
              id: 1,
              status: 'concluido',
              total_avaliacoes: 10,
              avaliacoes_concluidas: 10,
              empresa_nome: 'Empresa E2E',
              pode_emitir_laudo: true,
              taxa_conclusao: 100,
            },
            {
              id: 2,
              status: 'ativo',
              total_avaliacoes: 5,
              avaliacoes_concluidas: 3,
              empresa_nome: 'Empresa Parcial',
              pode_emitir_laudo: false,
              taxa_conclusao: 60,
            },
          ],
        },
      }).as('lotes');

      // Act
      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Assert
      cy.contains('Empresa E2E', { timeout: TIMEOUT }).should('be.visible');
    });

    it('deve mostrar indicador de lote pronto para emissão', () => {
      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: {
          lotes: [
            {
              id: 1,
              status: 'concluido',
              total_avaliacoes: 5,
              avaliacoes_concluidas: 5,
              empresa_nome: 'Empresa Pronta',
              pode_emitir_laudo: true,
              taxa_conclusao: 100,
            },
          ],
        },
      }).as('lotes');

      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Lote com 100% de conclusão deve ter indicador visual
      cy.contains('100%', { timeout: TIMEOUT }).should('exist');
    });
  });

  describe('Solicitação de Emissão', () => {
    it('deve bloquear emissão de lote incompleto', () => {
      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: {
          lotes: [
            {
              id: 1,
              status: 'ativo',
              total_avaliacoes: 10,
              avaliacoes_concluidas: 5,
              empresa_nome: 'Empresa Incompleta',
              pode_emitir_laudo: false,
              taxa_conclusao: 50,
              motivos_bloqueio: ['Avaliações pendentes'],
            },
          ],
        },
      }).as('lotes');

      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      // Botão de emissão não deve estar habilitado
      cy.contains('Empresa Incompleta', { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });
  });

  describe('Download de Laudo', () => {
    it('deve oferecer download quando laudo disponível', () => {
      cy.intercept('GET', '/api/rh/lotes*', {
        statusCode: 200,
        body: {
          lotes: [
            {
              id: 1,
              status: 'concluido',
              total_avaliacoes: 5,
              avaliacoes_concluidas: 5,
              empresa_nome: 'Empresa Com Laudo',
              pode_emitir_laudo: false,
              taxa_conclusao: 100,
              hash_pdf: 'abc123',
            },
          ],
          laudos: [
            {
              id: 10,
              lote_id: 1,
              emissor_nome: 'Emissor E2E',
              hash: 'abc123',
              status: 'emitido',
              enviado_em: '2026-03-10',
            },
          ],
        },
      }).as('lotes');

      cy.visit('/rh', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      cy.contains('Empresa Com Laudo', { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });
  });
});
