describe('RH - Emissão e Bloqueio de Inativação (E2E)', () => {
  it('quando lote já tem laudo emitido, Inativar é bloqueado na UI e validação backend retorna proibido', () => {
    // Criar sessão de teste como RH
    cy.request('POST', '/api/test/session', {
      cpf: '04703084945',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });

    // Mock: lista de lotes
    cy.intercept('GET', '/api/rh/lotes*', {
      statusCode: 200,
      body: {
        success: true,
        lotes: [
          {
            id: 1,
            codigo: 'LOT-E2E-EMITIDO',
            titulo: 'Lote Emitido E2E',
            tipo: 'completo',
            status: 'emitido',
            liberado_em: new Date().toISOString(),
          },
        ],
      },
    }).as('getLotes');

    // Mock: detalhes do lote com emitido_em setado e 1 funcionário
    cy.intercept('GET', '/api/rh/lotes/1/funcionarios*', {
      statusCode: 200,
      body: {
        success: true,
        lote: {
          id: 1,
          codigo: 'LOT-E2E-EMITIDO',
          titulo: 'Lote Emitido E2E',
          tipo: 'completo',
          status: 'emitido',
          liberado_em: new Date().toISOString(),
          emitido_em: new Date().toISOString(),
        },
        estatisticas: {
          total_avaliacoes: 1,
          avaliacoes_concluidas: 1,
          avaliacoes_inativadas: 0,
          avaliacoes_pendentes: 0,
        },
        funcionarios: [
          {
            cpf: '99988877766',
            nome: 'Usuário Emitido',
            setor: 'TI',
            funcao: 'Dev',
            matricula: '010',
            turno: 'Diurno',
            escala: '8h',
            avaliacao: {
              id: 20,
              status: 'concluida',
              data_inicio: '2025-12-01T08:00:00',
              data_conclusao: '2025-12-02T10:00:00',
            },
          },
        ],
      },
    }).as('getLoteDetalhes');

    // Intercept validation GET for inativar: backend says not permitted and evaluation.lote_emitido = true
    cy.intercept('GET', /\/api\/avaliacoes\/inativar\?avaliacao_id=\d+/, {
      statusCode: 200,
      body: {
        permitido: false,
        motivo: 'Laudo emitido',
        pode_forcar: false,
        avaliacao: { lote_emitido: true },
      },
    }).as('getValidacaoInativar');

    // Intercept POST inativar to ensure backend is not called (or if called, returns 400)
    cy.intercept('POST', '/api/avaliacoes/inativar', (req) => {
      req.reply({ statusCode: 400, body: { success: false, error: 'Lote emitido - imutável' } });
    }).as('postInativar');

    // Navegar para página de detalhes do lote
    cy.visit('/login');
    cy.get('input[name="cpf"]').type('04703084945');
    cy.get('input[name="senha"]').type('123');
    cy.get('button[type="submit"]').click();

    cy.wait('@getLotes');
    cy.visit('/rh/empresa/1/lote/1');
    cy.wait('@getLoteDetalhes');

    // Verificar que o botão 'Inativar' NÃO está visível
    cy.contains('🚫 Inativar').should('not.exist');

    // Verificar via backend validation que a avaliação está bloqueada (emissão)
    cy.request({
      method: 'GET',
      url: '/api/avaliacoes/inativar?avaliacao_id=20',
      failOnStatusCode: false,
    }).then((resp) => {
      expect(resp.status).to.equal(200);
      expect(resp.body.permitido).to.be.false;
      expect(resp.body.avaliacao?.lote_emitido).to.be.true;
    });
  });
});