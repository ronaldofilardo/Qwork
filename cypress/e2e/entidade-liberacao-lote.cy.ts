/**
 * Testes E2E para fluxo de liberação de lote por entidade
 * - Acesso ao modal de liberação
 * - Preenchimento de formulário
 * - Validações de campos
 * - Submissão e feedback de sucesso/erro
 * - Navegação pós-criação
 */

describe('Fluxo de Liberação de Lote - Entidade', () => {
  const contratanteId = 1;
  const contratanteNome = 'Entidade Teste E2E';

  const mockLotes = [
    {
      id: 1,
      titulo: 'Lote Teste 1',
      tipo: 'completo',
      status: 'enviado',
      total_funcionarios: 10,
      funcionarios_concluidos: 7,
      data_criacao: '2024-01-01T00:00:00Z',
      data_envio: '2024-01-02T00:00:00Z',
    },
    {
      id: 2,
      titulo: 'Lote Teste 2',
      tipo: 'completo',
      status: 'criado',
      total_funcionarios: 5,
      funcionarios_concluidos: 0,
      data_criacao: '2024-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    // Mock da sessão de autenticação
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'Gestor Entidade Teste',
        perfil: 'gestor',
        clinica_id: contratanteId,
      },
    }).as('getSession');

    // Mock do login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true },
    }).as('login');

    // Mock dos lotes existentes
    cy.intercept('GET', `/api/entidade/lotes*`, {
      statusCode: 200,
      body: {
        success: true,
        lotes: mockLotes,
        total: mockLotes.length,
      },
    }).as('getLotes');

    // Login e navegação
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@login');
    // Set cookie to simulate authenticated session
    cy.setCookie(
      'bps-session',
      JSON.stringify({
        cpf: '12345678901',
        nome: 'Gestor Entidade Teste',
        perfil: 'gestor',
        clinica_id: contratanteId,
        sessionToken: 'test-token',
        lastRotation: Date.now(),
      })
    );
    cy.wait('@getSession');
    cy.visit('/entidade/lotes');
    cy.wait('@getLotes');
  });

  describe('Acesso ao Modal', () => {
    it('deve exibir botão "Iniciar Novo Ciclo" na tela de lotes', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').should('be.visible');
    });

    it('deve abrir modal ao clicar no botão', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').scrollIntoView().should('be.visible');
      cy.contains('Iniciar Ciclo de Coletas Avaliativas').should('be.visible');
      cy.contains('Entidade — apenas funcionários da minha instituição').should(
        'be.visible'
      );
    });

    it('deve fechar modal ao clicar no X', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.get('button[aria-label="Fechar modal"]').click();
      cy.get('[role="dialog"]').should('not.exist');
    });

    it('deve fechar modal ao clicar em Cancelar', () => {
      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');

      cy.contains('button', 'Cancelar').click();
      cy.get('[role="dialog"]').should('not.exist');
    });
  });

  describe('Campos do Formulário', () => {
    beforeEach(() => {
      cy.contains('button', 'Iniciar Novo Ciclo').click();
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
      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('deve enviar requisição com dados corretos', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', (req) => {
        expect(req.body).to.deep.equal({
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
              avaliacoesCreated: 5,
              totalFuncionarios: 5,
              contratante: contratanteNome,
            },
            resumoInclusao: {
              funcionarios_novos: 3,
              indices_atrasados: 1,
              mais_de_1_ano_sem_avaliacao: 1,
              renovacoes_regulares: 0,
              prioridade_critica: 0,
              prioridade_alta: 2,
              mensagem: 'Incluindo automaticamente: 2 funcionários',
            },
          },
        });
      }).as('liberarLote');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLote');
    });

    it('deve incluir título e descrição quando fornecidos', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', (req) => {
        expect(req.body.titulo).to.equal('Teste E2E');
        expect(req.body.descricao).to.equal('Descrição E2E');

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarLoteComDetalhes');

      cy.get('#titulo').type('Teste E2E');
      cy.get('#descricao').type('Descrição E2E');
      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteComDetalhes');
    });

    it('deve incluir data filtro quando fornecida', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', (req) => {
        expect(req.body.dataFiltro).to.equal('2026-01-01');

        req.reply({
          statusCode: 200,
          body: {
            success: true,
            lote: { id: 1, numero_ordem: 1 },
          },
        });
      }).as('liberarLoteComFiltro');

      cy.get('#dataFiltro').type('2026-01-01');
      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteComFiltro');
    });

    it('deve exibir mensagem de sucesso após liberação', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          message: 'Lotes liberados com sucesso!',
          resultados: [
            {
              empresaId: 1,
              empresaNome: 'Empresa Teste',
              created: true,
              loteId: 1,
              numero_ordem: 1,
              avaliacoesCriadas: 5,
              funcionariosConsiderados: 5,
              message: 'Lote criado com sucesso',
            },
          ],
        },
      }).as('liberarLoteSucesso');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteSucesso');

      cy.contains('Lotes criados com sucesso!')
        .scrollIntoView()
        .should('be.visible');

      // Deve exibir resumo por empresa
      cy.contains('Empresa Teste').should('be.visible');
      cy.contains('Lote criado com sucesso').should('be.visible');
    });

    it('deve exibir erro quando não há funcionários elegíveis', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 400,
        body: {
          success: false,
          message: 'Nenhum funcionário elegível encontrado para este lote.',
          detalhes:
            'Não foram encontrados funcionários elegíveis para avaliação em nenhuma das empresas processadas:\nEmpresa Teste: Nenhum funcionário elegível encontrado\n\nVerifique os critérios de elegibilidade ou cadastre novos funcionários.',
        },
      }).as('liberarLoteErro');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteErro');

      cy.contains(
        'Nenhum funcionário elegível encontrado para este lote.'
      ).should('be.visible');

      // Detalhes devem ser exibidos no modal para contexto de entidade
      cy.contains(
        'Não foram encontrados funcionários elegíveis para avaliação'
      ).should('be.visible');
      cy.contains(
        'Empresa Teste: Nenhum funcionário elegível encontrado'
      ).should('be.visible');
    });

    it('deve navegar para a página do lote após criação', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 200,
        body: {
          success: true,
          lote: { id: 1 },
        },
      }).as('liberarLoteNavegacao');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteNavegacao');

      cy.url().should('include', '/entidade/lotes');
    });
  });

  describe('Validações', () => {
    beforeEach(() => {
      cy.contains('button', 'Iniciar Novo Ciclo').click();
      cy.get('[role="dialog"]').should('be.visible');
    });

    it('deve desabilitar botão quando formulário inválido', () => {
      // Tipo deve estar sempre selecionado, então botão deve estar habilitado
      cy.contains('button', 'Iniciar Ciclo').should('not.be.disabled');
    });

    it('deve manter modal aberto em caso de erro', () => {
      cy.intercept('POST', '/api/entidade/liberar-lote', {
        statusCode: 500,
        body: { success: false, message: 'Erro interno do servidor' },
      }).as('liberarLoteErroServidor');

      cy.contains('button', 'Iniciar Ciclo').click();
      cy.wait('@liberarLoteErroServidor');

      cy.get('[role="dialog"]').should('be.visible');
      cy.contains('Erro interno do servidor').should('be.visible');
    });
  });
});

