/**
 * rh-dashboard-bulk-liberar.cy.ts
 *
 * E2E: Dashboard de Gestão de Empresas (/rh) — Liberação em Massa de Ciclos
 *
 * Testa o fluxo completo:
 * 1. Acesso ao dashboard /rh com mock de session RH
 * 2. Renderização da KPI bar
 * 3. Tabela de empresas com checkboxes e elegibilidade
 * 4. Seleção de empresas elegíveis
 * 5. Aparecimento da barra de ações em massa
 * 6. Abertura do modal de confirmação
 * 7. Confirmação e exibição de resultado
 * 8. Busca por nome de empresa
 * 9. Refresh manual com botão
 */

const MOCK_SESSION_RH = {
  cpf: '11111111111',
  nome: 'Gestor RH Teste',
  perfil: 'clinica',
  clinica_id: 1,
  sessionToken: 'test-session-rh',
};

const MOCK_EMPRESAS_OVERVIEW = {
  empresas: [
    {
      id: 101,
      nome: 'Empresa Alpha Ltda',
      cnpj: '12.345.678/0001-00',
      responsavel_nome: 'João Silva',
      responsavel_email: 'joao@alpha.com',
      lote_atual: {
        id: 200,
        numero_ordem: 3,
        status: 'finalizado',
        percentual_conclusao: 100,
        total_avaliacoes: 10,
        avaliacoes_concluidas: 10,
        liberado_em: '2025-01-01T00:00:00Z',
        liberado_por: '11111111111',
      },
      lote_anterior: null,
      elegibilidade: {
        elegivel: true,
        count_elegiveis: 8,
        motivo_bloqueio: null,
      },
      laudos_status: {
        aguardando_emissao: 0,
        aguardando_pagamento: 0,
        pago: 1,
      },
    },
    {
      id: 102,
      nome: 'Beta Serviços S/A',
      cnpj: '98.765.432/0001-00',
      responsavel_nome: 'Maria Costa',
      responsavel_email: 'maria@beta.com',
      lote_atual: {
        id: 201,
        numero_ordem: 1,
        status: 'ativo',
        percentual_conclusao: 40,
        total_avaliacoes: 5,
        avaliacoes_concluidas: 2,
        liberado_em: '2025-03-01T00:00:00Z',
        liberado_por: '11111111111',
      },
      lote_anterior: null,
      elegibilidade: {
        elegivel: false,
        count_elegiveis: 0,
        motivo_bloqueio: 'Lote ativo em andamento',
      },
      laudos_status: {
        aguardando_emissao: 1,
        aguardando_pagamento: 0,
        pago: 0,
      },
    },
  ],
  resumo_kpi: {
    total_empresas: 2,
    lotes_em_andamento: 1,
    percentual_medio_conclusao: 70,
    total_laudos_pendentes: 1,
  },
};

const MOCK_BULK_SUCESSO = {
  sucesso: true,
  total_processado: 1,
  total_liberado: 1,
  total_erros: 0,
  detalhes: [
    {
      empresa_id: 101,
      empresa_nome: 'Empresa Alpha Ltda',
      novo_lote_id: 300,
      numero_ordem: 4,
      avaliacoes_criadas: 8,
      sucesso: true,
    },
  ],
};

