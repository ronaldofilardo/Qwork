describe('Entidade - Inativar Avaliação (E2E confiável)', () => {
  it('abre card, inativa avaliação e recarrega funcionários', () => {
    // Criar sessão de teste como gestor_entidade
    cy.request('POST', '/api/test/session', {
      cpf: '22222222222',
      nome: 'Gestor Entidade Teste',
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Flag para controlar resposta do GET do lote (antes/depois da inativação)
    let inactivated = false;

    const initialLote = {
      lote: { id: 1, codigo: 'LOT-E2E-001', titulo: 'Lote Teste E2E' },
      funcionarios: [
        {
          cpf: '12345678901',
          nome: 'Miguel Barbosa',
          setor: 'Administrativo',
          funcao: 'Assistente',
          nivel_cargo: 'operacional',
          avaliacao: {
            id: 11,
            status: 'pendente',
            data_inicio: '2026-01-03T00:00:00Z',
            data_conclusao: null,
          },
        },
      ],
    };

    const updatedLote = {
      lote: { id: 1, codigo: 'LOT-E2E-001', titulo: 'Lote Teste E2E' },
      funcionarios: [
        {
          cpf: '12345678901',
          nome: 'Miguel Barbosa',
          setor: 'Administrativo',
          funcao: 'Assistente',
          nivel_cargo: 'operacional',
          avaliacao: {
            id: 11,
            status: 'inativada',
            data_inicio: '2026-01-03T00:00:00Z',
            data_conclusao: null,
          },
        },
      ],
    };

    // Interceptar lista de lotes
    cy.intercept('GET', '/api/entidade/lotes', {
      statusCode: 200,
      body: {
        lotes: [
          {
            id: 1,
            codigo: 'LOT-E2E-001',
            titulo: 'Lote Teste E2E',
            tipo: 'avaliacao_psicossocial',
            status: 'ativo',
            total_funcionarios: 1,
            funcionarios_concluidos: 0,
            data_criacao: new Date().toISOString(),
          },
        ],
      },
    }).as('getLotes');

    // Interceptar GET do lote, respondendo diferente antes/depois com base na flag
    cy.intercept('GET', '/api/entidade/lote/1', (req) => {
      if (!inactivated) {
        req.reply({ statusCode: 200, body: initialLote });
      } else {
        req.reply({ statusCode: 200, body: updatedLote });
      }
    }).as('getLote');

    // Intercept para validação (GET quando modal abre)
    cy.intercept('GET', /\/api\/avaliacoes\/inativar\?avaliacao_id=\d+/, {
      statusCode: 200,
      body: { permitido: true },
    }).as('getValidacao');

    // Intercept para POST inativar - quando recebido, marca flag e responde sucesso
    cy.intercept('POST', '/api/avaliacoes/inativar', (req) => {
      // Mark as inactivated so subsequent GET returns updated data
      inactivated = true;
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          message: 'Avaliação inativada com sucesso',
          avaliacao_id: 11,
        },
      });
    }).as('postInativar');

    // Visitar página de lotes e esperar dados
    cy.visit('/entidade/lotes');
    cy.wait('@getLotes');

    // Expande o card (clica no título -> toggle)
    cy.contains('Lote Teste E2E', { timeout: 10000 }).click();

    // Aguarda carregamento dos funcionários
    cy.contains('Funcionários (1)', { timeout: 10000 }).should('be.visible');

    // Verifica presença do botão Inativar
    cy.contains('🚫 Inativar').should('be.visible');

    // Mock confirm para aceitar a confirmação do browser
    cy.on('window:confirm', () => true);

    // Abrir modal
    cy.contains('🚫 Inativar').click();

    // Validação pré-inativação é solicitada
    cy.wait('@getValidacao');

    // Modal aparece
    cy.contains('⚠️ Inativar Avaliação').should('be.visible');

    // Preenche motivo e submete
    cy.get('textarea').type('Motivo de teste para inativação automatizada');
    cy.contains('✅ Confirmar Inativação').click();

    // Espera o POST de inativação e o recarregamento do lote
    cy.wait('@postInativar');
    cy.wait('@getLote');

    // Modal fecha e status atualiza para Inativada
    cy.contains('⚠️ Inativar Avaliação').should('not.exist');
    cy.contains('Inativada', { timeout: 10000 }).should('be.visible');
    cy.contains('🚫 Inativar').should('not.exist');
  });
});
