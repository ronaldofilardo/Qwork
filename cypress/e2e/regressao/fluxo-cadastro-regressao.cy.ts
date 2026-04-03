/**
 * Cypress E2E - Fluxo de regressão: Cadastro -> Aceite de Contrato -> Login
 * Propósito: reduzir flakiness delegando inserção de dados para task direta no DB.
 * Pagamento não é mais necessário no fluxo de cadastro (removido 01/04/2026).
 */

describe('Regressão E2E: Fluxo Cadastro Completo', () => {
  const ts = Date.now();
  const empresa = {
    nome: `Empresa Regressao E2E ${ts}`,
    cnpj: `02${String(ts).slice(-10)}0001`,
    email: `e2e-regressao-${ts}@example.com`,
  };

  const responsavel = {
    nome: 'Responsavel Regressao',
    cpf: `${String(ts).slice(-11, -1)}1`,
    email: `resp-regressao-${ts}@example.com`,
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('insere tomador/contrato via task, aceita contrato e permite login do gestor', () => {
    // Guard: garantir banco de testes
    cy.request({ url: '/api/test/db', timeout: 5000 }).then((resp) => {
      if (
        !resp.body?.database ||
        !String(resp.body.database).includes('_test')
      ) {
        throw new Error(
          `Ambiente incorreto: banco = ${resp.body?.database || 'desconhecido'}`
        );
      }
    });

    // Inserir tomador + contrato via task
    cy.task('db:insertTesttomador', {
      cnpj: empresa.cnpj,
      cpf: responsavel.cpf,
      nome: empresa.nome,
      email: empresa.email,
    }).then((payload: any) => {
      // Aceitar contrato via API (simula aceite do modal)
      cy.request('POST', '/api/contratos', {
        acao: 'aceitar',
        contrato_id: payload.contratoId,
      }).then((resp) => {
        expect(resp.status).to.eq(200);
        expect(resp.body.loginLiberadoImediatamente).to.be.true;
      });
    });

    cy.visit('/login');
    cy.url().should('include', '/login');

    const senhaPadrao = empresa.cnpj.replace(/[./-]/g, '').slice(-6);
    cy.wait(2000);

    cy.get('input[name="cpf"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(responsavel.cpf);
    cy.get('input[name="senha"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(senhaPadrao);
    cy.contains('Entrar').click();

    cy.url({ timeout: 10000 }).should('include', '/entidade');
    cy.contains('Painel Entidade', { timeout: 10000 }).should('be.visible');

    // Limpeza
    cy.task('db:cleanupTestData', {
      cnpj: empresa.cnpj,
      cpf: responsavel.cpf,
    }).then(() => {
      cy.log('Limpeza pós-teste executada');
    });
  });
});