describe('E2E: /rh Dashboard — Gestão de Empresas', () => {
  beforeEach(() => {
    // Mock session RH
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: MOCK_SESSION_RH,
    }).as('session');

    // Mock endpoint principal do dashboard
    cy.intercept('GET', '/api/rh/empresas-overview*', {
      statusCode: 200,
      body: MOCK_EMPRESAS_OVERVIEW,
    }).as('empresasOverview');

    cy.visit('/rh');
    cy.wait('@empresasOverview', { timeout: 10000 });
  });

  describe('1. Carregamento da página', () => {
    it('deve exibir título da página', () => {
      cy.contains('Gestão de Empresas').should('be.visible');
    });

    it('deve exibir botão Nova Empresa', () => {
      cy.get('[data-testid="nova-empresa-button"]').should('be.visible');
    });

    it('deve exibir botão de refresh', () => {
      cy.get('button[title="Atualizar dados"]').should('be.visible');
    });

    it('deve exibir KPI bar com 4 cards', () => {
      cy.contains('Total de Empresas').should('be.visible');
      cy.contains('Ciclos em Andamento').should('be.visible');
      cy.contains('Média de Conclusão').should('be.visible');
      cy.contains('Laudos Pendentes').should('be.visible');
    });

    it('KPI deve mostrar valores corretos', () => {
      cy.contains('2').should('be.visible'); // total_empresas
      cy.contains('1').should('be.visible'); // lotes_em_andamento
      cy.contains('70%').should('be.visible'); // percentual_medio
    });
  });

  describe('2. Tabela de empresas', () => {
    it('deve listar as empresas', () => {
      cy.contains('Empresa Alpha Ltda').should('be.visible');
      cy.contains('Beta Serviços S/A').should('be.visible');
    });

    it('deve exibir badges de elegibilidade', () => {
      cy.contains('Elegível').should('be.visible');
      cy.contains('Bloqueado').should('be.visible');
    });

    it('deve mostrar motivo de bloqueio na empresa inelegível', () => {
      cy.contains('Lote ativo em andamento').should('be.visible');
    });

    it('deve exibir progresso da empresa ativa', () => {
      cy.contains('40%').should('be.visible');
    });

    it('deve exibir link para detalhes da empresa', () => {
      // Botão de navegação na linha da empresa
      cy.get('table tbody tr').should('have.length.at.least', 2);
    });
  });

  describe('3. Filtro de busca', () => {
    it('deve filtrar por nome ao digitar', () => {
      cy.intercept('GET', '/api/rh/empresas-overview?busca=Alpha*', {
        statusCode: 200,
        body: {
          ...MOCK_EMPRESAS_OVERVIEW,
          empresas: [MOCK_EMPRESAS_OVERVIEW.empresas[0]],
        },
      }).as('buscaFiltrada');

      cy.get('input[placeholder*="Buscar"]').type('Alpha');
      cy.wait('@buscaFiltrada', { timeout: 5000 });

      cy.contains('Empresa Alpha Ltda').should('be.visible');
    });
  });

  describe('4. Seleção e barra de ações em massa', () => {
    it('checkbox de empresa bloqueada deve estar desabilitado', () => {
      // A empresa Beta tem elegivel: false — seu checkbox deve estar disabled
      cy.get('table tbody tr')
        .eq(1)
        .find('input[type="checkbox"]')
        .should('be.disabled');
    });

    it('checkbox de empresa elegível deve estar habilitado', () => {
      cy.get('table tbody tr')
        .eq(0)
        .find('input[type="checkbox"]')
        .should('not.be.disabled');
    });

    it('barra de ações não deve aparecer sem seleção', () => {
      cy.contains('Liberar Ciclos').should('not.exist');
    });

    it('barra de ações deve aparecer ao selecionar empresa eligível', () => {
      cy.get('table tbody tr').eq(0).find('input[type="checkbox"]').check();
      cy.contains('1 empresa selecionada').should('be.visible');
      cy.contains('Liberar Ciclos').should('be.visible');
    });

    it('deve desmarcar todas ao clicar no X da barra', () => {
      cy.get('table tbody tr').eq(0).find('input[type="checkbox"]').check();
      cy.contains('Liberar Ciclos').should('be.visible');
      cy.get('[title="Desmarcar todas"]').click();
      cy.contains('Liberar Ciclos').should('not.exist');
    });
  });

  describe('5. Modal de confirmação de liberação — Tela de Resumo', () => {
    beforeEach(() => {
      // Selecionar empresa Alpha (elegível)
      cy.get('table tbody tr').eq(0).find('input[type="checkbox"]').check();
    });

    it('deve abrir modal ao clicar em Liberar Ciclos', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Liberar Ciclos de Avaliação').should('be.visible');
    });

    it('modal deve listar a empresa selecionada com contagem de funcionários', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Empresa Alpha Ltda').should('be.visible');
      cy.contains('8 func').should('be.visible');
    });

    it('modal deve exibir botão Avançar na 1ª tela', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Avançar').should('be.visible');
    });

    it('cancelar deve fechar o modal', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Cancelar').click();
      cy.contains('Liberar Ciclos de Avaliação').should('not.exist');
    });

    it('clicar em Avançar deve ir para tela de confirmação final', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Avançar').click();
      cy.contains('irreversível').should('be.visible');
      cy.get('textarea#motivo-liberacao').should('be.visible');
    });

    it('botão Voltar na 2ª tela deve retornar à 1ª tela', () => {
      cy.contains('Liberar Ciclos').click();
      cy.contains('Avançar').click();
      cy.contains('← Voltar').click();
      cy.contains('Avançar').should('be.visible');
      cy.contains('irreversível').should('not.exist');
    });
  });

  describe('6. Fluxo de confirmação e resultado', () => {
    beforeEach(() => {
      cy.get('table tbody tr').eq(0).find('input[type="checkbox"]').check();
      cy.contains('Liberar Ciclos').click();
      // Avançar para a 2ª tela (confirmacao)
      cy.contains('Avançar').click();

      // Mock da API bulk
      cy.intercept('POST', '/api/rh/empresas-bulk/liberar-ciclos', {
        statusCode: 200,
        body: MOCK_BULK_SUCESSO,
      }).as('bulkLiberar');
    });

    it('deve mostrar loading ao confirmar', () => {
      cy.contains('Confirmar Liberação').click();
      cy.contains('Processando liberação').should('be.visible');
    });

    it('deve exibir resultado de sucesso', () => {
      cy.contains('Confirmar Liberação').click();
      cy.wait('@bulkLiberar');
      cy.contains('Resultado da Operação').should('be.visible');
      cy.contains('1').should('be.visible'); // total_liberado
    });

    it('deve exibir detalhes da empresa no resultado', () => {
      cy.contains('Confirmar Liberação').click();
      cy.wait('@bulkLiberar');
      cy.contains('Empresa Alpha Ltda').should('be.visible');
      cy.contains('Ciclo #4').should('be.visible');
      cy.contains('8 avaliações').should('be.visible');
    });

    it('deve fechar modal e recarregar dados ao clicar em Fechar', () => {
      cy.intercept('GET', '/api/rh/empresas-overview*', {
        statusCode: 200,
        body: MOCK_EMPRESAS_OVERVIEW,
      }).as('reload');

      cy.contains('Confirmar Liberação').click();
      cy.wait('@bulkLiberar');
      cy.contains('Fechar').click();

      cy.contains('Resultado da Operação').should('not.exist');
      cy.wait('@reload');
    });
  });

  describe('7. Refresh manual', () => {
    it('deve recarregar dados ao clicar no botão de refresh', () => {
      cy.intercept('GET', '/api/rh/empresas-overview*', {
        statusCode: 200,
        body: MOCK_EMPRESAS_OVERVIEW,
      }).as('refreshDados');

      cy.get('button[title="Atualizar dados"]').click();
      cy.wait('@refreshDados');
    });
  });
});
