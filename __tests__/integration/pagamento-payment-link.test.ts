import '@testing-library/jest-dom';
import { query } from '@/lib/db';

describe('Integração: pagamento via payment link (uso único)', () => {
  let planoId: number;
  let contratanteId: number;
  let contratoId: number;
  let paymentLinkToken: string;
  let pagamentoId: number;

  beforeAll(async () => {
    const planoRes = await query(
      `INSERT INTO planos (tipo, nome, preco, ativo) VALUES ('personalizado', 'Plano Link Test', 50, true) RETURNING id`,
      []
    );
    planoId = planoRes.rows[0].id;
  });

  afterAll(async () => {
    if (planoId) await query('DELETE FROM planos WHERE id = $1', [planoId]);
  });

  beforeEach(async () => {
    const contratanteRes = await query(
      `INSERT INTO contratantes (tipo, nome, cnpj, email, telefone, endereco, cidade, estado, cep, responsavel_cpf, responsavel_nome, responsavel_email, responsavel_celular, numero_funcionarios_estimado, plano_id, ativa, pagamento_confirmado) VALUES ('entidade', 'Empresa Link Test', '00000000000191', 'link@test.local', '11999999999', 'Rua Link', 'Cidade', 'ST', '00000000', '52998224725', 'Resp Link', 'resp@link.local', '11911111110', 5, $1, false, false) RETURNING id, cnpj`,
      [planoId]
    );
    contratanteId = contratanteRes.rows[0].id;

    await query('UPDATE contratantes SET status = $1 WHERE id = $2', [
      'aguardando_pagamento',
      contratanteId,
    ]);

    const contratoInsert = await query(
      `INSERT INTO contratos (contratante_id, plano_id, numero_funcionarios, valor_total, status, aceito, conteudo) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', true, $5) RETURNING id`,
      [contratanteId, planoId, 5, 5 * 50.0, 'Contrato Link Test']
    );

    contratoId = contratoInsert.rows[0].id;

    // Criar token de uso único
    paymentLinkToken = `token-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await query(
      `INSERT INTO payment_links (token, contrato_id, criado_por_cpf, expiracao) VALUES ($1, $2, $3, NOW() + INTERVAL '1 day')`,
      [paymentLinkToken, contratoId, '00000000000']
    );
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

  test('Fluxo: iniciar com token, confirmar e gerar recibo, token marcado como usado', async () => {
    const { POST: iniciarPOST } =
      await import('@/app/api/pagamento/iniciar/route');
    const { POST: confirmarPOST } =
      await import('@/app/api/pagamento/confirmar/route');

    const reqIniciar: any = {
      json: async () => ({
        contratante_id: contratanteId,
        payment_link_token: paymentLinkToken,
      }),
      headers: { get: jest.fn() },
    };

    const res1: any = await iniciarPOST(reqIniciar);
    expect(res1.status).toBe(200);
    const data1 = await res1.json();
    expect(data1.success).toBe(true);
    expect(data1.pagamento_id).toBeDefined();
    pagamentoId = data1.pagamento_id;

    // Confirmar pagamento
    const reqConfirm: any = {
      json: async () => ({
        pagamento_id: pagamentoId,
        metodo_pagamento: 'pix',
      }),
      headers: { get: jest.fn() },
    };

    const res2: any = await confirmarPOST(reqConfirm);
    expect(res2.status).toBe(200);
    const data2 = await res2.json();
    expect(data2.success).toBe(true);
    // Novo fluxo: recibo sob demanda → frontend deve mostrar informações para o usuário
    expect(data2.show_receipt_info).toBe(true);

    // Gerar recibo sob demanda via API e verificar retorno
    const { POST: gerarReciboPOST } =
      await import('@/app/api/recibo/gerar/route');
    const gerarReq: any = {
      json: async () => ({
        contrato_id: contratoId,
        pagamento_id: pagamentoId,
      }),
      headers: { get: jest.fn() },
    };
    const gerarRes: any = await gerarReciboPOST(gerarReq);
    expect(gerarRes.status).toBe(200);
    const gerarData = await gerarRes.json();
    expect(gerarData.success).toBe(true);
    expect(gerarData.recibo).toBeDefined();

    // Verificar token consumido
    const tokenRow = await query(
      'SELECT usado, usado_em FROM payment_links WHERE token = $1 LIMIT 1',
      [paymentLinkToken]
    );
    expect(tokenRow.rows.length).toBe(1);
    expect(tokenRow.rows[0].usado).toBe(true);
    expect(tokenRow.rows[0].usado_em).toBeDefined();

    // Verificar recibo no DB
    const recibos = await query(
      'SELECT * FROM recibos WHERE pagamento_id = $1',
      [pagamentoId]
    );
    expect(recibos.rows.length).toBe(1);
  }, 20000);
});
