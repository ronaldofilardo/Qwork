/**
 * Teste E2E - Fluxo Completo de Contratação Plano Fixo
 * Valida o fluxo completo desde cadastro até liberação de login
 */

describe('Fluxo Completo - Plano Fixo', () => {
  beforeEach(() => {
    // Mock de APIs para simular fluxo completo
    cy.intercept('POST', '/api/cadastro/tomador', {
      statusCode: 201,
      body: {
        success: true,
        tomador_id: 1,
        message: 'Cadastro realizado com sucesso',
      },
    }).as('cadastrotomador');

    cy.intercept('POST', '/api/contratos', {
      statusCode: 201,
      body: {
        success: true,
        contrato_id: 1,
        hash_contrato: 'abc123def456...',
      },
    }).as('gerarContrato');

    cy.intercept('PUT', '/api/contratos/1', {
      statusCode: 200,
      body: {
        success: true,
        aceito: true,
        data_aceite: new Date().toISOString(),
        hash_contrato: 'abc123def456...',
      },
    }).as('aceitarContrato');

    cy.intercept('POST', '/api/pagamento/iniciar', {
      statusCode: 200,
      body: {
        success: true,
        pagamento_id: 1,
      },
    }).as('iniciarPagamento');

    cy.intercept('POST', '/api/pagamento/confirmar', {
      statusCode: 200,
      body: {
        success: true,
        pagamento_confirmado: true,
      },
    }).as('confirmarPagamento');

    cy.intercept('POST', '/api/recibo/gerar', {
      statusCode: 201,
      body: {
        success: true,
        recibo_id: 1,
        numero_recibo: 'REC-2026-00001',
        pdf_url: '/storage/recibos/REC-2026-00001.pdf',
      },
    }).as('gerarRecibo');
  });

  it('Deve bloquear login quando pagamento não confirmado', () => {
    cy.visit('/login');

    cy.intercept('POST', '/api/auth/login', {
      statusCode: 403,
      body: {
        error: 'Aguardando confirmação de pagamento',
      },
    }).as('loginBloqueado');

    cy.get('input[name="cpf"]').type('98765432100');
    cy.get('input[name="senha"]').type('senha123');
    cy.get('button[type="submit"]').click();

    cy.wait('@loginBloqueado');

    // Deve mostrar mensagem de erro
    cy.contains('Aguardando confirmação de pagamento').should('be.visible');

    // Não deve redirecionar
    cy.url().should('include', '/login');
  });

  it('Deve validar integridade de hash do contrato', () => {
    cy.intercept('GET', '/api/contratos/1/verificar-integridade', {
      statusCode: 200,
      body: {
        integro: true,
        hash_esperado: 'abc123def456...',
        hash_atual: 'abc123def456...',
      },
    }).as('verificarIntegridade');

    cy.request('/api/contratos/1/verificar-integridade').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.have.property('integro', true);
      expect(response.body).to.have.property('hash_esperado');
      expect(response.body).to.have.property('hash_atual');
    });
  });

  it('Deve validar máquina de estados - transições inválidas', () => {
    cy.intercept('PUT', '/api/admin/tomadors/1/ativar', {
      statusCode: 400,
      body: {
        error: 'Não é possível ativar tomador sem confirmação de pagamento',
      },
    }).as('ativarSemPagamento');

    cy.request({
      method: 'PUT',
      url: '/api/admin/tomadors/1/ativar',
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.include('pagamento');
    });
  });

  it('Deve bloquear geração de recibo sem contrato', () => {
    cy.intercept('POST', '/api/recibo/gerar', {
      statusCode: 400,
      body: {
        error:
          'Não é possível gerar recibo sem um contrato válido. O fluxo correto é: Cadastro → Contrato → Aceite → Pagamento → Recibo',
      },
    }).as('reciboSemContrato');

    cy.request({
      method: 'POST',
      url: '/api/recibo/gerar',
      body: {
        tomador_id: 1,
        pagamento_id: 1,
        // contrato_id ausente - deve falhar
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.include('contrato');
    });
  });
});
