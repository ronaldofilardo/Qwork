import '@testing-library/jest-dom';
import { query } from '@/lib/db';

describe('Integração: confirmação idempotente e reversão de pagamento', () => {
  let planoId: number;
  let contratanteId: number;
  let contratoId: number;
  let pagamentoId: number;

  beforeAll(async () => {
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('fixo', 'Plano E2E Idempotente', 25, true) RETURNING id`,
      []
    );
    planoId = planoRes.rows[0].id;
  });

  afterAll(async () => {
    if (planoId) await query('DELETE FROM planos WHERE id = $1', [planoId]);
  });

  beforeEach(async () => {
    // Criar contratante + contrato + pagamento
    const contratanteRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular, numero_funcionarios_estimado, plano_id, ativa, pagamento_confirmado) VALUES ('entidade', 'Empresa E2E Idempotente', '00000000000191', 'e2e-idempotente@teste.local', '11999999999', 'Rua Teste', 'Cidade', 'ST', '00000000', '52998224725', 'Resp E2E', 'resp@teste.local', '11911111110', 5, $1, false, false) RETURNING id, cnpj`,
      [planoId]
    );
    contratanteId = contratanteRes.rows[0].id;

    await query('UPDATE contratantes SET status = $1 WHERE id = $2', [
      'aguardando_pagamento',
      contratanteId,
    ]);

    const contratoInsert = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', true, $5) RETURNING id`,
      [contratanteId, planoId, 5, 5 * 20.0, 'Contrato E2E aceito']
    );

    contratoId = contratoInsert.rows[0].id;

    const pagamentoInsert = await query(
      `INSERT INTO pagamentos (contratante_id, contrato_id, valor, status, metodo) VALUES ($1, $2, $3, 'pendente', 'avista') RETURNING id`,
      [contratanteId, contratoId, 100.0]
    );

    pagamentoId = pagamentoInsert.rows[0].id;
  });

  afterEach(async () => {
    if (pagamentoId)
      await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
    if (contratoId)
      await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
    if (contratanteId)
      await query('DELETE FROM contratantes WHERE id = $1', [contratanteId]);
    pagamentoId = 0 as any;
    contratoId = 0 as any;
    contratanteId = 0 as any;
  });

  test('Confirmando pagamento gera recibo com sucesso', async () => {
    const { POST } = await import('@/app/api/pagamento/confirmar/route');

    const req: any = {
      json: async () => ({
        pagamento_id: pagamentoId,
        metodo_pagamento: 'transferencia',
      }),
      headers: { get: jest.fn() },
    };

    const res1: any = await POST(req);

    try {
      const body = await res1.json();
      console.error(
        '[TEST DEBUG] Body da resposta:',
        JSON.stringify(body, null, 2)
      );
    } catch (e) {
      try {
        const text = await res1.text();
        console.error('[TEST DEBUG] Body como texto:', text);
      } catch (e2) {
        console.error('[TEST DEBUG] Não conseguiu ler resposta');
      }
    }

    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.show_receipt_info).toBe(true);

    // Gerar recibo sob demanda (duas chamadas para validar idempotência)
    const { POST: gerarReciboPOST } =
      await import('@/app/api/recibo/gerar/route');
    const gerarReq: any = {
      json: async () => ({
        contrato_id: contratoId,
        pagamento_id: pagamentoId,
      }),
      headers: { get: jest.fn() },
    };

    const gerarRes1: any = await gerarReciboPOST(gerarReq);
    expect(gerarRes1.status).toBe(200);
    const gerarData1 = await gerarRes1.json();
    expect(gerarData1.success).toBe(true);
    expect(gerarData1.recibo).toBeDefined();
    const reciboId = gerarData1.recibo.id;

    // Segunda chamada deve retornar o mesmo recibo (idempotência)
    const gerarRes2: any = await gerarReciboPOST(gerarReq);
    expect(gerarRes2.status).toBe(200);
    const gerarData2 = await gerarRes2.json();
    expect(gerarData2.success).toBe(true);
    expect(gerarData2.recibo.id).toBe(reciboId);

    // Verificar DB: apenas um recibo para o pagamento
    const recibos = await query(
      'SELECT * FROM recibos WHERE pagamento_id = $1',
      [pagamentoId]
    );
    expect(recibos.rows.length).toBe(1);
  }, 20000);

  // Teste de reversão removido: reversões não serão tratadas automaticamente nesta fase
});
