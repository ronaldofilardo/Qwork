describe('Entidade - Inativar Avaliação (fluxo básico)', () => {
  it('deve exibir coluna Inativar e abrir modal', () => {
    // Logar como gestor de entidade (sessão de teste com contratante_id)
    cy.request('POST', '/api/test/session', {
      cpf: '22222222222',
      nome: 'Gestor Entidade Teste',
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Interceptar API de lotes para garantir que exista um lote com funcionários (evita depender de seed)
    cy.intercept('GET', '/api/entidade/lotes', {
      statusCode: 200,
      body: {
        lotes: [
          {
            id: 1,
            titulo: 'Lote Teste Entidade',
            tipo: 'avaliacao_psicossocial',
            status: 'ativo',
            total_funcionarios: 1,
            funcionarios_concluidos: 0,
            criado_em: new Date().toISOString(),
          },
        ],
      },
    });

    // Interceptar detalhes do lote
    cy.intercept('GET', '/api/entidade/lote/1', {
      statusCode: 200,
      body: {
        lote: { id: 1, titulo: 'Lote Teste Entidade' },
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
      },
    });

    // Navegar para a lista de lotes (ajuste a rota conforme dados de teste)
    cy.visit('/');
    cy.url().should('not.include', '/login');

    // Ir diretamente para a página de detalhes do lote (navegação do botão 'Detalhes')
    cy.visit('/entidade/lote/1');

    // Verificar que a página do lote carregou
    cy.contains('Lote Teste Entidade', { timeout: 10000 });

    // Verificar que a tabela de funcionários está presente e visível
    cy.get('table', { timeout: 15000 }).should('be.visible');

    // Verificar que as colunas principais estão presentes
    cy.contains('th', 'Nome').should('be.visible');
    cy.contains('th', 'Status').should('be.visible');

    // Verificar coluna Inativar está visível
    cy.contains('th', 'Inativar').should('be.visible');

    // Clicar no botão de inativar do primeiro funcionário disponível
    cy.contains('🚫 Inativar').first().click({ force: true });

    // Verificar modal de inativação
    cy.contains('⚠️ Inativar Avaliação');
  });
});
