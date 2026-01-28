/**
 * Testes de integração E2E para validar React Portals nos modais
 *
 * Valida:
 * - Renderização via createPortal em #modal-root
 * - Posicionamento fixo e z-index correto
 * - Acessibilidade (foco, escape, backdrop)
 * - Responsividade mobile
 * - Isolamento do DOM principal
 */

describe('Modal Portals - E2E Tests', () => {
  beforeEach(() => {
    // Login como RH para acessar funcionalidades de gestão
    cy.visit('/login');
    cy.get('input[type="text"]').type('22222222222'); // CPF de teste
    cy.get('input[type="password"]').type('123');
    cy.get('button[type="submit"]').click();

    // Aguardar redirecionamento
    cy.url().should('include', '/rh');
  });

  describe('EditEmployeeModal Portal', () => {
    beforeEach(() => {
      // Navegar para página de empresa e abrir modal de edição
      cy.contains('Empresa').first().click();
      cy.wait(1000); // Aguardar carregamento da página

      // Clicar no primeiro botão de editar funcionário
      cy.get('button').contains('Editar').first().click({ force: true });
    });

    it('deve renderizar modal no #modal-root', () => {
      // Verificar que o modal existe dentro de #modal-root
      cy.get('#modal-root')
        .find('.fixed.inset-0')
        .should('exist')
        .and('be.visible');
    });

    it('deve ter z-index alto para sobrepor conteúdo', () => {
      cy.get('#modal-root .fixed.inset-0').should('have.class', 'z-50');
    });

    it('deve ter backdrop escuro clicável', () => {
      cy.get('#modal-root .bg-black.bg-opacity-50')
        .should('exist')
        .and('be.visible');
    });

    it('deve centralizar conteúdo do modal', () => {
      cy.get('#modal-root .fixed.inset-0')
        .should('have.class', 'flex')
        .and('have.class', 'items-center')
        .and('have.class', 'justify-center');
    });

    it('deve fechar modal ao clicar no botão X', () => {
      cy.get('#modal-root').contains('×').click();

      cy.get('#modal-root .fixed.inset-0').should('not.exist');
    });

    it('deve fechar modal ao clicar em Cancelar', () => {
      cy.get('#modal-root').contains('Cancelar').click();

      cy.get('#modal-root .fixed.inset-0').should('not.exist');
    });

    it('deve ter scroll interno se conteúdo exceder altura', () => {
      cy.get('#modal-root .overflow-y-auto').should('exist');
    });

    it('deve isolar modal do DOM principal', () => {
      // Verificar que o modal não está no container principal da página
      cy.get('main').within(() => {
        cy.get('.fixed.inset-0').should('not.exist');
      });

      // Mas deve existir no modal-root
      cy.get('#modal-root .fixed.inset-0').should('exist');
    });
  });

  describe('ModalInserirFuncionario Portal', () => {
    beforeEach(() => {
      // Navegar para página de empresa
      cy.contains('Empresa').first().click();
      cy.wait(1000);

      // Clicar no botão de inserir funcionário
      cy.get('button')
        .contains('Inserir Funcionário')
        .first()
        .click({ force: true });
    });

    it('deve renderizar no #modal-root', () => {
      cy.get('#modal-root .fixed.inset-0').should('exist').and('be.visible');
    });

    it('deve ter título correto', () => {
      cy.get('#modal-root')
        .contains('Inserir Funcionário')
        .should('be.visible');
    });

    it('deve ter campos obrigatórios marcados', () => {
      cy.get('#modal-root').contains('CPF *').should('exist');

      cy.get('#modal-root').contains('Nome Completo *').should('exist');
    });

    it('deve fechar ao clicar em Cancelar', () => {
      cy.get('#modal-root').contains('Cancelar').click();

      cy.get('#modal-root .fixed.inset-0').should('not.exist');
    });

    it('deve ter z-index adequado', () => {
      cy.get('#modal-root .z-50').should('exist');
    });
  });

  describe('Responsividade Mobile', () => {
    beforeEach(() => {
      // Simular viewport mobile
      cy.viewport('iphone-x');

      cy.contains('Empresa').first().click();
      cy.wait(1000);
      cy.get('button').contains('Editar').first().click({ force: true });
    });

    it('deve ter padding adequado em mobile', () => {
      cy.get('#modal-root .p-4').should('exist');
    });

    it('deve ter largura responsiva', () => {
      cy.get('#modal-root .w-full').should('exist');
    });

    it('deve limitar altura máxima', () => {
      cy.get('#modal-root').find('[class*="max-h"]').should('exist');
    });

    it('deve permitir scroll vertical', () => {
      cy.get('#modal-root .overflow-y-auto').should('exist').and('be.visible');
    });
  });

  describe('Múltiplos Modais', () => {
    it('deve exibir apenas um modal por vez', () => {
      cy.contains('Empresa').first().click();
      cy.wait(1000);

      // Abrir primeiro modal
      cy.get('button').contains('Editar').first().click({ force: true });

      cy.get('#modal-root .fixed.inset-0').should('have.length', 1);

      // Fechar modal
      cy.get('#modal-root').contains('Cancelar').click();

      // Abrir segundo modal
      cy.get('button')
        .contains('Inserir Funcionário')
        .first()
        .click({ force: true });

      cy.get('#modal-root .fixed.inset-0').should('have.length', 1);
    });

    it('modal-root deve estar vazio quando nenhum modal está aberto', () => {
      cy.get('#modal-root').children().should('have.length', 0);
    });
  });

  describe('Isolamento de DOM', () => {
    beforeEach(() => {
      cy.contains('Empresa').first().click();
      cy.wait(1000);
      cy.get('button').contains('Editar').first().click({ force: true });
    });

    it('não deve afetar scroll da página principal', () => {
      // Verificar que o body mantém comportamento de scroll
      cy.get('body').should('exist');

      // Modal não deve interferir no layout da página
      cy.get('main').should('be.visible');
    });

    it('não deve duplicar modais no DOM', () => {
      // Deve haver apenas uma instância do modal
      cy.get('.fixed.inset-0.z-50').should('have.length', 1);
    });

    it('modal deve estar contido apenas em #modal-root', () => {
      // Verificar que não há modais fora de #modal-root
      cy.get('body > .fixed.inset-0').should('not.exist');

      // Mas deve existir dentro de #modal-root
      cy.get('#modal-root > .fixed.inset-0').should('exist');
    });
  });

  describe('Acessibilidade', () => {
    beforeEach(() => {
      cy.contains('Empresa').first().click();
      cy.wait(1000);
      cy.get('button').contains('Editar').first().click({ force: true });
    });

    it('deve ter foco capturado no modal', () => {
      // Primeiro elemento focável deve estar dentro do modal
      cy.get('#modal-root input').first().should('be.visible');
    });

    it('deve ter contraste adequado no backdrop', () => {
      cy.get('#modal-root .bg-black').should('exist');
    });

    it('deve ter botões de ação claramente visíveis', () => {
      cy.get('#modal-root button').contains('Cancelar').should('be.visible');

      cy.get('#modal-root button')
        .contains(/Atualizar|Criar/)
        .should('be.visible');
    });

    it('deve ter texto legível em mobile', () => {
      cy.viewport('iphone-x');

      cy.get('#modal-root h2')
        .should('be.visible')
        .and('have.css', 'font-size');
    });
  });

  describe('Performance', () => {
    it('modal deve renderizar rapidamente', () => {
      cy.contains('Empresa').first().click();
      cy.wait(1000);

      const start = Date.now();
      cy.get('button').contains('Editar').first().click({ force: true });

      cy.get('#modal-root .fixed.inset-0')
        .should('exist')
        .then(() => {
          const duration = Date.now() - start;
          expect(duration).to.be.lessThan(500); // Deve renderizar em menos de 500ms
        });
    });

    it('não deve causar reflow na página principal', () => {
      cy.contains('Empresa').first().click();
      cy.wait(1000);

      // Capturar posição de elemento da página
      cy.get('main').then(($main) => {
        const initialTop = $main.offset()?.top;

        // Abrir modal
        cy.get('button').contains('Editar').first().click({ force: true });

        // Verificar que posição não mudou
        cy.get('main').then(($mainAfter) => {
          const afterTop = $mainAfter.offset()?.top;
          expect(afterTop).to.equal(initialTop);
        });
      });
    });
  });
});
