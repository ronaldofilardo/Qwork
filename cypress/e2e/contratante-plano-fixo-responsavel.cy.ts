describe('Cadastro de Contratante - Plano Fixo → Criação de Conta do Responsável', () => {
  const ts = Date.now();
  const empresa = {
    nome: `Empresa Teste Plano Fixo ${ts}`,
    cnpj: '12345678000199', // padrão simples para teste
    inscricao_estadual: '123456789',
    email: `teste-empresa-${ts}@exemplo.com.br`,
    telefone: '(11) 98765-4321',
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01234-567',
  };

  const responsavel = {
    nome: `Responsavel Teste ${ts}`,
    cpf: `${String(10000000000 + (ts % 89999999999)).slice(0, 11)}`,
    cargo: 'Gestor',
    email: `responsavel-${ts}@exemplo.com.br`,
    celular: '(11) 98765-4321',
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
    // Interceptar chamadas críticas para estabilidade
    cy.intercept('POST', '/api/contrato/**').as('criarContrato');
    cy.intercept('POST', '/api/pagamento/**').as('pagamento');
  });

  it('Deve registrar contratante com Plano Fixo e permitir login do responsável com senha padrão (últimos 6 do CNPJ)', () => {
    // 1. Abrir fluxo de cadastro
    cy.visit('/login');
    cy.contains('Cadastrar Empresa').click();

    // 2. Selecionar tipo de entidade / contratante
    cy.get('[data-testid="tipo-entidade"]').click();
    cy.contains('Próximo').click();

    // 3. Selecionar um plano que contenha "Fixo" no nome (Plano Fixo)
    cy.wait(800);
    cy.get('[data-testid="plano-card"]').contains(/Fixo/i).first().click();
    cy.contains('Próximo').click();

    // 4. Preencher dados da empresa
    cy.get('input[name="nome"]').type(empresa.nome);
    cy.get('input[name="cnpj"]').type(empresa.cnpj);
    cy.get('input[name="inscricao_estadual"]').type(empresa.inscricao_estadual);
    cy.get('input[name="email"]').type(empresa.email);
    cy.get('input[name="telefone"]').type(empresa.telefone);
    cy.get('input[name="endereco"]').type(empresa.endereco);
    cy.get('input[name="cidade"]').type(empresa.cidade);
    cy.get('input[name="estado"]').type(empresa.estado);
    cy.get('input[name="cep"]').type(empresa.cep);

    // Uploads (se existirem inputs de arquivo)
    cy.get('input[name="cartao_cnpj"]').attachFile('sample-doc.pdf');
    cy.get('input[name="contrato_social"]').attachFile('sample-doc.pdf');
    cy.get('input[name="doc_identificacao"]').attachFile('sample-doc.pdf');

    cy.contains('Próximo').click();

    // 5. Preencher dados do responsável
    cy.get('input[name="responsavel_nome"]').type(responsavel.nome);
    cy.get('input[name="responsavel_cpf"]').type(responsavel.cpf);
    cy.get('input[name="responsavel_cargo"]').type(responsavel.cargo);
    cy.get('input[name="responsavel_email"]').type(responsavel.email);
    cy.get('input[name="responsavel_celular"]').type(responsavel.celular);

    cy.contains('Próximo').click();

    // 6. Aceitar contrato
    cy.get('pre').should('contain', empresa.nome);
    cy.get('input[type="checkbox"]').check();
    cy.contains('Próximo').click();

    // 7. Finalizar cadastro
    cy.contains('Finalizar Cadastro').click();

    // Esperar criação do contrato de backend
    cy.wait('@criarContrato');

    // 8. Deve encaminhar para página de pagamento
    cy.url().should('include', '/pagamento/');
    cy.contains(empresa.nome);

    // 9. Selecionar PIX e confirmar pagamento (simulado no botão)
    cy.get('input[value="pix"]').check({ force: true });
    cy.contains('Confirmar Pagamento').click();

    // 10. Aguardar processamento e redirecionamento para login
    cy.wait('@pagamento');
    cy.url().should('include', '/login');

    // 11. Tentar autenticar como responsável usando CPF e senha padrão (últimos 6 do CNPJ)
    const cleanCnpj = empresa.cnpj.replace(/[\.\/-]/g, '');
    const defaultPassword = cleanCnpj.slice(-6);

    cy.get('input[name="cpf"]').clear().type(responsavel.cpf);
    cy.get('input[name="senha"]').clear().type(defaultPassword);
    cy.contains('Entrar').click();

    // 12. Verificar que login do responsável foi bem sucedido (redireciona para dashboard do gestor)
    cy.url({ timeout: 10000 }).should((url) => {
      expect(url).to.match(/(dashboard|rh|avaliacao|gestor)/i);
    });
    cy.contains(responsavel.nome).should('be.visible');
  });
});
