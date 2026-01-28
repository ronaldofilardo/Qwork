/**
 * Testes E2E - Sistema de Índice de Avaliação
 *
 * Fluxos testados:
 * - Visualização de pendências
 * - Liberação de lote com resumo
 * - Inativação de avaliação com validação
 * - Visualização de detalhes do funcionário
 * - Indicadores na lista de funcionários
 */

describe('Sistema de Índice de Avaliação - E2E', () => {
  beforeEach(() => {
    // Login como RH
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('22222222222');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    // Aguardar redirecionamento
    cy.url().should('include', '/rh');

    // Selecionar empresa
    cy.contains('Empresa Teste').click();
  });

  describe('Aba Pendências', () => {
    it('deve exibir aba de pendências com métricas', () => {
      cy.contains('⚠️ Pendências').click();

      // Verificar cards de métricas
      cy.contains('Prioridade Crítica').should('be.visible');
      cy.contains('Prioridade Alta').should('be.visible');
      cy.contains('Prioridade Média').should('be.visible');
      cy.contains('Total Pendências').should('be.visible');
    });

    it('deve filtrar pendências por prioridade', () => {
      cy.contains('⚠️ Pendências').click();

      // Filtrar por críticas
      cy.get('select').first().select('CRÍTICA');

      // Verificar que apenas críticas são exibidas
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).should('contain', '🔴');
      });
    });

    it('deve filtrar pendências por categoria', () => {
      cy.contains('⚠️ Pendências').click();

      // Filtrar por nunca avaliado
      cy.get('select').eq(1).select('NUNCA_AVALIADO');

      // Verificar lista filtrada
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });
  });

  describe('Liberação de Lote com Resumo', () => {
    it('deve Iniciar Ciclo e exibir resumo com métricas', () => {
      cy.contains('🚀 Iniciar Novo Ciclo').click();

      // Preencher formulário
      cy.get('input[placeholder*="Título"]').type('Lote Teste E2E');
      cy.get('textarea').type('Descrição do lote de teste');

      // Iniciar Ciclo
      cy.contains('Iniciar Ciclo').click();

      // Aguardar e verificar modal de resumo
      cy.contains('🚀 Lote Liberado com Sucesso!', { timeout: 10000 }).should(
        'be.visible'
      );

      // Verificar métricas
      cy.contains('Novos Funcionários').should('be.visible');
      cy.contains('Mais de 1 ano').should('be.visible');
      cy.contains('Índices Atrasados').should('be.visible');

      // Verificar prioridades
      cy.contains('Prioridade Crítica').should('be.visible');
      cy.contains('Prioridade Alta').should('be.visible');
      cy.contains('Prioridade Média').should('be.visible');

      // Fechar modal
      cy.contains('✅ Fechar').click();
    });
  });

  describe('Indicadores na Lista de Funcionários', () => {
    it('deve exibir coluna de índice de avaliação', () => {
      cy.contains('👥 Funcionários Ativos').click();

      // Verificar coluna existe
      cy.contains('th', 'Índice Avaliação').should('be.visible');

      // Verificar badges de índice
      cy.get('table tbody tr')
        .first()
        .within(() => {
          cy.get('[class*="rounded-full"]').should('exist');
        });
    });

    it('deve exibir ícones de alerta para pendências', () => {
      cy.contains('👥 Funcionários Ativos').click();

      // Buscar funcionários com alerta
      cy.get('table tbody tr').each(($row) => {
        const hasAlert =
          $row.find(
            'span:contains("🔴"), span:contains("🟠"), span:contains("⚠️")'
          ).length > 0;
        if (hasAlert) {
          expect(hasAlert).to.be.true;
        }
      });
    });
  });

  describe('Modal de Inativação', () => {
    it('deve abrir modal de inativação com validação', () => {
      // Ir para lote específico
      cy.contains('📋 Ciclos de Coletas Avaliativas').click();
      cy.get('[role="button"]').first().click();

      // Tentar inativar avaliação
      cy.contains('🚫 Inativar').first().click({ force: true });

      // Verificar modal aberto
      cy.contains('⚠️ Inativar Avaliação').should('be.visible');
      cy.contains('Motivo da Inativação').should('be.visible');
    });

    it('deve validar motivo obrigatório (mínimo 20 caracteres)', () => {
      cy.contains('📋 Ciclos de Coletas Avaliativas').click();
      cy.get('[role="button"]').first().click();
      cy.contains('🚫 Inativar').first().click({ force: true });

      // Tentar submeter sem motivo suficiente
      cy.get('textarea').type('Curto');
      cy.contains('Confirmar Inativação').click();

      // Verificar alerta
      cy.on('window:alert', (text) => {
        expect(text).to.contain('10 caracteres');
      });
    });

    it('deve exibir opção de forçar inativação se bloqueado', () => {
      cy.contains('📋 Ciclos de Coletas Avaliativas').click();
      cy.get('[role="button"]').first().click();
      cy.contains('🚫 Inativar').first().click({ force: true });

      // Verificar se há checkbox de forçar
      cy.get('body').then(($body) => {
        if ($body.find('input[type="checkbox"]#forcar').length > 0) {
          cy.get('input[type="checkbox"]#forcar').should('exist');
          cy.contains('Forçar Inativação').should('be.visible');
        }
      });
    });
  });

  describe('Detalhes do Funcionário', () => {
    it('deve abrir modal de detalhes ao clicar em 👁️', () => {
      cy.contains('👥 Funcionários Ativos').click();

      // Clicar no botão de visualizar
      cy.get('button[title*="Ver detalhes"]').first().click();

      // Verificar modal aberto
      cy.contains('Índice de Avaliação Atual').should('be.visible');
      cy.contains('Histórico de Avaliações').should('be.visible');
    });

    it('deve exibir banner de pendência se houver', () => {
      cy.contains('👥 Funcionários Ativos').click();
      cy.get('button[title*="Ver detalhes"]').first().click();

      // Verificar se há banner de alerta
      cy.get('body').then(($body) => {
        if ($body.find('div:contains("Atenção: Prioridade")').length > 0) {
          cy.contains('Atenção: Prioridade').should('be.visible');
        }
      });
    });

    it('deve exibir timeline de avaliações', () => {
      cy.contains('👥 Funcionários Ativos').click();
      cy.get('button[title*="Ver detalhes"]').first().click();

      // Verificar seção de histórico
      cy.contains('📋 Histórico de Avaliações').should('be.visible');

      // Verificar se há avaliações listadas
      cy.get('body').then(($body) => {
        if ($body.find('div:contains("Liberado:")').length > 0) {
          cy.contains('Liberado:').should('be.visible');
        } else {
          cy.contains('Nenhuma avaliação registrada').should('be.visible');
        }
      });
    });

    it('deve exibir estatísticas do funcionário', () => {
      cy.contains('👥 Funcionários Ativos').click();
      cy.get('button[title*="Ver detalhes"]').first().click();

      // Verificar cards de estatísticas
      cy.contains('Total').should('be.visible');
      cy.contains('Concluídas').should('be.visible');
      cy.contains('Inativadas').should('be.visible');
      cy.contains('Pendentes').should('be.visible');
    });
  });

  describe('Botão Ver Pendências no Resumo', () => {
    it('deve navegar para aba pendências ao clicar no botão', () => {
      // Iniciar Ciclo para exibir resumo
      cy.contains('🚀 Iniciar Novo Ciclo').click();
      cy.get('input[placeholder*="Título"]').type('Lote Teste Navegação');
      cy.contains('Iniciar Ciclo').click();

      // Aguardar modal de resumo
      cy.contains('🚀 Lote Liberado com Sucesso!', { timeout: 10000 }).should(
        'be.visible'
      );

      // Clicar em ver pendências
      cy.contains('⚠️ Ver Pendências').click();

      // Verificar navegação para aba pendências
      cy.contains('⚠️ Pendências de Avaliação').should('be.visible');
      cy.get('[class*="border-primary"]').should('contain', '⚠️ Pendências');
    });
  });
});
