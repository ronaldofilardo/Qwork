/**
 * Testes E2E para fluxo de liberação de lote
 * - Acesso ao modal de liberação
 * - Preenchimento de formulário
 * - Validações de campos
 * - Submissão e feedback de sucesso/erro
 * - Navegação pós-criação
 */

describe('Fluxo de Liberação de Lote', () => {
  const empresaId = 1;
  const empresaNome = 'Empresa Teste E2E';

  beforeEach(() => {
    // Mock da sessão de autenticação
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      },
    }).as('getSession');

    // Mock das empresas
    cy.intercept('GET', '/api/rh/empresas', {
      statusCode: 200,
      body: [
        {
          id: empresaId,
          nome: empresaNome,
          cnpj: '12345678000190',
          ativa: true,
        },
      ],
    }).as('getEmpresas');

    // Mock dos lotes existentes
    cy.intercept('GET', `/api/rh/lotes*`, {
      statusCode: 200,
      body: {
        success: true,
        lotes: [],
        total: 0,
      },
    }).as('getLotes');

    // Mock do endpoint de login (garante que o fluxo de login prossiga e gere /api/auth/session)
    cy.intercept('POST', '/api/auth/login', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          redirectTo: `/rh/empresa/${empresaId}?tab=lotes`,
          perfil: 'rh',
        },
      });
    }).as('postLogin');

    // Login e navegação
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@getSession');
    cy.visit(`/rh/empresa/${empresaId}?tab=lotes`);
    cy.wait('@getEmpresas');
    cy.wait('@getLotes');
  });

  describe('Acesso ao Modal', () => {
    it('deve exibir botão "Iniciar Novo Ciclo" na tela de lotes', () => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').should('be.visible');
    });

    it('deve abrir modal ao clicar no botão', () => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();

      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Iniciar Ciclo de Coletas Avaliativas').should('be.visible');
      cy.contains(empresaNome).should('be.visible');
    });

    it('deve fechar modal ao clicar no X', () => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.get('button[aria-label="Fechar modal"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve fechar modal ao clicar em Cancelar', () => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.contains('button', 'Cancelar').click();
      cy.get('[role="dialog"]').should('not.exist');
    });
  });

  describe('Campos do Formulário', () => {
    beforeEach(() => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('deve exibir caixa informativa sobre elegibilidade', () => {
      cy.contains('Sistema de Elegibilidade Automática').should('be.visible');
      cy.contains('Funcionários novos').should('be.visible');
      cy.contains('Índices atrasados').should('be.visible');
    });

    it('deve ter tipo "Completo" selecionado por padrão', () => {
      cy.get('input[name="tipo"][value="completo"]').should('be.checked');
    });

    it('deve permitir seleção de tipo de lote', () => {
      cy.contains('label', 'Operacional').click();
      cy.get('input[name="tipo"][value="operacional"]').should('be.checked');

      cy.contains('label', 'Gestão').click();
      cy.get('input[name="tipo"][value="gestao"]').should('be.checked');

      cy.contains('label', 'Completo').click();
      cy.get('input[name="tipo"][value="completo"]').should('be.checked');
    });

    it('deve permitir entrada de título opcional', () => {
      cy.get('#titulo').type('Avaliação Anual 2026');
      cy.get('#titulo').should('have.value', 'Avaliação Anual 2026');
    });

    it('deve permitir entrada de descrição opcional', () => {
      cy.get('#descricao').type('Descrição do lote de teste E2E');
      cy.get('#descricao').should(
        'have.value',
        'Descrição do lote de teste E2E'
      );
    });

    it('deve permitir seleção de data filtro', () => {
      cy.get('#dataFiltro').type('2026-01-01');
      cy.get('#dataFiltro').should('have.value', '2026-01-01');
    });

    it('não deve permitir data futura no filtro', () => {
      const hoje = new Date().toISOString().split('T')[0];
      cy.get('#dataFiltro').should('have.attr', 'max', hoje);
    });
  });

  describe('Submissão do Formulário', () => {
    beforeEach(() => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('deve enviar requisição com dados corretos', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        expect(req.body).to.deep.equal({
          empresaId: empresaId,
          tipo: 'completo',
        });

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            message: 'Lote 1 (001-010126) liberado com sucesso!',
            lote: {
              id: 1,
              numero_ordem: 1,
              titulo: 'Lote 1 - 001-010126',
              tipo: 'completo',
              liberado_em: new Date().toISOString(),
            },
            estatisticas: {
              avaliacoesCreated: 10,
              totalFuncionarios: 10,
              empresa: empresaNome,
            },
            resumoInclusao: {
              funcionarios_novos: 5,
              indices_atrasados: 3,
              mais_de_1_ano_sem_avaliacao: 2,
              renovacoes_regulares: 0,
              prioridade_critica: 1,
              prioridade_alta: 2,
              mensagem: 'Incluindo automaticamente: 3 funcionários',
            },
          },
        });
      }).as('liberarLote');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLote');
    });

    it('deve incluir título e descrição quando fornecidos', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        expect(req.body.titulo).to.equal('Teste E2E');
        expect(req.body.descricao).to.equal('Descrição E2E');

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarComTitulo');

      cy.get('#titulo').type('Teste E2E');
      cy.get('#descricao').type('Descrição E2E');
      cy.contains('button', 'Iniciar Ciclo').click();

      cy.wait('@liberarComTitulo');
    });

    it('deve exibir loading durante submissão', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarComDelay');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.contains('button', 'Liberando...').should('be.visible');
      cy.contains('button', 'Liberando...').should('be.disabled');

      cy.wait('@liberarComDelay');
    });

    it('deve exibir mensagem de sucesso após liberação', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Lote 1 (001-010126) liberado com sucesso!',
          lote: {
            id: 1,
            numero_ordem: 1,
            titulo: 'Lote 1',
            tipo: 'completo',
            liberado_em: new Date().toISOString(),
          },
        },
      }).as('liberarSucesso');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarSucesso');

      cy.contains('Lote liberado com sucesso!').should('be.visible');
      cy.contains('001-010126').should('be.visible');
      cy.contains('Lote nº: 1').should('be.visible');
    });

    it('fecha modal e navega para a página do lote após sucesso (fluxo RH)', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          lote: { id: 42, numero_ordem: 1 },
        },
      }).as('liberarNav');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarNav');

      // Deve navegar para a página do lote recém-criado
      cy.url().should('include', '/rh/empresa/1/lote/42');

      // Modal deve ser fechado
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve exibir mensagem de erro em caso de falha', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 400,
        body: {
          success: false,
          error: 'Nenhum funcionário elegível encontrado',
        },
      }).as('liberarErro');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarErro');

      cy.contains('Erro ao Iniciar Ciclo').should('be.visible');
      cy.contains('Nenhum funcionário elegível encontrado').should(
        'be.visible'
      );
    });

    it('deve redirecionar para detalhes do lote após sucesso', () => {
      const loteId = 42;

      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Lote liberado!',
          lote: {
            id: loteId,
            numero_ordem: 42,
            titulo: 'Lote 42',
            tipo: 'completo',
            liberado_em: new Date().toISOString(),
          },
        },
      }).as('liberarParaRedirecionar');

      // Mock da página de detalhes do lote
      cy.intercept('GET', `/api/rh/lote/${loteId}*`, {
        statusCode: 200,
        body: { success: true, lote: { id: loteId } },
      }).as('getDetalhesLote');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarParaRedirecionar');

      // Aguardar redirecionamento
      cy.url().should('include', `/rh/empresa/${empresaId}/lote/${loteId}`);
    });
  });

  describe('Validações e Edge Cases', () => {
    beforeEach(() => {
      cy.contains('button', '🚀 Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('não deve fechar modal ao clicar fora durante loading', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        req.reply({
          delay: 2000,
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarLento');

      cy.contains('button', 'Iniciar Ciclo').click();

      // Tentar clicar fora do modal
      cy.get('[role="dialog"]').parent().click({ force: true });

      // Modal deve continuar aberto
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('deve desabilitar campos durante loading', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', (req) => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarParaDesabilitar');

      cy.contains('button', 'Iniciar Ciclo').click();

      cy.get('#titulo').should('be.disabled');
      cy.get('#descricao').should('be.disabled');
      cy.get('input[name="tipo"]').should('be.disabled');
      cy.get('#dataFiltro').should('be.disabled');
    });

    it('deve exibir resumo de inclusão quando disponível', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          lote: { id: 1, numero_ordem: 1 },
          resumoInclusao: {
            funcionarios_novos: 10,
            indices_atrasados: 5,
            mais_de_1_ano_sem_avaliacao: 3,
            renovacoes_regulares: 2,
            prioridade_critica: 4,
            prioridade_alta: 6,
            mensagem: 'Teste',
          },
          estatisticas: {
            avaliacoesCreated: 20,
            totalFuncionarios: 20,
            empresa: empresaNome,
          },
        },
      }).as('liberarComResumo');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarComResumo');

      cy.contains('Resumo da Liberação').should('be.visible');
      cy.contains('Novos:').parent().contains('10').should('be.visible');
      cy.contains('Atrasados:').parent().contains('5').should('be.visible');
      cy.contains('Total:').parent().contains('20').should('be.visible');
    });

    it('deve exibir aviso para funcionários com prioridade crítica', () => {
      cy.intercept('POST', '/api/rh/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          lote: { id: 1, numero_ordem: 1 },
          resumoInclusao: {
            funcionarios_novos: 0,
            indices_atrasados: 0,
            mais_de_1_ano_sem_avaliacao: 0,
            renovacoes_regulares: 0,
            prioridade_critica: 7,
            prioridade_alta: 0,
            mensagem: 'Teste',
          },
        },
      }).as('liberarComCriticos');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarComCriticos');

      cy.contains('7 funcionário(s) com prioridade CRÍTICA').should(
        'be.visible'
      );
    });
  });
});
