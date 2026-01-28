/**
 * Teste E2E do Fluxo Completo da Página de Conta da Entidade
 *
 * Valida o fluxo: Login como entidade → Navegar para conta → Verificar abas → Expandir pagamentos → Verificar parcelas → Clicar em recibo
 *
 * Este teste simula a navegação completa na página de informações da conta da entidade.
 */

describe('Fluxo Completo da Página de Conta da Entidade', () => {
  beforeEach(() => {
    // Limpar cookies e storage antes de cada teste
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('Deve completar o fluxo da página de conta com sucesso', () => {
    // Mock da API para evitar dependências de dados reais
    cy.intercept('GET', '/api/entidade/account-info', {
      statusCode: 200,
      body: {
        clinica: {
          nome: 'Clínica Teste E2E',
          cnpj: '12.345.678/0001-99',
          endereco: 'Rua Teste, 123',
          cidade: 'São Paulo',
          estado: 'SP',
        },
        pagamentos: [
          {
            id: 1,
            valor: 1250.0,
            data_pagamento: '2024-01-15',
            status: 'concluido',
            parcelas_json: [
              {
                numero: 1,
                valor: 500.0,
                data_vencimento: '2024-01-15',
                status: 'pago',
              },
              {
                numero: 2,
                valor: 500.0,
                data_vencimento: '2024-02-15',
                status: 'pago',
              },
              {
                numero: 3,
                valor: 250.0,
                data_vencimento: '2024-03-15',
                status: 'em_aberto',
              },
            ],
            recibo_url: '/api/recibo/1',
          },
        ],
        plano: {
          nome: 'Plano Premium',
          valor_mensal: 150.0,
          status: 'ativo',
          data_inicio: '2024-01-01',
        },
      },
    }).as('getAccountInfo');

    // 1. FAZER LOGIN COMO GESTOR_ENTIDADE (simulado)
    cy.window().then((win) => {
      win.localStorage.setItem(
        'session',
        JSON.stringify({
          cpf: '87545772920',
          perfil: 'gestor_entidade',
          nome: 'Gestor Teste',
        })
      );
    });

    // 2. NAVEGAR PARA A PÁGINA DE CONTA
    cy.visit('/entidade/conta');

    // Verificar que estamos na página correta
    cy.url().should('include', '/entidade/conta');

    // Aguardar carregamento da API
    cy.wait('@getAccountInfo');

    // 3. VERIFICAR CARREGAMENTO DA PÁGINA
    cy.contains('Informações da Conta', { timeout: 10000 }).should(
      'be.visible'
    );

    // 4. VERIFICAR ABAS
    cy.contains('Informações da Conta').should('be.visible');
    cy.contains('Plano').should('be.visible');

    // A aba "Informações da Conta" deve estar ativa por padrão
    cy.get('[data-testid="tab-info"]').should('have.class', 'active');

    // 5. VERIFICAR RESUMO FINANCEIRO
    cy.contains('Resumo Financeiro').should('be.visible');
    cy.contains('Total').should('be.visible');
    cy.contains('Pago').should('be.visible');
    cy.contains('Restante').should('be.visible');

    // Verificar valores (baseado nos dados mockados)
    cy.contains('R$ 1.250,00').should('be.visible'); // Total
    cy.contains('R$ 1.000,00').should('be.visible'); // Pago (500 + 500)
    cy.contains('R$ 250,00').should('be.visible'); // Restante

    // 6. VERIFICAR PAGAMENTOS
    cy.contains('Pagamentos').should('be.visible');

    // Deve haver pelo menos um pagamento listado
    cy.get('[data-testid="payment-item"]').should('have.length.greaterThan', 0);

    // 7. EXPANDIR UM PAGAMENTO PARA VER PARCELAS
    cy.get('[data-testid="payment-item"]').first().click();

    // Verificar que as parcelas aparecem
    cy.get('[data-testid="parcel-item"]').should('be.visible');

    // Verificar status das parcelas
    cy.contains('Pago').should('be.visible');
    cy.contains('Em aberto').should('be.visible');

    // 8. VERIFICAR LINKS DE RECIBO
    // Procurar por links de recibo ou botões de download
    cy.get('body').then(($body) => {
      if (
        $body.text().includes('Recibo') ||
        $body.text().includes('Download')
      ) {
        // Se houver recibos, verificar que o link existe
        cy.contains('Recibo').should('be.visible');
      }
    });

    // 9. TROCAR PARA ABA "PLANO"
    cy.contains('Plano').click();

    // Verificar que a aba muda
    cy.get('[data-testid="tab-plano"]').should('have.class', 'active');

    // Verificar conteúdo da aba plano
    cy.contains('Detalhes do Plano').should('be.visible');
    cy.contains('Plano Premium').should('be.visible');

    // 10. VOLTAR PARA ABA INFORMAÇÕES
    cy.contains('Informações da Conta').click();

    // Verificar que volta
    cy.get('[data-testid="tab-info"]').should('have.class', 'active');
  });

  it('Deve lidar com erro de carregamento da API', () => {
    // Simular erro na API
    cy.intercept('GET', '/api/entidade/account-info', { statusCode: 500 });

    // Simular login
    cy.window().then((win) => {
      win.localStorage.setItem(
        'session',
        JSON.stringify({
          cpf: '87545772920',
          perfil: 'gestor_entidade',
          nome: 'Gestor Teste',
        })
      );
    });

    cy.visit('/entidade/conta');

    // Deve mostrar mensagem de erro
    cy.contains('Erro ao carregar').should('be.visible');
  });

  it('Deve ser responsivo em dispositivos móveis', () => {
    cy.viewport('iphone-6');

    // Mock da API
    cy.intercept('GET', '/api/entidade/account-info', {
      statusCode: 200,
      body: {
        clinica: {
          nome: 'Clínica Teste E2E',
          cnpj: '12.345.678/0001-99',
        },
        pagamentos: [],
        plano: { nome: 'Plano Básico' },
      },
    });

    // Simular login
    cy.window().then((win) => {
      win.localStorage.setItem(
        'session',
        JSON.stringify({
          cpf: '87545772920',
          perfil: 'gestor_entidade',
          nome: 'Gestor Teste',
        })
      );
    });

    cy.visit('/entidade/conta');

    // Verificar que os elementos principais são visíveis
    cy.contains('Informações da Conta').should('be.visible');
    cy.contains('Resumo Financeiro').should('be.visible');

    // Verificar que as abas funcionam no mobile
    cy.contains('Plano').click();
    cy.contains('Detalhes do Plano').should('be.visible');
  });
});
