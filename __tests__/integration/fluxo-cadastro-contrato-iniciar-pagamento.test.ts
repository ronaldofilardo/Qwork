import '@testing-library/jest-dom';
import { query } from '@/lib/db';
import { POST } from '@/app/api/pagamento/iniciar/route';

describe('Integração: cadastro -> contrato aceito -> iniciar pagamento', () => {
  let planoId: number;
  let contratanteId: number;
  let contratoId: number;

  beforeAll(async () => {
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Plano E2E Teste', 25, true) RETURNING id`,
      []
    );
    planoId = planoRes.rows[0].id;
  });

  beforeEach(async () => {
    const cnpj = `E2E${Math.floor(Math.random() * 1000000000)}`;
    const contratanteRes = await query(
      `INSERT INTO contratantes (
        tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep,
        responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular,
        numero_funcionarios_estimado, plano_id, ativa, pagamento_confirmado
      ) VALUES (
        'entidade', 'Contratante E2E', $1, 'e2e@teste.com', '11999999999', 'Rua E2E, 1', 'Cidade', 'ST', '00000000',
        '11122233344', 'Responsavel', 'resp@teste.com', '11911111111', 10, $2, false, false
      ) RETURNING id`,
      [cnpj, planoId]
    );
    contratanteId = contratanteRes.rows[0].id;

    // Atualizar status explicitamente para aguardando_pagamento
    await query(
      `UPDATE contratantes SET status = 'aguardando_pagamento' WHERE id = $1`,
      [contratanteId]
    );

    const contratoRes = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo)
       VALUES ($1, $2, 10, 250.0, 'aguardando_pagamento', true, 'Contrato E2E aceito') RETURNING id, valor_total`,
      [contratanteId, planoId]
    );
    contratoId = contratoRes.rows[0].id;
  });

  afterEach(async () => {
    if (contratoId) {
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    }
    if (contratanteId) {
      await query('DELETE FROM pagamentos WHERE contratante_id = $1', [
        contratanteId,
      ]);
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    }
  });

  afterAll(async () => {
    if (planoId) {
      await query('DELETE FROM planos WHERE id = $1', [planoId]);
    }
  });

  test('Deve iniciar pagamento usando contrato aceito e valor do contrato', async () => {
    // Reproduzir passos manualmente para diagnosticar erro em caso de falha
    const contratanteQuery = `SELECT c.id, c.nome, c.plano_id, c.status, COALESCE(c.numero_funcionarios_estimado, 1) as numero_funcionarios, 
                p.nome as plano_nome, p.tipo as plano_tipo, p.preco, ctr.id as contrato_id, ctr.aceito as contrato_aceito, ctr.valor_total as contrato_valor_total
         FROM contratantes c
         LEFT JOIN planos p ON c.plano_id = p.id
         JOIN contratos ctr ON ctr.contratante_id = c.id AND ctr.id = $2
         WHERE c.id = $1`;

    const contratanteRes = await query(contratanteQuery, [
      contratanteId,
      contratoId,
    ]);

    const contratoValidate = await query(
      `SELECT id, aceito FROM contratos WHERE id = $1 AND contratante_id = $2`,
      [contratoId, contratanteId]
    );

    // Tentar inserir pagamento diretamente para ver se há erro de constraint/trigger
    try {
      const insertRes = await query(
        `INSERT INTO pagamentos (contratante_id, contrato_id, valor, valor_por_funcionario, numero_funcionarios, status, metodo)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [contratanteId, contratoId, 250.0, 25.0, 10, 'pendente', 'avista']
      );
    } catch (err: any) {
      console.error('[E2E DEBUG] insert error:', err);
    }

    // Agora chamar o endpoint
    const fakeReq: any = {
      json: async () => ({
        contratante_id: contratanteId,
        contrato_id: contratoId,
      }),
    };

    const res: any = await POST(fakeReq);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.pagamento_id).toBeDefined();
    expect(body.valor).toBe(250.0);
    expect(body.numero_funcionarios).toBe(10);

    // Verificar que o pagamento foi persistido no banco
    const pagamentoDb = await query('SELECT * FROM pagamentos WHERE id = $1', [
      body.pagamento_id,
    ]);
    expect(pagamentoDb.rows.length).toBe(1);
    expect(parseFloat(pagamentoDb.rows[0].valor)).toBe(250.0);
  });
});
