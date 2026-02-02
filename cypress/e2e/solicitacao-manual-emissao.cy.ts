/**
 * Teste E2E: Fluxo Completo de Solicitação Manual de Emissão
 *
 * Simula o fluxo completo desde a criação do lote até a emissão manual:
 * 1. RH libera lote
 * 2. Avaliações são concluídas
 * 3. Lote muda para 'concluido'
 * 4. Botão de solicitação aparece
 * 5. RH solicita emissão
 * 6. Laudo é gerado
 */

describe('E2E: Fluxo Completo de Solicitação Manual', () => {
  beforeEach(() => {
    // Login como RH
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('senha-teste');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/rh');
  });

  it('deve completar fluxo desde liberação até emissão manual', () => {
    // 1. Acessar empresa
    cy.visit('/rh/empresa/1');
    cy.contains('Dashboard').should('be.visible');

    // 2. Liberar novo lote
    cy.contains('button', 'Liberar Novo Lote').click();
    cy.get('input[name="titulo"]').type('Lote Teste E2E - Emissão Manual');
    cy.get('select[name="tipo"]').select('completo');
    cy.contains('button', 'Liberar Lote').click();

    // 3. Aguardar confirmação e obter ID do lote
    cy.contains('Lote liberado com sucesso').should('be.visible');

    // 4. Acessar o lote criado
    cy.contains('Lote Teste E2E').click();

    // 5. Verificar que lote está ativo (ainda não concluído)
    cy.contains('Status: ativo', { matchCase: false }).should('be.visible');

    // 6. Botão de solicitação NÃO deve aparecer ainda
    cy.contains('button', 'Solicitar Emissão do Laudo').should('not.exist');

    // 7. Concluir todas as avaliações (simulado via API)
    cy.window().then((win) => {
      const loteId = win.location.pathname.split('/').pop();
      cy.request('POST', `/api/test/concluir-todas-avaliacoes/${loteId}`);
    });

    // 8. Recarregar página para ver mudança de status
    cy.reload();

    // 9. Verificar que lote mudou para 'concluido'
    cy.contains('Status: concluido', { matchCase: false }).should('be.visible');

    // 10. Botão de solicitação DEVE aparecer
    cy.contains('Solicitar Emissão do Laudo', { timeout: 10000 }).should(
      'be.visible'
    );

    // 11. Card verde destacado deve estar visível
    cy.contains('Lote Concluído').should('be.visible');
    cy.contains('Todas as avaliações foram finalizadas').should('be.visible');

    // 12. Clicar no botão de solicitar emissão
    cy.contains('button', 'Solicitar Emissão do Laudo').click();

    // 13. Confirmar no modal
    cy.on('window:confirm', () => true);

    // 14. Aguardar mensagem de sucesso
    cy.contains('Emissão solicitada com sucesso', { timeout: 15000 }).should(
      'be.visible'
    );

    // 15. Botão deve desaparecer (lote não está mais 'concluido')
    cy.contains('button', 'Solicitar Emissão do Laudo', {
      timeout: 5000,
    }).should('not.exist');

    // 16. Verificar que status mudou para 'finalizado'
    cy.reload();
    cy.contains('Status: finalizado', {
      matchCase: false,
      timeout: 10000,
    }).should('be.visible');

    // 17. Verificar que laudo está disponível
    cy.contains('Laudo disponível', { timeout: 5000 }).should('be.visible');

    // 18. Botão de download deve estar disponível
    cy.contains('button', 'Baixar Laudo').should('be.visible');
  });

  it('deve bloquear segunda solicitação de emissão', () => {
    // 1. Acessar lote já concluído
    cy.visit('/rh/empresa/1/lote/123'); // ID de lote de teste pré-existente

    // 2. Verificar que está concluído
    cy.contains('Status: concluido', { matchCase: false }).should('be.visible');

    // 3. Clicar em solicitar emissão
    cy.contains('button', 'Solicitar Emissão do Laudo').click();
    cy.on('window:confirm', () => true);

    // 4. Aguardar sucesso
    cy.contains('Emissão solicitada com sucesso').should('be.visible');

    // 5. Tentar solicitar novamente (via API direta)
    cy.window().then((win) => {
      const loteId = win.location.pathname.split('/').pop();
      cy.request({
        method: 'POST',
        url: `/api/lotes/${loteId}/solicitar-emissao`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.equal(400);
        expect(response.body.error).to.include('já foi emitido');
      });
    });
  });

  it('deve exibir botão para entidade também', () => {
    // 1. Logout e login como entidade
    cy.visit('/logout');
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('98765432100'); // CPF de entidade
    cy.get('input[name="senha"]').type('senha-entidade');
    cy.get('button[type="submit"]').click();

    // 2. Acessar lista de lotes
    cy.visit('/entidade/lotes');

    // 3. Encontrar lote concluído
    cy.contains('Status: concluido', { matchCase: false })
      .parents('.bg-gray-50')
      .within(() => {
        // 4. Verificar que botão está visível
        cy.contains('Solicitar Emissão do Laudo').should('be.visible');
      });
  });

  it('deve mostrar feedback visual adequado durante loading', () => {
    cy.visit('/rh/empresa/1/lote/456'); // Lote concluído de teste

    // 1. Interceptar API para adicionar delay
    cy.intercept('POST', '/api/lotes/*/solicitar-emissao', (req) => {
      req.reply((res) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(res);
          }, 2000);
        });
      });
    });

    // 2. Clicar no botão
    cy.contains('button', 'Solicitar Emissão do Laudo').click();
    cy.on('window:confirm', () => true);

    // 3. Verificar spinner de loading
    cy.get('svg.animate-spin').should('be.visible');
    cy.contains('Solicitando emissão...').should('be.visible');

    // 4. Botão deve estar disabled durante loading
    cy.contains('button', 'Solicitando emissão...').should('be.disabled');

    // 5. Aguardar conclusão
    cy.contains('Emissão solicitada com sucesso', { timeout: 5000 }).should(
      'be.visible'
    );
  });

  it('deve validar permissões - RH não pode solicitar lote de outra empresa', () => {
    // 1. Login como RH da empresa 1
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('12345678901');
    cy.get('input[name="senha"]').type('senha-teste');
    cy.get('button[type="submit"]').click();

    // 2. Tentar acessar lote de outra empresa via API
    cy.request({
      method: 'POST',
      url: '/api/lotes/789/solicitar-emissao', // Lote da empresa 2
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(403);
      expect(response.body.error).to.include('Sem permissão');
    });
  });

  it('deve criar notificação após solicitação bem-sucedida', () => {
    cy.visit('/rh/empresa/1/lote/123');

    // 1. Solicitar emissão
    cy.contains('button', 'Solicitar Emissão do Laudo').click();
    cy.on('window:confirm', () => true);

    // 2. Aguardar sucesso
    cy.contains('Emissão solicitada com sucesso').should('be.visible');

    // 3. Acessar área de notificações
    cy.visit('/rh/notificacoes');

    // 4. Verificar que notificação foi criada
    cy.contains('Emissão do laudo').should('be.visible');
    cy.contains('solicitada com sucesso').should('be.visible');
  });

  it('deve funcionar quando lote conclui por inativação', () => {
    // 1. Criar lote com 2 avaliações
    cy.visit('/rh/empresa/1');
    cy.contains('button', 'Liberar Novo Lote').click();
    cy.get('input[name="titulo"]').type(
      'Lote Teste - Conclusão por Inativação'
    );
    cy.contains('button', 'Liberar Lote').click();

    cy.contains('Lote Teste - Conclusão por Inativação').click();

    // 2. Concluir 1 avaliação
    cy.get('table tbody tr')
      .first()
      .within(() => {
        cy.contains('button', 'Concluir').click();
      });

    // 3. Inativar a segunda avaliação
    cy.get('table tbody tr')
      .eq(1)
      .within(() => {
        cy.contains('button', 'Inativar').click();
      });

    cy.get('textarea[name="motivo"]').type(
      'Funcionário desligado durante avaliação'
    );
    cy.contains('button', 'Confirmar Inativação').click();

    // 4. Aguardar recálculo de status
    cy.wait(2000);
    cy.reload();

    // 5. Verificar que lote está concluído
    cy.contains('Status: concluido', { matchCase: false }).should('be.visible');

    // 6. Botão de solicitação deve aparecer
    cy.contains('Solicitar Emissão do Laudo').should('be.visible');

    // 7. Solicitar emissão deve funcionar normalmente
    cy.contains('button', 'Solicitar Emissão do Laudo').click();
    cy.on('window:confirm', () => true);
    cy.contains('Emissão solicitada com sucesso', { timeout: 15000 }).should(
      'be.visible'
    );
  });
});
