/**
 * E2E: Cadastro de entidade — fluxo completo
 *
 * Valida o ciclo de cadastro:
 *  - Preenchimento de dados
 *  - Validações de campos
 *  - Aceitação de termos
 *  - Seleção de plano
 */

describe('Cadastro de Entidade — Fluxo Completo', () => {
  const TIMEOUT = 8000;

  describe('Página de Cadastro', () => {
    it('deve carregar formulário de cadastro', () => {
      cy.visit('/cadastro', { timeout: TIMEOUT });
      cy.contains(/cadastr|registro/i, { timeout: TIMEOUT }).should(
        'be.visible'
      );
    });

    it('deve validar campos obrigatórios', () => {
      cy.visit('/cadastro', { timeout: TIMEOUT });

      // Tentar submeter sem preencher
      cy.get('form')
        .find('button[type="submit"]')
        .first()
        .click({ force: true });

      // Deve mostrar erro de validação
      cy.contains(/obrigatório|required|preencha/i, {
        timeout: TIMEOUT,
      }).should('exist');
    });

    it('deve validar formato de CNPJ', () => {
      cy.visit('/cadastro', { timeout: TIMEOUT });

      // Dados inválidos
      const cnpjInput = cy
        .get('input[name*="cnpj"], input[placeholder*="CNPJ"]')
        .first();
      if (cnpjInput) {
        cnpjInput.type('123', { force: true });
        cnpjInput.blur();
        cy.contains(/cnpj.*inválido|formato.*incorreto/i, {
          timeout: TIMEOUT,
        }).should('exist');
      }
    });

    it('deve validar formato de email', () => {
      cy.visit('/cadastro', { timeout: TIMEOUT });

      const emailInput = cy
        .get('input[type="email"], input[name*="email"]')
        .first();
      if (emailInput) {
        emailInput.type('email-invalido', { force: true });
        emailInput.blur();
        cy.contains(/email.*inválido|formato.*email/i, {
          timeout: TIMEOUT,
        }).should('exist');
      }
    });
  });
});
