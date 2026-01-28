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
