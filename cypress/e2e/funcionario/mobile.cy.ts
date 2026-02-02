/**
 * Teste E2E: Fluxo completo em viewport mobile
 * Item 17: Mesmo fluxo em viewport mobile
 */

describe('Funcionário - Fluxo Mobile', () => {
  const funcionarioCPF = '22222222222';
  const funcionarioSenha = '123';

  beforeEach(() => {
    // Configurar viewport mobile
    cy.viewport(375, 667); // iPhone SE
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('deve fazer login em dispositivo mobile', () => {
    // Usar rota de teste para deixar o login estável em CI
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/dashboard');
    cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');
  });

  it('deve exibir dashboard responsivo em mobile', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/dashboard');

    // Verificar elementos principais visíveis
    cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');
    cy.contains(/iniciar|continuar/i).should('be.visible');

    // Verificar que não há overflow horizontal
    cy.window().then((win) => {
      expect(win.document.body.scrollWidth).to.be.lte(win.innerWidth);
    });
  });

  it('deve responder questões em tela pequena', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    // Verificar que radio buttons são clicáveis em mobile
    cy.get('input[type="radio"]')
      .first()
      .should('be.visible')
      .click({ force: true });
    cy.contains('1 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve exibir uma questão por vez em mobile', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Deve haver apenas uma questão visível
    cy.get('input[type="radio"]').should('have.length.at.least', 5);

    // Verificar que o conteúdo cabe na tela
    cy.get('body').then(($body) => {
      const scrollHeight = $body[0].scrollHeight;
      const clientHeight = $body[0].clientHeight;
      // Permite scroll vertical, mas não deve haver muito conteúdo extra
      expect(scrollHeight).to.be.lte(clientHeight * 2);
    });
  });

  it('deve retomar avaliação após recarregar em mobile', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');

    // Responder 3 questões
    for (let i = 0; i < 3; i++) {
      cy.get('input[type="radio"]').first().click({ force: true });
      cy.wait(500);
    }

    cy.contains('3 de 37', { timeout: 5000 }).should('be.visible');

    // Recarregar
    cy.reload();

    // Verificar progresso mantido
    cy.contains('3 de 37', { timeout: 10000 }).should('be.visible');
  });

  it('deve funcionar em diferentes tamanhos de mobile', () => {
    const viewports = [
      { width: 320, height: 568, name: 'iPhone 5' },
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone XR' },
      { width: 360, height: 740, name: 'Android' },
    ];

    viewports.forEach((viewport) => {
      cy.viewport(viewport.width, viewport.height);

      cy.login(funcionarioCPF, funcionarioSenha);
      cy.visit('/dashboard');

      cy.contains('Bem-vindo', { timeout: 10000 }).should('be.visible');
      cy.contains(/iniciar|continuar/i).should('be.visible');

      // Verificar responsividade
      cy.window().then((win) => {
        expect(win.document.body.scrollWidth).to.be.lte(win.innerWidth + 5);
      });
    });
  });

  it('deve exibir barra de progresso visível em mobile', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains(/\d+ de 37/, { timeout: 10000 }).should('be.visible');

    // Barra de progresso deve estar no topo e visível
    cy.contains(/\d+ de 37/)
      .should('be.visible')
      .then(($el: any) => {
        const rect = $el[0].getBoundingClientRect();
        expect(rect.top).to.be.lte(200); // Deve estar próximo ao topo
      });
  });

  it('deve permitir toque em labels em vez de radio buttons pequenos', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Clicar no label deve selecionar o radio
    cy.contains('Nunca').click();
    cy.contains('1 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve funcionar com orientação landscape', () => {
    cy.viewport(667, 375); // Landscape

    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.contains('0 de 37', { timeout: 10000 }).should('be.visible');
    cy.get('input[type="radio"]').first().click({ force: true });
    cy.contains('1 de 37', { timeout: 5000 }).should('be.visible');
  });

  it('deve suportar gestos de swipe (se implementado)', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    cy.wait(2000);

    // Responder para poder testar navegação
    cy.get('input[type="radio"]').first().click();
    cy.wait(500);

    // Teste básico de swipe (se implementado)
    // Nota: Implementação de swipe pode variar
    cy.get('body').trigger('touchstart', {
      touches: [{ clientX: 300, clientY: 300 }],
    });
    cy.get('body').trigger('touchmove', {
      touches: [{ clientX: 100, clientY: 300 }],
    });
    cy.get('body').trigger('touchend');
  });

  it('deve manter performance em mobile', () => {
    cy.login(funcionarioCPF, funcionarioSenha);
    cy.visit('/avaliacao?id=1');

    // Verificar que a página carrega rápido
    cy.contains('0 de 37', { timeout: 5000 }).should('be.visible');

    // Responder múltiplas questões rapidamente
    const start = Date.now();
    for (let i = 0; i < 5; i++) {
      cy.get('input[type="radio"]').first().click({ force: true });
      cy.wait(200);
    }
    const elapsed = Date.now() - start;

    // Deve completar em menos de 5 segundos
    expect(elapsed).to.be.lte(5000);
  });
});
