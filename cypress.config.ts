import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Task to insert contratante/contrato/pagamento for E2E tests
      on('task', {
        async 'db:insertTestContratante'(args: any) {
          const { cnpj, cpf, nome, email } = args;
          try {
            const { query } = await import('./lib/db');

            const contratanteRes = await query(
              `INSERT INTO contratantes (
                tipo, nome, cnpj, email, telefone,
                responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
                endereco, cidade, estado, cep, status, ativa, numero_funcionarios_estimado
              ) VALUES (
                'entidade', $1, $2, $3, '(11) 90000-0000',
                'Resp E2E', $4, $3, '(11) 90000-0001',
                'Rua E2E', 'Cidade', 'SP', '00000-000', 'aguardando_pagamento', false, 1
              ) RETURNING id`,
              [nome, cnpj, email, cpf]
            );

            const contratanteId = contratanteRes.rows[0].id;

            const contratoRes = await query(
              `INSERT INTO contratos (contratante_id, plano_id, aceito, hash_contrato, criado_em)
               SELECT $1, plano_id, true, md5(random()::text), CURRENT_TIMESTAMP
               FROM contratantes WHERE id = $1
               RETURNING id`,
              [contratanteId]
            );

            const contratoId = contratoRes.rows[0].id;

            const pagamentoRes = await query(
              `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo, numero_parcelas, criado_em)
               VALUES ($1, $2, 1500.00, 'pendente', 'boleto', 1, CURRENT_TIMESTAMP)
               RETURNING id`,
              [contratanteId, contratoId]
            );

            const pagamentoId = pagamentoRes.rows[0].id;

            return { contratanteId, contratoId, pagamentoId };
          } catch (err: any) {
            console.error('Task db:insertTestContratante error:', err);
            throw err;
          }
        },

        async 'db:cleanupContratanteByCpf'(args: any) {
          const { cpf } = args;
          try {
            const { query } = await import('./lib/db');

            const contratante = await query(
              'SELECT id FROM contratantes WHERE responsavel_cpf = $1 LIMIT 1',
              [cpf]
            );
            const contratanteId = contratante.rows[0]?.id;

            if (contratanteId) {
              await query('DELETE FROM recibos WHERE contratante_id = $1', [
                contratanteId,
              ]);
              await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
                contratanteId,
              ]);
              await query('DELETE FROM contratos WHERE contratante_id = $1', [
                contratanteId,
              ]);
              await query(
                'DELETE FROM notificacoes WHERE destinatario_cpf = $1',
                [cpf]
              );
              await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
              await query('DELETE FROM contratantes WHERE id = $1', [
                contratanteId,
              ]);
            }

            return true;
          } catch (err: any) {
            console.error('Task db:cleanupContratanteByCpf error:', err);
            throw err;
          }
        },

        // Retorna dados do funcionario para inspeção nos testes
        async 'db:getFuncionarioByCpf'(args: any) {
          const { cpf } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT cpf, nome, perfil, ativo, senha_hash FROM funcionarios WHERE cpf = $1',
              [cpf]
            );
            return res.rows[0] || null;
          } catch (err: any) {
            console.error('Task db:getFuncionarioByCpf error:', err);
            throw err;
          }
        },

        // Helper tasks usados pelos novos E2E
        async 'db:cleanupTestData'(args: any) {
          const { cnpj, cpf } = args;
          try {
            const { query } = await import('./lib/db');

            if (cpf) {
              await query(
                'DELETE FROM notificacoes WHERE destinatario_cpf = $1',
                [cpf]
              );
              await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
              await query('DELETE FROM contratantes_senhas WHERE cpf = $1', [
                cpf,
              ]);
            }

            if (cnpj) {
              await query(
                'DELETE FROM contratos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
                [cnpj]
              );
              await query(
                'DELETE FROM pagamentos WHERE contratante_id IN (SELECT id FROM contratantes WHERE cnpj = $1)',
                [cnpj]
              );
              await query('DELETE FROM contratantes WHERE cnpj = $1', [cnpj]);
            }

            return true;
          } catch (err: any) {
            console.error('Task db:cleanupTestData error:', err);
            throw err;
          }
        },

        async 'db:getContratante'(args: any) {
          const { cnpj } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT * FROM contratantes WHERE cnpj = $1 LIMIT 1',
              [cnpj]
            );
            return res.rows[0] || null;
          } catch (err: any) {
            console.error('Task db:getContratante error:', err);
            throw err;
          }
        },

        async 'db:confirmarPagamento'(args: any) {
          const { contratanteId } = args;
          try {
            const { query } = await import('./lib/db');

            await query(
              'UPDATE contratantes SET pagamento_confirmado = true, status = $1 WHERE id = $2',
              ['aprovado', contratanteId]
            );

            return { success: true };
          } catch (err: any) {
            console.error('Task db:confirmarPagamento error:', err);
            throw err;
          }
        },

        async 'db:gerarTokenAtivacao'(args: any) {
          const { contratanteId, cpf } = args;
          try {
            const { query } = await import('./lib/db');
            const token = `token-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

            await query(
              `INSERT INTO contratantes_senhas (cpf, contratante_id, token_ativacao, token_expira_em)
               VALUES ($1, $2, $3, NOW() + INTERVAL '24 hours')`,
              [cpf, contratanteId, token]
            );

            return { success: true, token };
          } catch (err: any) {
            console.error('Task db:gerarTokenAtivacao error:', err);
            throw err;
          }
        },

        async 'db:getSenhaHash'(args: any) {
          const { cpf } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT senha_hash FROM contratantes_senhas WHERE cpf = $1 LIMIT 1',
              [cpf]
            );
            return res.rows[0] || null;
          } catch (err: any) {
            console.error('Task db:getSenhaHash error:', err);
            throw err;
          }
        },

        async 'db:insertInactiveContratante'(args: any) {
          const { cnpj, cpf } = args;
          try {
            const { query } = await import('./lib/db');

            const res = await query(
              `INSERT INTO contratantes (tipo, nome, cnpj, email, responsavel_nome, responsavel_cpf, status, ativa, criado_em)
               VALUES ('entidade', $1, $2, $3, 'Resp Inativo', $4, 'aguardando_pagamento', false, NOW()) RETURNING id`,
              [
                `Clinica Inativa ${Date.now()}`,
                cnpj || `99${Date.now()}`,
                `${Date.now()}@test.com`,
                cpf || `99${Date.now()}`,
              ]
            );

            return { success: true, id: res.rows[0].id };
          } catch (err: any) {
            console.error('Task db:insertInactiveContratante error:', err);
            throw err;
          }
        },

        async 'db:setupTestEnvironment'(args: any) {
          const { timestamp } = args;
          try {
            const { query } = await import('./lib/db');

            const clinicaRes = await query(
              `INSERT INTO clinicas (nome, cnpj, email, ativa, criado_em) VALUES ($1, $2, $3, true, NOW()) RETURNING id`,
              [
                `Clínica Teste E2E ${timestamp}`,
                `${timestamp.toString().slice(-14)}`,
                `ciclo${timestamp}@test.com`,
              ]
            );
            const clinicaId = clinicaRes.rows[0].id;

            const empresaRes = await query(
              `INSERT INTO empresas_clientes (nome, cnpj, email, clinica_id, ativa, criado_em) VALUES ($1, $2, $3, $4, true, NOW()) RETURNING id`,
              [
                `Empresa Teste E2E ${timestamp}`,
                `${(timestamp + 1).toString().slice(-14)}`,
                `empresa${timestamp}@test.com`,
                clinicaId,
              ]
            );
            const empresaId = empresaRes.rows[0].id;

            const rhCpf = `11${timestamp.toString().slice(-9)}`;
            await query(
              `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, empresa_id, ativo, criado_em) VALUES ($1, $2, $3, '$2a$10$test', 'rh', 'funcionario_clinica', $4, $5, true, NOW())`,
              [
                rhCpf,
                'RH E2E Teste',
                `rh${timestamp}@test.com`,
                clinicaId,
                empresaId,
              ]
            );

            return { clinicaId, empresaId, rhCpf };
          } catch (err: any) {
            console.error('Task db:setupTestEnvironment error:', err);
            throw err;
          }
        },

        async 'db:cleanupTestEnvironment'(args: any) {
          const { clinicaId, empresaId, rhCpf } = args;
          try {
            const { query } = await import('./lib/db');

            if (rhCpf) {
              await query('DELETE FROM funcionarios WHERE cpf = $1', [rhCpf]);
            }

            if (empresaId) {
              await query('DELETE FROM empresas_clientes WHERE id = $1', [
                empresaId,
              ]);
            }

            if (clinicaId) {
              await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]);
            }

            return true;
          } catch (err: any) {
            console.error('Task db:cleanupTestEnvironment error:', err);
            throw err;
          }
        },

        async 'db:getFuncionario'(args: any) {
          const { cpf } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT * FROM funcionarios WHERE cpf = $1 LIMIT 1',
              [cpf]
            );
            return res.rows[0] || null;
          } catch (err: any) {
            console.error('Task db:getFuncionario error:', err);
            throw err;
          }
        },

        async 'db:getAvaliacoesLote'(args: any) {
          const { loteId } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT * FROM avaliacoes WHERE lote_id = $1',
              [loteId]
            );
            return res.rows || [];
          } catch (err: any) {
            console.error('Task db:getAvaliacoesLote error:', err);
            throw err;
          }
        },

        async 'db:concluirAvaliacao'(args: any) {
          const { loteId, funcionarioCpf } = args;
          try {
            const { query } = await import('./lib/db');
            await query(
              "UPDATE avaliacoes SET status = 'finalizada' WHERE lote_id = $1 AND funcionario_cpf = $2",
              [loteId, funcionarioCpf]
            );
            return { success: true };
          } catch (err: any) {
            console.error('Task db:concluirAvaliacao error:', err);
            throw err;
          }
        },

        async 'db:recalcularLote'(args: any) {
          const { loteId } = args;
          try {
            const { query } = await import('./lib/db');

            await query(
              `UPDATE lotes SET funcionarios_concluidos = (SELECT COUNT(*) FROM avaliacoes WHERE lote_id = $1 AND status = 'finalizada') WHERE id = $1`,
              [loteId]
            );
            await query(
              `UPDATE lotes SET status = 'pronto' WHERE id = $1 AND total_funcionarios = funcionarios_concluidos`,
              [loteId]
            );

            return { success: true };
          } catch (err: any) {
            console.error('Task db:recalcularLote error:', err);
            throw err;
          }
        },

        async 'db:getLote'(args: any) {
          const { loteId } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              'SELECT * FROM lotes WHERE id = $1 LIMIT 1',
              [loteId]
            );
            return res.rows[0] || null;
          } catch (err: any) {
            console.error('Task db:getLote error:', err);
            throw err;
          }
        },

        async 'db:createIncompleteLote'(args: any) {
          const { clinicaId, loteId } = args;
          try {
            const { query } = await import('./lib/db');
            const res = await query(
              `INSERT INTO lotes (id, clinica_id, titulo, status, total_funcionarios, funcionarios_concluidos, criado_em) VALUES ($1, $2, 'Lote Incompleto', 'enviado', 3, 1, NOW()) RETURNING id`,
              [loteId, clinicaId]
            );
            return { success: true, id: res.rows[0].id };
          } catch (err: any) {
            console.error('Task db:createIncompleteLote error:', err);
            throw err;
          }
        },

        async 'db:deleteLote'(args: any) {
          const { loteId } = args;
          try {
            const { query } = await import('./lib/db');
            await query('DELETE FROM lotes WHERE id = $1', [loteId]);
            return true;
          } catch (err: any) {
            console.error('Task db:deleteLote error:', err);
            throw err;
          }
        },

        async 'db:createRHWithoutPermission'(args: any) {
          const { cpf, clinicaId, empresaId } = args;
          try {
            const { query } = await import('./lib/db');
            await query(
              `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, usuario_tipo, clinica_id, empresa_id, permissoes, ativo, criado_em) VALUES ($1, $2, $3, '$2a$10$test', 'rh', 'funcionario_clinica', $4, $5, '{}', true, NOW())`,
              [cpf, 'RH Sem Permissão', `${cpf}@test.com`, clinicaId, empresaId]
            );
            return { success: true };
          } catch (err: any) {
            console.error('Task db:createRHWithoutPermission error:', err);
            throw err;
          }
        },

        async 'db:deleteFuncionario'(args: any) {
          const { cpf } = args;
          try {
            const { query } = await import('./lib/db');
            await query('DELETE FROM funcionarios WHERE cpf = $1', [cpf]);
            return true;
          } catch (err: any) {
            console.error('Task db:deleteFuncionario error:', err);
            throw err;
          }
        },
      });

      return config;
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
  },
});
