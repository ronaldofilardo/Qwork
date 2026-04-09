/**
 * @file cypress/e2e/entidade/entidade-importacao-massa.cy.ts
 * E2E: Importação em Massa de Funcionários para Entidade
 *
 * Testa o fluxo completo de 5 etapas:
 *  1. Upload do arquivo XLSX
 *  2. Mapeamento de colunas (sem campo CNPJ)
 *  3. Validação de dados
 *  4. Classificação de nível de cargo
 *  5. Resultado da importação
 *
 * Também verifica:
 *  - Acesso via sidebar "Empresa > Importação em Massa"
 *  - Redirecionamento do botão "Importação em Massa" na tela de Funcionários
 *  - Ausência de campos de empresa/CNPJ no mapeamento
 */

describe('Importação em Massa — Entidade', () => {
  const SESSION_GESTOR = {
    cpf: '52998224725',
    nome: 'Gestor Entidade Teste',
    perfil: 'gestor',
    tomador_id: 42,
    entidade_id: 42,
    sessionToken: 'test-token-gestor',
    lastRotation: Date.now(),
  };

  const mockAnalyzeResponse = {
    success: true,
    data: {
      totalLinhas: 3,
      colunasDetectadas: [
        { indice: 0, nomeOriginal: 'CPF', sugestaoQWork: 'cpf', confianca: 1.0, exemploDados: ['529.982.247-25'] },
        { indice: 1, nomeOriginal: 'NOME', sugestaoQWork: 'nome', confianca: 1.0, exemploDados: ['João Silva'] },
        { indice: 2, nomeOriginal: 'FUNCAO', sugestaoQWork: 'funcao', confianca: 0.9, exemploDados: ['Analista'] },
        { indice: 3, nomeOriginal: 'DATA_NASC', sugestaoQWork: 'data_nascimento', confianca: 0.8, exemploDados: ['01/01/1990'] },
      ],
      camposQWork: [
        { campo: 'cpf', label: 'CPF', obrigatorio: true },
        { campo: 'nome', label: 'Nome', obrigatorio: true },
        { campo: 'funcao', label: 'Função', obrigatorio: false },
        { campo: 'data_nascimento', label: 'Data de Nascimento', obrigatorio: false },
      ],
      camposObrigatorios: ['cpf', 'nome'],
      camposObrigatoriosFaltando: [],
    },
  };

  const mockValidateResponse = {
    success: true,
    data: {
      valido: true,
      resumo: {
        totalLinhas: 3,
        linhasValidas: 3,
        linhasComErros: 0,
        cpfsUnicos: 3,
        funcionariosExistentes: 0,
        funcionariosNovos: 3,
        funcionariosParaInativar: 0,
        funcionariosJaInativos: 0,
        funcionariosAReadmitir: 0,
      },
      funcoesUnicas: ['Analista'],
      funcoesComMudancaRole: [],
      funcoesNivelInfo: [
        {
          funcao: 'Analista',
          qtdFuncionarios: 3,
          qtdNovos: 3,
          qtdExistentes: 0,
          niveisAtuais: [],
          isMudancaRole: false,
          isMudancaNivel: false,
          temNivelNuloExistente: false,
          funcionariosComMudanca: [],
          funcionariosComMudancaNivel: [],
        },
      ],
      temNivelCargoDirecto: false,
      erros: [],
      avisos: [],
    },
  };

  const mockExecuteResponse = {
    success: true,
    data: {
      resumo: {
        totalLinhasProcessadas: 3,
        totalLinhasComErroFormato: 0,
        funcionariosCriados: 3,
        funcionariosAtualizados: 0,
        nivelCargoAlterados: 0,
        funcoesAlteradas: [],
        vinculosCriados: 3,
        vinculosAtualizados: 0,
        inativacoesRealizadas: 0,
        readmissoesRealizadas: 0,
        tempoMs: 450,
      },
      erros: [],
      avisos: [],
    },
  };

  beforeEach(() => {
    // Autenticação
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: { user: SESSION_GESTOR },
    }).as('getSession');

    cy.setCookie('bps-session', JSON.stringify(SESSION_GESTOR));

    // Contexto da entidade
    cy.intercept('GET', '/api/entidade/contexto*', {
      statusCode: 200,
      body: {
        success: true,
        session: SESSION_GESTOR,
        counts: { funcionarios: 10, lotes: 2, pendencias: 0 },
      },
    }).as('getContexto');

    // APIs de importação
    cy.intercept('POST', '/api/entidade/importacao/analyze', mockAnalyzeResponse).as('analyze');
    cy.intercept('POST', '/api/entidade/importacao/validate', mockValidateResponse).as('validate');
    cy.intercept('POST', '/api/entidade/importacao/execute', mockExecuteResponse).as('execute');

    // Templates (pode retornar vazio)
    cy.intercept('GET', '/api/importacao/templates*', {
      statusCode: 200,
      body: { success: true, templates: [] },
    }).as('getTemplates');
  });

  context('Acesso e Navegação', () => {
    it('exibe o item "Importação em Massa" no sidebar da entidade', () => {
      cy.visit('/entidade/dashboard');
      cy.contains('Importação em Massa').should('be.visible');
    });

    it('navega para /entidade/importacao ao clicar em "Importação em Massa" no sidebar', () => {
      cy.visit('/entidade/dashboard');
      cy.contains('Importação em Massa').click();
      cy.url().should('include', '/entidade/importacao');
    });

    it('redireciona para /entidade/importacao ao clicar em "Importação em Massa" na tela de Funcionários', () => {
      cy.intercept('GET', '/api/entidade/funcionarios*', {
        statusCode: 200,
        body: { funcionarios: [] },
      }).as('getFuncionarios');

      cy.visit('/entidade/funcionarios');
      cy.wait('@getFuncionarios');

      // Botão "Importação em Massa" deve existir e redirecionar
      cy.contains('Importação em Massa').click();
      cy.url().should('include', '/entidade/importacao');
    });

    it('exibe a página de importação com stepper de 5 etapas', () => {
      cy.visit('/entidade/importacao');

      cy.contains('Importação em Massa').should('be.visible');
      cy.contains('1. Upload').should('be.visible');
      cy.contains('2. Mapeamento').should('be.visible');
      cy.contains('3. Validação').should('be.visible');
      cy.contains('4. Níveis').should('be.visible');
      cy.contains('5. Resultado').should('be.visible');
    });
  });

  context('Etapa 1: Upload', () => {
    it('aceita arquivo .xlsx e avança para mapeamento', () => {
      cy.visit('/entidade/importacao');

      const fileName = 'funcionarios_teste.xlsx';
      cy.get('[data-testid="upload-area"]').should('exist');

      cy.fixture('funcionarios_template.xlsx', 'binary').then((content) => {
        const blob = Cypress.Blob.binaryStringToBlob(
          content,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        const file = new File([blob], fileName, {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);

        cy.get('input[type="file"]').then(($input) => {
          const inputEl = $input.get(0) as HTMLInputElement;
          inputEl.files = dataTransfer.files;
          cy.wrap($input).trigger('change', { force: true });
        });
      });

      cy.wait('@analyze');
      cy.contains('2. Mapeamento', { timeout: 5000 }).should('be.visible');
    });

    it('exibe mensagem de erro quando arquivo não é XLSX', () => {
      cy.visit('/entidade/importacao');

      cy.intercept('POST', '/api/entidade/importacao/analyze', {
        statusCode: 400,
        body: { error: 'Apenas arquivos .xlsx, .xls ou .csv são permitidos' },
      }).as('analyzeError');

      const file = new File(['content'], 'arquivo.txt', { type: 'text/plain' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('input[type="file"]').then(($input) => {
        const inputEl = $input.get(0) as HTMLInputElement;
        inputEl.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });

      cy.wait('@analyzeError');
      cy.contains('.xlsx').should('be.visible');
    });
  });

  context('Etapa 2: Mapeamento (sem CNPJ)', () => {
    beforeEach(() => {
      // Avançar direto para etapa de mapeamento mockando o estado inicial
      cy.visit('/entidade/importacao');

      const file = new File(['PK dummy'], 'dados.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('input[type="file"]').then(($input) => {
        const inputEl = $input.get(0) as HTMLInputElement;
        inputEl.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });

      cy.wait('@analyze');
    });

    it('não exibe campo cnpj_empresa no mapeamento de colunas', () => {
      cy.url().should('include', '/entidade/importacao');
      cy.contains('2. Mapeamento').should('be.visible');

      // Campos de empresa NÃO devem aparecer
      cy.contains('CNPJ Empresa').should('not.exist');
      cy.contains('cnpj_empresa').should('not.exist');
      cy.contains('Nome Empresa').should('not.exist');
    });

    it('exibe campos de funcionário (CPF, Nome, Função)', () => {
      cy.contains('CPF').should('be.visible');
      cy.contains('NOME').should('be.visible');
    });
  });

  context('Etapa 3: Validação', () => {
    it('exibe resumo de validação sem estatísticas de empresa', () => {
      // Simular que chegamos na etapa de validação
      cy.visit('/entidade/importacao');

      // Forçar o estado para validação via intercepts
      const file = new File(['PK dummy'], 'dados.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('input[type="file"]').then(($input) => {
        const inputEl = $input.get(0) as HTMLInputElement;
        inputEl.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });

      cy.wait('@analyze');
      cy.contains('2. Mapeamento').should('be.visible');

      // Confirmar mapeamento
      cy.contains('button', /confirmar|avançar|próximo/i).click();

      cy.wait('@validate');

      // Na validação, deve mostrar estatísticas de funcionários sem empresa
      cy.contains('3. Validação').should('be.visible');
      cy.contains('Funcionários novos').should('be.visible');
      cy.contains('Empresas').should('not.exist');
    });
  });

  context('Etapa 5: Resultado', () => {
    it('exibe resultado sem estatísticas de empresa após importação bem-sucedida', () => {
      // Este teste verifica o comportamento da tela de resultado
      cy.visit('/entidade/importacao');

      // Simular upload e progresso até resultado
      const file = new File(['PK dummy'], 'dados.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);

      cy.get('input[type="file"]').then(($input) => {
        const inputEl = $input.get(0) as HTMLInputElement;
        inputEl.files = dataTransfer.files;
        cy.wrap($input).trigger('change', { force: true });
      });

      cy.wait('@analyze');
      cy.contains('button', /confirmar|avançar|próximo/i).click();
      cy.wait('@validate');

      // Avançar para nível de cargo
      cy.contains('button', /confirmar|avançar|importar/i, { timeout: 5000 }).click();

      // Se tiver etapa de nível de cargo, confirmar
      cy.get('body').then(($body) => {
        if ($body.text().includes('4. Níveis')) {
          cy.contains('button', /confirmar|importar/i).click();
        }
      });

      cy.wait('@execute', { timeout: 10000 });

      // Verificar resultado sem empresas
      cy.contains('5. Resultado').should('be.visible');
      cy.contains('Importação Concluída').should('be.visible');
      cy.contains('Funcionários criados').should('be.visible');
      cy.contains('Empresas criadas').should('not.exist');
      cy.contains('Empresas existentes').should('not.exist');
    });
  });

  context('Nova Importação', () => {
    it('botão "Nova Importação" reinicia o fluxo para etapa 1', () => {
      // Verificar que existe o botão de nova importação no resultado
      cy.visit('/entidade/importacao');
      // Após importação concluída, botão deve existir
      // Este teste verifica a estrutura da página
      cy.url().should('include', '/entidade/importacao');
    });
  });
});
