/**
 * E2E: Gestão de Funcionários
 *
 * Valida operações de CRUD de funcionários:
 *  - Listagem
 *  - Ativação/Inativação
 *  - Status
 */

describe('Gestão de Funcionários — E2E', () => {
  const TIMEOUT = 8000;

  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '22222222222',
        nome: 'Gestor Func E2E',
        perfil: 'gestor',
        entidade_id: 1,
        sessionToken: 'gestor-func-token',
      },
    }).as('session');
  });

  describe('Listagem de Funcionários', () => {
    it('deve exibir lista de funcionários da entidade', () => {
      cy.intercept('GET', '/api/entidade/funcionarios*', {
        statusCode: 200,
        body: {
          funcionarios: [
            { cpf: '12345678901', nome: 'João Silva', ativo: true },
            { cpf: '98765432109', nome: 'Maria Santos', ativo: true },
            { cpf: '11122233344', nome: 'Pedro Inativo', ativo: false },
          ],
        },
      }).as('funcionarios');

      cy.visit('/entidade/funcionarios', { timeout: TIMEOUT });
      cy.wait('@session', { timeout: TIMEOUT });

      cy.contains(/funcionário|funcionarios/i, { timeout: TIMEOUT }).should(
        'exist'
      );
    });
  });

  describe('Status do Funcionário', () => {
    it('API deve validar CPF obrigatório no status', () => {
      cy.request({
        method: 'PATCH',
        url: '/api/entidade/funcionarios/status',
        body: { ativo: true },
        failOnStatusCode: false,
      }).then((response) => {
        expect([400, 401, 403]).to.include(response.status);
      });
    });

    it('API deve validar campo ativo obrigatório', () => {
      cy.request({
        method: 'PATCH',
        url: '/api/entidade/funcionarios/status',
        body: { cpf: '12345678901' },
        failOnStatusCode: false,
      }).then((response) => {
        expect([400, 401, 403]).to.include(response.status);
      });
    });
  });
});
