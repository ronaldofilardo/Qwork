/**
 * Teste E2E: Fluxo Completo Cadastro Funcionário → Lote Pronto → Solicitar Emissão
 *
 * OBJETIVO: Prevenir regressão no fluxo crítico operacional
 *
 * Cenário:
 * 1. Login como RH
 * 2. Cadastro de novo funcionário
 * 3. Criação/liberação de lote
 * 4. Conclusão de avaliações (lote fica "pronto")
 * 5. Solicitação de emissão de laudo
 * 6. Validação de status do lote
 *
 * Atualizado: 04/Fevereiro/2026
 */

describe('Fluxo Crítico: Funcionário → Lote Pronto → Emissão', () => {
  const timestamp = Date.now();
  let clinicaId: number;
  let empresaId: number;
  let rhCpf: string;
  let funcionarioCpf: string;
  let loteId: number;

  before(() => {
    // Configurar ambiente de teste via tasks
    cy.task('db:setupTestEnvironment', { timestamp }).then((setup: any) => {
      clinicaId = setup.clinicaId;
      empresaId = setup.empresaId;
      rhCpf = setup.rhCpf;
    });
  });

  after(() => {
    // Cleanup
    cy.task('db:cleanupTestEnvironment', { clinicaId, empresaId, rhCpf });
  });

  describe('1. Login como RH', () => {
    it('deve fazer login com perfil RH', () => {
      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          usuario: {
            cpf: rhCpf,
            nome: 'RH Teste E2E',
            perfil: 'rh',
            clinica_id: clinicaId,
            empresa_id: empresaId,
          },
        },
      }).as('loginRH');

      cy.intercept('GET', '/api/auth/session', {
        statusCode: 200,
        body: {
          cpf: rhCpf,
          nome: 'RH Teste E2E',
          perfil: 'rh',
          clinica_id: clinicaId,
          empresa_id: empresaId,
          sessionToken: 'mock-rh-session',
        },
      }).as('sessionRH');

      cy.visit('/login');
      cy.get('input[name="cpf"]').type(rhCpf);
      cy.get('input[name="senha"]').type('Teste@123');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRH');
      cy.wait('@sessionRH');

      cy.url().should('include', '/rh');
    });
  });

  describe('2. Cadastro de Funcionário', () => {
    it('deve acessar página de cadastro de funcionários', () => {
      cy.intercept('GET', '/api/rh/funcionarios*', {
        statusCode: 200,
        body: {
          success: true,
          funcionarios: [],
          total: 0,
        },
      }).as('getFuncionarios');

      cy.visit('/rh/funcionarios');
      cy.wait('@getFuncionarios');

      cy.contains(/cadastrar.*funcionário/i).should('be.visible');
    });

    it('deve cadastrar novo funcionário com dados completos', () => {
      funcionarioCpf = `33${timestamp.toString().slice(-9)}`;

      cy.intercept('POST', '/api/rh/funcionarios', (req) => {
        expect(req.body.cpf).to.eq(funcionarioCpf);
        expect(req.body.nome).to.exist;
        expect(req.body.email).to.exist;

        req.reply({
          statusCode: 201,
          body: {
            success: true,
            funcionario: {
              id: Math.floor(Math.random() * 10000),
              cpf: funcionarioCpf,
              nome: req.body.nome,
              email: req.body.email,
              nivel_cargo: 'operacional',
              empresa_id: empresaId,
            },
          },
        });
      }).as('cadastroFuncionario');

      // Abrir modal/formulário
      cy.contains('button', /novo.*funcionário/i).click();

      // Preencher dados
      cy.get('input[name="cpf"]').type(funcionarioCpf);
      cy.get('input[name="nome"]').type(`Funcionário E2E ${timestamp}`);
      cy.get('input[name="email"]').type(`func-${timestamp}@test.com`);
      cy.get('input[name="telefone"]').type('11999999999');
      cy.get('input[name="data_nascimento"]').type('1990-01-01');
      cy.get('select[name="nivel_cargo"]').select('operacional');
      cy.get('input[name="cargo"]').type('Analista');

      cy.get('button[type="submit"]')
        .contains(/cadastrar/i)
        .click();

      cy.wait('@cadastroFuncionario');

      // Verificar mensagem de sucesso
      cy.contains(/sucesso/i, { timeout: 5000 }).should('be.visible');
    });

    it('deve validar que funcionário foi inserido no banco', () => {
      cy.task('db:getFuncionario', { cpf: funcionarioCpf }).then(
        (result: any) => {
          expect(result).to.not.be.null;
          expect(result.cpf).to.eq(funcionarioCpf);
          expect(result.empresa_id).to.eq(empresaId);
          expect(result.nivel_cargo).to.eq('operacional');
        }
      );
    });
  });

  describe('3. Criação e Liberação de Lote', () => {
    it('deve criar novo lote incluindo o funcionário cadastrado', () => {
      cy.intercept('POST', '/api/entidade/lotes', (req) => {
        expect(req.body.titulo).to.exist;
        expect(req.body.funcionarios_ids).to.include.members([funcionarioCpf]);

        loteId = Math.floor(Math.random() * 10000);

        req.reply({
          statusCode: 201,
          body: {
            success: true,
            lote: {
              id: loteId,
              titulo: req.body.titulo,
              status: 'criado',
              total_funcionarios: 1,
              funcionarios_concluidos: 0,
            },
          },
        });
      }).as('criarLote');

      cy.visit('/entidade/lotes');

      // Iniciar novo ciclo
      cy.contains('button', /iniciar.*ciclo/i).click();

      // Preencher modal
      cy.get('input[name="titulo"]').type(`Lote E2E ${timestamp}`);
      cy.get(`input[type="checkbox"][value="${funcionarioCpf}"]`).check();
      cy.get('button[type="submit"]')
        .contains(/criar.*lote/i)
        .click();

      cy.wait('@criarLote');

      cy.contains(/lote.*criado/i).should('be.visible');
    });

    it('deve liberar lote para avaliações', () => {
      cy.intercept('POST', `/api/entidade/lotes/${loteId}/liberar`, {
        statusCode: 200,
        body: {
          success: true,
          avaliacoes_criadas: 1,
          message: 'Lote liberado com sucesso',
        },
      }).as('liberarLote');

      // Localizar lote na listagem
      cy.contains(`Lote E2E ${timestamp}`)
        .parents('tr, div')
        .within(() => {
          cy.contains('button', /liberar/i).click();
        });

      // Confirmar liberação
      cy.contains('button', /confirmar/i).click();

      cy.wait('@liberarLote');

      cy.contains(/liberado/i).should('be.visible');
    });

    it('deve validar que avaliação foi criada', () => {
      cy.task('db:getAvaliacoesLote', { loteId }).then((result: any) => {
        expect(result).to.have.length(1);
        expect(result[0].funcionario_cpf).to.eq(funcionarioCpf);
        expect(result[0].status).to.eq('disponivel');
      });
    });
  });

  describe('4. Conclusão de Avaliação - Lote Pronto', () => {
    it('deve concluir avaliação do funcionário', () => {
      // Simular conclusão via task (mais rápido que UI completa)
      cy.task('db:concluirAvaliacao', {
        loteId,
        funcionarioCpf,
      }).then((result: any) => {
        expect(result.success).to.be.true;
      });
    });

    it('deve recalcular status do lote e marcar como "pronto"', () => {
      cy.task('db:recalcularLote', { loteId }).then((result: any) => {
        expect(result.success).to.be.true;
      });

      cy.task('db:getLote', { loteId }).then((lote: any) => {
        expect(lote.status).to.be.oneOf(['pronto', 'concluido']);
        expect(lote.total_funcionarios).to.eq(lote.funcionarios_concluidos);
        expect(lote.funcionarios_concluidos).to.eq(1);
      });
    });

    it('deve exibir card verde "Lote Concluído" na UI', () => {
      cy.intercept('GET', '/api/entidade/lotes*', {
        statusCode: 200,
        body: {
          success: true,
          lotes: [
            {
              id: loteId,
              titulo: `Lote E2E ${timestamp}`,
              status: 'pronto',
              total_funcionarios: 1,
              funcionarios_concluidos: 1,
            },
          ],
        },
      }).as('getLotesPronto');

      cy.visit('/entidade/lotes');
      cy.wait('@getLotesPronto');

      // Verificar visual do card verde
      cy.contains(`Lote E2E ${timestamp}`)
        .parents('div')
        .within(() => {
          cy.contains(/concluído|pronto/i).should('be.visible');
          cy.get('[class*="bg-green"], [class*="green"]').should('exist');
        });
    });
  });

  describe('5. Solicitação de Emissão de Laudo', () => {
    it('deve exibir botão "Solicitar Emissão do Laudo"', () => {
      cy.contains(`Lote E2E ${timestamp}`)
        .parents('tr, div')
        .within(() => {
          cy.contains('button', /solicitar.*emissão/i).should('be.visible');
          cy.contains('button', /solicitar.*emissão/i).should('be.enabled');
        });
    });

    it('deve solicitar emissão com confirmação', () => {
      cy.intercept('POST', `/api/entidade/lotes/${loteId}/solicitar-emissao`, {
        statusCode: 200,
        body: {
          success: true,
          message: 'Solicitação de emissão enviada com sucesso',
          lote_id: loteId,
        },
      }).as('solicitarEmissao');

      // Clicar no botão
      cy.contains(`Lote E2E ${timestamp}`)
        .parents('tr, div')
        .within(() => {
          cy.contains('button', /solicitar.*emissão/i).click();
        });

      // Confirmar no modal
      cy.get('[role="dialog"], [role="alertdialog"]').within(() => {
        cy.contains(/confirmar|sim|enviar/i).click();
      });

      cy.wait('@solicitarEmissao');

      cy.contains(/solicitação.*enviada/i, { timeout: 5000 }).should(
        'be.visible'
      );
    });

    it('deve atualizar status do lote para "emissao_solicitada"', () => {
      cy.task('db:getLote', { loteId }).then((lote: any) => {
        expect(lote.status).to.be.oneOf([
          'emissao_solicitada',
          'aguardando_emissao',
        ]);
        expect(lote.data_solicitacao_emissao).to.not.be.null;
      });
    });

    it('não deve permitir nova solicitação para mesmo lote', () => {
      cy.intercept('POST', `/api/entidade/lotes/${loteId}/solicitar-emissao`, {
        statusCode: 400,
        body: {
          error: 'Emissão já foi solicitada para este lote',
        },
      }).as('solicitarEmissaoDuplicada');

      cy.reload();

      cy.contains(`Lote E2E ${timestamp}`)
        .parents('tr, div')
        .within(() => {
          // Botão deve estar desabilitado ou não existir
          cy.contains('button', /solicitar.*emissão/i).should('be.disabled');
        });
    });
  });

  describe('6. Validações de Restrições', () => {
    it('não deve permitir solicitar emissão de lote não pronto', () => {
      const loteIncompletoId = Math.floor(Math.random() * 10000);

      cy.task('db:createIncompleteLote', {
        clinicaId,
        loteId: loteIncompletoId,
      });

      cy.intercept('GET', '/api/entidade/lotes*', {
        statusCode: 200,
        body: {
          success: true,
          lotes: [
            {
              id: loteIncompletoId,
              titulo: 'Lote Incompleto',
              status: 'enviado',
              total_funcionarios: 3,
              funcionarios_concluidos: 1,
            },
          ],
        },
      }).as('getLotesIncompleto');

      cy.visit('/entidade/lotes');
      cy.wait('@getLotesIncompleto');

      cy.contains('Lote Incompleto')
        .parents('tr, div')
        .within(() => {
          // Botão não deve existir ou deve estar desabilitado
          cy.contains('button', /solicitar.*emissão/i).should('not.exist');
        });

      // Cleanup
      cy.task('db:deleteLote', { loteId: loteIncompletoId });
    });

    it('não deve permitir RH sem permissão solicitar emissão', () => {
      // Criar RH sem permissão de emissão
      const rhSemPermissao = `44${timestamp.toString().slice(-9)}`;

      cy.task('db:createRHWithoutPermission', {
        cpf: rhSemPermissao,
        clinicaId,
        empresaId,
      });

      cy.intercept('POST', '/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          usuario: {
            cpf: rhSemPermissao,
            perfil: 'rh',
            permissoes: [],
          },
        },
      });

      cy.intercept('POST', `/api/entidade/lotes/${loteId}/solicitar-emissao`, {
        statusCode: 403,
        body: {
          error: 'Sem permissão para solicitar emissão',
        },
      });

      // Tentar acessar endpoint diretamente
      cy.request({
        method: 'POST',
        url: `/api/entidade/lotes/${loteId}/solicitar-emissao`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 401]);
      });

      // Cleanup
      cy.task('db:deleteFuncionario', { cpf: rhSemPermissao });
    });
  });
});
