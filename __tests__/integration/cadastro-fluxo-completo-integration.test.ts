/**
 * Testes de Integração: Fluxo Completo de Cadastro
 *
 * Atualizado: 20/Janeiro/2026
 * Valida interação entre APIs, banco de dados e ativação de contratantes
 */

import { query, transaction } from '@/lib/db';
import { ativarContratante } from '@/lib/contratante-activation';

describe('Integração: Fluxo Completo Cadastro → Ativação', () => {
  describe('Cenário 1: Plano Fixo - Fluxo Feliz', () => {
    let contratanteId: number;
    let contratoId: number;
    let planoId: number;
    const timestamp = Date.now();
    const cnpj = `11${timestamp.toString().slice(-10)}00199`;
    const email = `integ-fixo-${timestamp}@test.com`;
    const cpf = `${timestamp.toString().slice(-11)}`;

    beforeAll(async () => {
      const planoRes = await query(
        `SELECT id FROM planos WHERE tipo = 'fixo' LIMIT 1`
      );
      planoId = planoRes.rows[0].id;
    });

    afterAll(async () => {
      if (contratanteId) {
        await query(`DELETE FROM contratos WHERE contratante_id = $1`, [
          contratanteId,
        ]);
        await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
      }
      await query(`DELETE FROM funcionarios WHERE cpf = $1`, [cpf]);
    });

    it('deve executar fluxo completo em uma transação', async () => {
      await transaction(async (txClient) => {
        // 1. Criar contratante
        const contratanteRes = await txClient.query(
          `INSERT INTO contratantes (
            tipo, nome, cnpj, email, telefone,
            endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
            plano_id, numero_funcionarios_estimado,
            status, ativa, pagamento_confirmado
          ) VALUES (
            'entidade', 'Integração Fixo LTDA', $1, $2, '11999999999',
            'Rua Integração, 100', 'São Paulo', 'SP', '01234567',
            'Fulano Integração', $3, 'fulano@integ.com', '11988888888',
            $4, 75,
            'aguardando_pagamento', false, false
          ) RETURNING id`,
          [cnpj, email, cpf, planoId]
        );
        contratanteId = contratanteRes.rows[0].id;

        // 2. Criar contrato
        const contratoRes = await txClient.query(
          `INSERT INTO contratos (
            contratante_id, plano_id,
            numero_funcionarios, valor_total,
            status, aceito, conteudo
          ) VALUES (
            $1, $2, 75, 1500.00,
            'aguardando_pagamento', false,
            'Contrato de teste integração'
          ) RETURNING id`,
          [contratanteId, planoId]
        );
        contratoId = contratoRes.rows[0].id;

        // 3. Aceitar contrato
        await txClient.query(
          `UPDATE contratos 
           SET aceito = true, data_aceite = NOW()
           WHERE id = $1`,
          [contratoId]
        );

        // 4. Simular pagamento
        await txClient.query(
          `UPDATE contratantes 
           SET pagamento_confirmado = true,
               data_primeiro_pagamento = NOW()
           WHERE id = $1`,
          [contratanteId]
        );

        await txClient.query(
          `UPDATE contratos 
           SET status = 'pago', data_pagamento = NOW()
           WHERE id = $1`,
          [contratoId]
        );
      });

      // Transação comitada - verificar dados
      const contratante = await query(
        `SELECT * FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      expect(contratante.rows[0].pagamento_confirmado).toBe(true);

      const contrato = await query(`SELECT * FROM contratos WHERE id = $1`, [
        contratoId,
      ]);
      expect(contrato.rows[0].aceito).toBe(true);
      expect(contrato.rows[0].status).toBe('pago');
    });

    it('deve ativar contratante e criar conta responsável', async () => {
      const result = await ativarContratante({
        contratante_id: contratanteId,
        motivo: 'Teste de integração - fluxo completo',
      });

      expect(result.success).toBe(true);

      // Verificar contratante ativo
      const contratante = await query(
        `SELECT ativa, status FROM contratantes WHERE id = $1`,
        [contratanteId]
      );
      expect(contratante.rows[0].ativa).toBe(true);
      expect(contratante.rows[0].status).toBe('aprovado');

      // Verificar conta criada
      const funcionario = await query(
        `SELECT * FROM funcionarios WHERE cpf = $1`,
        [cpf]
      );
      expect(funcionario.rows.length).toBe(1);
      expect(funcionario.rows[0].perfil).toBe('entidade');
    });

    it('deve ter registros de auditoria', async () => {
      const auditLogs = await query(
        `SELECT * FROM audit_logs 
         WHERE resource = 'contratantes' 
         AND resource_id = $1
         ORDER BY timestamp DESC`,
        [contratanteId]
      );

      expect(auditLogs.rows.length).toBeGreaterThan(0);
      const ativacaoLog = auditLogs.rows.find(
        (log: any) => log.action === 'ACTIVATE'
      );
      expect(ativacaoLog).toBeDefined();
    });
  });

  describe('Cenário 2: Plano Personalizado - Fluxo Feliz', () => {
    let contratanteId: number;
    let contratoId: number;
    let contratacaoId: number = 0;
    let planoId: number;
    const timestamp = Date.now();
    const cnpj = `22${timestamp.toString().slice(-10)}00199`;
    const email = `integ-pers-${timestamp}@test.com`;
    const cpf = `${timestamp.toString().slice(-11)}`;

    beforeAll(async () => {
      const planoRes = await query(
        `SELECT id FROM planos WHERE tipo = 'personalizado' LIMIT 1`
      );
      planoId = planoRes.rows[0].id;
    });

    afterAll(async () => {
      if (contratanteId) {
        await query(
          `DELETE FROM contratacao_personalizada WHERE contratante_id = $1`,
          [contratanteId]
        );
        await query(`DELETE FROM contratos WHERE contratante_id = $1`, [
          contratanteId,
        ]);
        await query(`DELETE FROM contratantes WHERE id = $1`, [contratanteId]);
      }
      await query(`DELETE FROM funcionarios WHERE cpf = $1`, [cpf]);
    });

    it('deve executar fluxo personalizado completo', async () => {
      await transaction(async (txClient) => {
        // 1. Criar contratante
        const contratanteRes = await txClient.query(
          `INSERT INTO contratantes (
            tipo, nome, cnpj, email, telefone,
            endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
            plano_id, numero_funcionarios_estimado,
            status, ativa, pagamento_confirmado
          ) VALUES (
            'clinica', 'Integração Personalizada', $1, $2, '21999999999',
            'Av. Personalizada, 200', 'Rio de Janeiro', 'RJ', '20000000',
            'Ciclano Integração', $3, 'ciclano@integ.com', '21988888888',
            $4, 100,
            'pendente', false, false
          ) RETURNING id`,
          [cnpj, email, cpf, planoId]
        );
        contratanteId = contratanteRes.rows[0].id;

        // 2. Criar contratação personalizada
        const contratacaoRes = await txClient.query(
          `INSERT INTO contratacao_personalizada (
            contratante_id, numero_funcionarios_estimado,
            status, criado_em, atualizado_em
          ) VALUES (
            $1, 100, 'aguardando_valor_admin',
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING id`,
          [contratanteId]
        );
        contratacaoId = contratacaoRes.rows[0].id as number;

        // 3. Admin define valores
        await txClient.query(
          `UPDATE contratacao_personalizada 
           SET valor_por_funcionario = 17.50,
               numero_funcionarios_estimado = 100,
               valor_total_estimado = 1750.00,
               status = 'valor_definido',
               atualizado_em = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [contratacaoId]
        );

        // 4. Criar contrato
        const contratoRes = await txClient.query(
          `INSERT INTO contratos (
            contratante_id, plano_id,
            numero_funcionarios, valor_total,
            status, aceito, conteudo
          ) VALUES (
            $1, $2, 100, 1750.00,
            'aguardando_aceite', false,
            'Contrato personalizado teste integração'
          ) RETURNING id`,
          [contratanteId, planoId]
        );
        contratoId = contratoRes.rows[0].id;

        // 5. Aceitar contrato
        await txClient.query(
          `UPDATE contratos 
           SET aceito = true, 
               status = 'aguardando_pagamento',
               data_aceite = NOW()
           WHERE id = $1`,
          [contratoId]
        );

        await txClient.query(
          `UPDATE contratacao_personalizada 
           SET status = 'aguardando_aceite_contrato',
               atualizado_em = NOW()
           WHERE id = $1`,
          [contratacaoId]
        );

        // 6. Simular pagamento
        await txClient.query(
          `UPDATE contratantes 
           SET pagamento_confirmado = true,
               data_primeiro_pagamento = NOW()
           WHERE id = $1`,
          [contratanteId]
        );

        await txClient.query(
          `UPDATE contratos 
           SET status = 'pago', data_pagamento = NOW()
           WHERE id = $1`,
          [contratoId]
        );

        await txClient.query(
          `UPDATE contratacao_personalizada 
           SET status = 'pago', atualizado_em = NOW()
           WHERE id = $1`,
          [contratacaoId]
        );
      });

      // Verificar dados
      const idParam = contratacaoId.toString();
      const contratacao = await query(
        `SELECT * FROM contratacao_personalizada WHERE id = $1`,
        [idParam]
      );
      expect(contratacao.rows[0].status).toBe('pago');
      expect(parseFloat(contratacao.rows[0].valor_total_estimado)).toBe(1750.0);
    });

    it('deve ativar e criar conta responsável', async () => {
      const result = await ativarContratante({
        contratante_id: contratanteId,
        motivo: 'Teste de integração - fluxo personalizado completo',
      });

      expect(result.success).toBe(true);

      // Verificar funcionário criado
      const funcionario = await query(
        `SELECT * FROM funcionarios WHERE cpf = $1`,
        [cpf]
      );
      expect(funcionario.rows.length).toBe(1);
      expect(funcionario.rows[0].perfil).toBe('clinica');
    });
  });

  describe('Cenário 3: Rollback em Caso de Erro', () => {
    it('deve fazer rollback se houver erro na transação', async () => {
      const timestamp = Date.now();
      const cnpj = `99${timestamp.toString().slice(-10)}00199`;

      try {
        await transaction(async (txClient) => {
          // Criar contratante
          const res = await txClient.query(
            `INSERT INTO contratantes (
              tipo, nome, cnpj, email, telefone,
              endereco, cidade, estado, cep,
              responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
              plano_id, status
            ) VALUES (
              'entidade', 'Teste Rollback', $1, 'rollback@test.com', '11999999999',
              'Rua Teste, 1', 'São Paulo', 'SP', '01234567',
              'Teste', '12345678901', 'teste@test.com', '11988888888',
              1, 'pendente'
            ) RETURNING id`,
            [cnpj]
          );

          const id = res.rows[0].id;

          // Forçar erro (FK inválida)
          await txClient.query(
            `INSERT INTO contratos (
              contratante_id, plano_id,
              numero_funcionarios, valor_total,
              status
            ) VALUES (
              $1, 99999, 50, 1000.00, 'pendente'
            )`,
            [id]
          );
        });

        // Não deve chegar aqui
        expect(true).toBe(false);
      } catch (error) {
        // Erro esperado
        expect(error).toBeDefined();

        // Verificar que contratante não foi criado (rollback funcionou)
        const result = await query(
          `SELECT * FROM contratantes WHERE cnpj = $1`,
          [cnpj]
        );
        expect(result.rows.length).toBe(0);
      }
    });
  });

  describe('Cenário 4: Validações de Regras de Negócio', () => {
    it('não deve permitir duplicação de CNPJ', async () => {
      const timestamp = Date.now();
      const cnpj = `88${timestamp.toString().slice(-10)}00199`;

      // Criar primeiro contratante
      await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, status
        ) VALUES (
          'entidade', 'Primeiro', $1, 'primeiro@test.com', '11999999999',
          'Rua 1, 1', 'São Paulo', 'SP', '01234567',
          'Teste1', '11111111111', 'teste1@test.com', '11988888888',
          1, 'pendente'
        )`,
        [cnpj]
      );

      // Tentar criar segundo com mesmo CNPJ
      await expect(
        query(
          `INSERT INTO contratantes (
            tipo, nome, cnpj, email, telefone,
            endereco, cidade, estado, cep,
            responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
            plano_id, status
          ) VALUES (
            'clinica', 'Segundo', $1, 'segundo@test.com', '21999999999',
            'Rua 2, 2', 'Rio de Janeiro', 'RJ', '20000000',
            'Teste2', '22222222222', 'teste2@test.com', '21988888888',
            1, 'pendente'
          )`,
          [cnpj]
        )
      ).rejects.toThrow();

      // Limpar
      await query(`DELETE FROM contratantes WHERE cnpj = $1`, [cnpj]);
    });

    it('não deve permitir ativar sem pagamento confirmado', async () => {
      const timestamp = Date.now();
      const cnpj = `77${timestamp.toString().slice(-10)}00199`;

      // Criar contratante sem pagamento
      const res = await query(
        `INSERT INTO contratantes (
          tipo, nome, cnpj, email, telefone,
          endereco, cidade, estado, cep,
          responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
          plano_id, status, pagamento_confirmado
        ) VALUES (
          'entidade', 'Sem Pagamento', $1, 'sempag@test.com', '11999999999',
          'Rua 1, 1', 'São Paulo', 'SP', '01234567',
          'Teste', '99999999999', 'teste@test.com', '11988888888',
          1, 'pendente', false
        ) RETURNING id`,
        [cnpj]
      );

      const id = res.rows[0].id;

      // Tentar ativar
      await expect(
        ativarContratante({
          contratante_id: id,
          motivo: 'Tentativa inválida',
        })
      ).rejects.toThrow('sem pagamento confirmado');

      // Limpar
      await query(`DELETE FROM contratantes WHERE id = $1`, [id]);
    });
  });

  describe('Cenário 5: Performance e Concorrência', () => {
    it('deve lidar com múltiplas inserções simultâneas', async () => {
      const promises = [];
      const timestamp = Date.now();

      for (let i = 0; i < 5; i++) {
        const cnpj = `66${timestamp}${i.toString().padStart(5, '0')}`;
        const email = `concurrent${i}-${timestamp}@test.com`;

        promises.push(
          query(
            `INSERT INTO contratantes (
              tipo, nome, cnpj, email, telefone,
              endereco, cidade, estado, cep,
              responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular,
              plano_id, status
            ) VALUES (
              'entidade', 'Concorrente ${i}', $1, $2, '11999999999',
              'Rua ${i}, ${i}', 'São Paulo', 'SP', '01234567',
              'Teste${i}', '${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}${i}', 
              'teste${i}@test.com', '11988888888',
              1, 'pendente'
            )`,
            [cnpj, email]
          )
        );
      }

      await Promise.all(promises);

      // Verificar que todas foram criadas
      const result = await query(
        `SELECT COUNT(*) FROM contratantes WHERE cnpj LIKE '66${timestamp}%'`
      );
      expect(parseInt(result.rows[0].count as string)).toBe(5);

      // Limpar
      await query(`DELETE FROM contratantes WHERE cnpj LIKE '66${timestamp}%'`);
    });
  });
});