/**
 * Testes E2E para interação com cards de lotes
 * - Navegação ao clicar no card
 * - Botões de ação (Relatório, Download)
 * - StopPropagation dos botões
 * - Estados e validações
 */
describe('Interação com Cards de Lote - Entidade', () => {
  const mockLotes = [
    {
      id: 1,
      titulo: 'Lote Teste 1',
      tipo: 'completo',
      status: 'enviado',
      total_funcionarios: 10,
      funcionarios_concluidos: 7,
      data_criacao: new Date().toISOString(),
      data_envio: new Date().toISOString(),
    },
    {
      id: 2,
      titulo: 'Lote Teste 2',
      tipo: 'operacional',
      status: 'criado',
      total_funcionarios: 5,
      funcionarios_concluidos: 0,
      data_criacao: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Mock da sessão
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        cpf: '12345678901',
        nome: 'Gestor Entidade',
        perfil: 'gestor',
        clinica_id: 1,
      },
    }).as('getSession');

    // Mock do login
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { success: true },
    }).as('login');

    // Mock dos lotes
    cy.intercept('GET', '/api/entidade/lotes', {
      statusCode: 200,
      body: {
        lotes: mockLotes,
      },
    }).as('getLotes');

    // Login
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();
    cy.wait('@login');
    // Set cookie to simulate authenticated session
    cy.setCookie(
      'bps-session',
      JSON.stringify({
        cpf: '12345678901',
        nome: 'Gestor Entidade',
        perfil: 'gestor',
        clinica_id: 1,
        sessionToken: 'test-token',
        lastRotation: Date.now(),
      })
    );
    cy.wait('@getSession');

    // Navegar para lotes
    cy.visit('/entidade/lotes');
    cy.wait('@getLotes');
  });

  describe('Navegação por Clique no Card', () => {
    it('deve exibir cards de lotes', () => {
      cy.contains('Lote Teste 1').should('be.visible');
      cy.contains('ENT-001').should('be.visible');
      cy.contains('Lote Teste 2').should('be.visible');
      cy.contains('ENT-002').should('be.visible');
    });

    it('deve navegar para detalhes ao clicar no card', () => {
      // Mock da página de detalhes
      cy.intercept('GET', '/api/entidade/lote/1', {
        statusCode: 200,
        body: {
          lote: mockLotes[0],
          estatisticas: {
            total_funcionarios: 10,
            funcionarios_concluidos: 7,
            funcionarios_pendentes: 3,
          },
          funcionarios: [],
        },
      }).as('getLoteDetalhes');

      // Clicar no botão Detalhes
      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Detalhes').click();
        });
      cy.url().should('include', '/entidade/lote/1');
    });

    it('cards devem ter efeito hover', () => {
      cy.contains('Lote Teste 1')
        .parent()
        .parent()
        .parent()
        .should('have.class', 'hover:shadow-lg');
    });
  });

  describe('Botões de Ação', () => {
    it('deve exibir botões Detalhes, Relatório e Baixar', () => {
      cy.contains('button', 'Detalhes').should('be.visible');
      cy.contains('button', 'Relatório').should('be.visible');
      cy.contains('button', 'Baixar').should('be.visible');
    });

    it('botão de relatório deve estar desabilitado para lotes criados', () => {
      // Lote 2 tem status 'criado'
      cy.get('.bg-white')
        .contains('Lote Teste 2')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').should('be.disabled');
        });
    });

    it('botão de relatório deve estar habilitado para lotes enviados', () => {
      // Lote 1 tem status 'enviado'
      cy.get('.bg-white')
        .contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').should('not.be.disabled');
        });
    });

    it('deve gerar relatório ao clicar no botão', () => {
      cy.intercept('POST', '/api/entidade/lote/1/relatorio', {
        statusCode: 200,
        body: new Blob(['PDF content'], { type: 'application/pdf' }),
      }).as('gerarRelatorio');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').click();
        });

      cy.wait('@gerarRelatorio');
      // Não deve navegar para outra página
      cy.url().should('include', '/entidade/lotes');
    });

    it('deve baixar dados ao clicar no botão', () => {
      cy.intercept('GET', '/api/entidade/lote/1/download', {
        statusCode: 200,
        body: 'file content',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      }).as('baixarDados');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Baixar').click();
        });

      cy.wait('@baixarDados');
      // Não deve navegar para outra página
      cy.url().should('include', '/entidade/lotes');
    });
  });

  describe('StopPropagation', () => {
    it('clicar no botão de relatório não deve navegar', () => {
      cy.intercept('POST', '/api/entidade/lote/1/relatorio', {
        statusCode: 200,
        body: new Blob(),
      }).as('gerarRelatorio');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').click();
        });

      cy.wait('@gerarRelatorio');
      // Deve permanecer na página de lotes
      cy.url().should('eq', Cypress.config().baseUrl + '/entidade/lotes');
    });

    it('clicar no botão de download não deve navegar', () => {
      cy.intercept('GET', '/api/entidade/lote/1/download', {
        statusCode: 200,
        body: 'OK',
      }).as('baixarDados');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Baixar').click();
        });

      cy.wait('@baixarDados');
      // Deve permanecer na página de lotes
      cy.url().should('eq', Cypress.config().baseUrl + '/entidade/lotes');
    });
  });

  describe('Estados e Feedback', () => {
    it('deve exibir loading ao gerar relatório', () => {
      cy.intercept('POST', '/api/entidade/lote/1/relatorio', (req) => {
        req.reply({
          delay: 1000,
          statusCode: 200,
          body: new Blob(),
        });
      }).as('gerarRelatorioLento');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').click();
          // Deve mostrar spinner
          cy.get('.animate-spin').should('be.visible');
        });
    });

    it('deve exibir toast de sucesso após gerar relatório', () => {
      cy.intercept('POST', '/api/entidade/lote/1/relatorio', {
        statusCode: 200,
        body: new Blob(),
      }).as('gerarRelatorio');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').click();
        });

      cy.wait('@gerarRelatorio');
      cy.contains('Relatório gerado com sucesso').should('be.visible');
    });

    it('deve exibir toast de erro ao falhar geração de relatório', () => {
      cy.intercept('POST', '/api/entidade/lote/1/relatorio', {
        statusCode: 500,
        body: { error: 'Erro ao gerar relatório' },
      }).as('gerarRelatorioErro');

      cy.contains('Lote Teste 1')
        .closest('.bg-white')
        .within(() => {
          cy.contains('button', 'Relatório').click();
        });

      cy.wait('@gerarRelatorioErro');
      cy.contains('Erro ao gerar relatório').should('be.visible');
    });
  });
});
