describe('Entidade - Lote sem scroll horizontal em desktop', () => {
  it('não deve mostrar barra de rolagem horizontal em viewport desktop', () => {
    cy.viewport(1366, 768);
    cy.visit('/entidade/lote/6');

    // aguardar tabela carregar
    cy.get('table').should('be.visible');

    cy.get('.overflow-x-auto').then(($el) => {
      const el = $el[0] as HTMLElement;
      // scrollWidth > clientWidth indica overflow horizontal
      expect(el.scrollWidth).to.be.lte(el.clientWidth + 2); // allow 2px tolerance
    });
  });
});
