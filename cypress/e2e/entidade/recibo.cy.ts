describe('Recibo flow - Entidade', () => {
  beforeEach(() => {
    cy.seedDatabase();
    cy.loginAsEntidade();
    cy.visit('/entidade/conta');
  });

  it('gera recibo, persiste hash e permite download', () => {
    cy.intercept('POST', '/api/entidade/parcelas/gerar-recibo').as(
      'gerarRecibo'
    );

    // Clicar no primeiro botão Gerar Comprovante disponível
    cy.contains('Gerar Comprovante').first().click();

    cy.wait('@gerarRecibo').its('response.statusCode').should('eq', 200);

    cy.wait('@gerarRecibo').then((interception) => {
      const body = interception.response?.body;
      expect(body).to.have.property('recibo');
      const recibo = body.recibo;
      expect(recibo).to.have.property('id');
      expect(recibo).to.have.property('hash');
      expect(recibo.hash).to.match(/^[a-f0-9]{64}$/);

      // Verificar via endpoint de parcelas que o recibo está associado
      cy.request('/api/entidade/parcelas').then((resp) => {
        expect(resp.status).to.eq(200);
        const parcelas = resp.body.parcelas || [];
        const found = parcelas.find(
          (p: any) => p.recibo && p.recibo.id === recibo.id
        );
        expect(found).to.exist;
        expect(found.recibo.hash).to.eq(recibo.hash);
      });

      // Baixar recibo diretamente pela rota de download e validar headers/conteúdo
      cy.request({
        url: `/api/entidade/parcelas/download-recibo?id=${recibo.id}`,
        encoding: 'utf8',
      }).then((dresp) => {
        expect(dresp.status).to.eq(200);
        expect(dresp.headers['content-disposition']).to.include('attachment');
        expect(dresp.body).to.include(recibo.numero_recibo || 'REC-');
      });
    });
  });
});
