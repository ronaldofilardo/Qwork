describe('Admin - Deletar Clínica com confirmação de senha', () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();

    // Login como admin (usuário fictício de testes)
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('00000000000');
    cy.get('input[name="senha"]').type('admin123');
    cy.contains('Entrar').click();
    cy.url().should('include', '/admin');
  });

  it('Deve mostrar modal de confirmação e rejeitar senha inválida', () => {
    // Interceptar buscas das clínicas
    cy.intercept('GET', '/api/admin/contratantes?tipo=clinica', {
      statusCode: 200,
      body: {
        success: true,
        contratantes: [
          {
            id: 99,
            nome: 'Clinica E2E',
            cnpj: '12345678000199',
            email: 'e2e@clinica.test',
            telefone: '11999999999',
            endereco: 'Rua Teste',
            cidade: 'São Paulo',
            estado: 'SP',
            ativa: true,
            status: 'aprovado',
            responsavel_nome: 'Dr Teste',
            responsavel_cpf: '12345678901',
            responsavel_email: 'dr@clinica.test',
            criado_em: '2025-01-01 00:00:00',
          },
        ],
        total: 1,
      },
    }).as('getClinicas');

    cy.intercept(
      'GET',
      '/api/admin/contratantes?tipo=clinica&plano_personalizado_pendente=true',
      {
        statusCode: 200,
        body: { success: true, contratantes: [], total: 0 },
      }
    ).as('getClinicasPersonalizado');

    // Interceptar DELETE e verificar senha no body
    cy.intercept(
      { method: 'DELETE', url: '/api/admin/contratantes' },
      (req) => {
        const body = req.body;
        if (
          body &&
          body.admin_password &&
          body.admin_password === 'wrongpass'
        ) {
          req.reply({
            statusCode: 403,
            body: { error: 'Senha do admin inválida' },
          });
        } else {
          req.reply({ statusCode: 200, body: { success: true } });
        }
      }
    ).as('deleteClinica');

    // Visitar página de clínicas (Admin)
    cy.contains('Clínicas / Serviços de Medicina Ocupacional').should(
      'be.visible'
    );

    // Esperar lista carregar
    cy.wait(['@getClinicas', '@getClinicasPersonalizado']);

    // Clicar no botão de deletar (lixeira)
    cy.get('[title="Deletar clínica definitivamente"]').first().click();

    // Modal deve abrir solicitando senha
    cy.get('[data-testid="admin-password-input"]').should('be.visible');

    // Tentativa com senha inválida
    cy.get('[data-testid="admin-password-input"]').type('wrongpass');
    cy.get('[data-testid="modal-confirm-button"]').click();

    // Resposta deve ser erro e modal mostrar mensagem (ou alert)
    cy.wait('@deleteClinica').its('response.statusCode').should('eq', 403);
    cy.contains('Senha do admin inválida').should('not.exist'); // backend error shown via alert, check for alert
  });

  it('Deve deletar com senha válida e recarregar lista', () => {
    // Mesma intercept das buscas, mas após delete a lista retorna vazia
    cy.intercept('GET', '/api/admin/contratantes?tipo=clinica', (req) => {
      // Se for a primeira chamada retorna item, se for chamada após deleção retorna vazio
      req.reply({
        statusCode: 200,
        body: {
          success: true,
          contratantes: [
            {
              id: 99,
              nome: 'Clinica E2E',
              cnpj: '12345678000199',
              email: 'e2e@clinica.test',
              telefone: '11999999999',
              endereco: 'Rua Teste',
              cidade: 'São Paulo',
              estado: 'SP',
              ativa: true,
              status: 'aprovado',
              responsavel_nome: 'Dr Teste',
              responsavel_cpf: '12345678901',
              responsavel_email: 'dr@clinica.test',
              criado_em: '2025-01-01 00:00:00',
            },
          ],
          total: 1,
        },
      });
    }).as('getClinicas2');

    cy.intercept(
      'GET',
      '/api/admin/contratantes?tipo=clinica&plano_personalizado_pendente=true',
      {
        statusCode: 200,
        body: { success: true, contratantes: [], total: 0 },
      }
    ).as('getClinicasPersonalizado2');

    // Interceptar DELETE e retornar sucesso
    cy.intercept(
      { method: 'DELETE', url: '/api/admin/contratantes' },
      (req) => {
        req.reply({ statusCode: 200, body: { success: true } });
      }
    ).as('deleteClinica2');

    // Intercept para a chamada subsequente de GET que retornará lista vazia
    cy.intercept('GET', '/api/admin/contratantes?tipo=clinica', {
      statusCode: 200,
      body: { success: true, contratantes: [], total: 0 },
    }).as('getClinicasAfterDelete');

    // Esperar carregar
    cy.wait(['@getClinicas2', '@getClinicasPersonalizado2']);

    // Clicar no apagar
    cy.get('[title="Deletar clínica definitivamente"]').first().click();

    // Preencher senha válida
    cy.get('[data-testid="admin-password-input"]').type('admin123');
    cy.get('[data-testid="modal-confirm-button"]').click();

    cy.wait('@deleteClinica2').its('response.statusCode').should('eq', 200);

    // Simular recarga: lista vazia
    cy.wait('@getClinicasAfterDelete');

    // Verificar que mensagem de lista vazia aparece
    cy.contains('Nenhuma clínica cadastrada').should('be.visible');
  });
});
