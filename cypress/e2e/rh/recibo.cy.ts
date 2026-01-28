describe('Recibo flow - RH (Clínica)', () => {
  beforeEach(() => {
    cy.seedDatabase();
    // Criar sessão RH vinculada à clínica de teste (clinica_id = 49 é usado em fixtures)
    cy.request('POST', '/api/test/session', {
      cpf: '11111111111',
      nome: 'Pedro Oliveira',
      perfil: 'rh',
    }).then((resp) => {
      expect(resp.status).to.eq(200);
      cy.getCookie('bps-session').should('exist');
    });
    cy.visit('/rh/conta');
  });

  it('gera recibo, persiste hash e permite download (RH)', () => {
    cy.intercept('POST', '/api/rh/parcelas/gerar-recibo').as('gerarReciboRh');

    cy.contains('Gerar Comprovante').first().click();

    cy.wait('@gerarReciboRh').its('response.statusCode').should('eq', 200);

    cy.wait('@gerarReciboRh').then((interception) => {
      const body = interception.response?.body;
      expect(body).to.have.property('recibo');
      const recibo = body.recibo;
      expect(recibo).to.have.property('id');
      expect(recibo).to.have.property('hash');
      expect(recibo.hash).to.match(/^[a-f0-9]{64}$/);

      // Verificar via endpoint RH parcelas
      cy.request('/api/rh/parcelas').then((resp) => {
        expect(resp.status).to.eq(200);
        const parcelas = resp.body.parcelas || [];
        const found = parcelas.find(
          (p: any) => p.recibo && p.recibo.id === recibo.id
        );
        expect(found).to.exist;
        expect(found.recibo.hash).to.eq(recibo.hash);
      });

      // Baixar recibo via endpoint RH
      cy.request({
        url: `/api/rh/parcelas/download-recibo?id=${recibo.id}`,
        encoding: 'utf8',
      }).then((dresp) => {
        expect(dresp.status).to.eq(200);
        expect(dresp.headers['content-disposition']).to.include('attachment');
        expect(dresp.body).to.include(recibo.numero_recibo || 'REC-');
      });
    });
  });
});
