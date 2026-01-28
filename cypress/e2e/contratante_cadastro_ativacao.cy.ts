/**
 * E2E: Cadastro → Aprovação → Pagamento → Login do Gestor
 *
 * Este teste percorre as etapas principais e valida que o gestor
 * consegue efetuar login após a confirmação do pagamento.
 *
 * Observação: Não modifica código fonte; verifica comportamento atual.
 */

describe('Cadastro → Aprovação → Pagamento → Login (Gestor)', () => {
  const ts = Date.now();
  const empresa = {
    nome: `Empresa E2E ${ts}`,
    cnpj: '02494916000170', // CNPJ de teste (últimos 6: 000170)
    email: `e2e-${ts}@exemplo.com`,
  };
  const responsavel = {
    nome: 'Responsavel E2E',
    cpf: '87545772920',
    email: `resp-${ts}@exemplo.com`,
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it('completa o fluxo e permite login do gestor com senha padrão (últimos 6 do CNPJ)', () => {
    // 1. Cadastro via UI (usar fluxo existente)
    cy.visit('/login');
    cy.contains('Cadastrar Empresa').click();

    cy.get('[data-testid="tipo-entidade"]').click();
    cy.contains('Próximo').click();

    cy.wait(500);
    cy.get('[data-testid="plano-card"]').first().click();
    cy.contains('Próximo').click();

    // Preencher dados empresa
    cy.get('input[name="nome"]').type(empresa.nome);
    cy.get('input[name="cnpj"]').type(empresa.cnpj);
    cy.get('input[name="email"]').type(empresa.email);
    cy.get('input[name="telefone"]').type('(11) 90000-0000');
    cy.get('input[name="endereco"]').type('Rua Teste, 1');
    cy.get('input[name="cidade"]').type('São Paulo');
    cy.get('input[name="estado"]').type('SP');
    cy.get('input[name="cep"]').type('01000-000');

    cy.contains('Próximo').click();

    // Dados do responsável
    cy.get('input[name="responsavel_nome"]').type(responsavel.nome);
    cy.get('input[name="responsavel_cpf"]').type(responsavel.cpf);
    cy.get('input[name="responsavel_email"]').type(responsavel.email);
    cy.get('input[name="responsavel_celular"]').type('(11) 90000-0001');

    cy.contains('Próximo').click();

    // Aceitar contrato
    cy.wait(500);
    cy.get('input[type="checkbox"]').check();
    cy.contains('Próximo').click();

    cy.contains('Finalizar Cadastro').click();

    // Depois de finalizar, deve ir para página de pagamento
    cy.url().should('include', '/pagamento/');

    // Simular confirmação de pagamento
    cy.contains('Finalizar Pagamento').click();
    cy.contains('Confirmar Pagamento').click();

    // Aguarda processamento e redirecionamento para login
    cy.wait(2000);
    cy.url().should('include', '/login');

    // Agora realizar login do gestor com CPF e senha igual aos últimos 6 do CNPJ
    const senhaPadrao = empresa.cnpj.replace(/[./-]/g, '').slice(-6);

    cy.get('input[name="cpf"]').clear().type(responsavel.cpf);
    cy.get('input[name="senha"]').clear().type(senhaPadrao);
    cy.contains('Entrar').click();

    // A aplicação atual redireciona gestores para /entidade
    cy.url({ timeout: 10000 }).should('include', '/entidade');

    // Verificar presença de elemento que indica sessão do gestor
    cy.contains('Meus Funcionários').should('be.visible');
  });

  it.skip('deve forçar troca de senha no primeiro login (a ser implementado)', () => {
    // Teste reservado: quando a funcionalidade existir, validar redirecionamento
    // para a tela de troca de senha na primeira autenticação.
  });
});
