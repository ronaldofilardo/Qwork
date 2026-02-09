import '@testing-library/jest-dom';
import { query } from '@/lib/db';

describe('Integração: simulador de pagamento (fluxo simples)', () => {
  let tomadorId: number;
  let contratoId: number;
  let planoId: number;
  let pagamentoId: number;

  beforeAll(async () => {
    const uniqueName = `Plano Sim Test ${Date.now()}`;
    const planoRes = await query(
      "INSERT INTO planos (tipo,nome,preco,ativo) VALUES ('personalizado',$1,100,true) RETURNING id",
      [uniqueName]
    );
    planoId = planoRes.rows[0].id;
  });

  afterAll(async () => {
    try {
      if (planoId) {
        // Remove qualquer tomador (entidade) que tenha ficado preso ao plano para evitar FK errors
        await query('DELETE FROM entidades WHERE plano_id = $1', [planoId]);
        await query('DELETE FROM planos WHERE id = $1', [planoId]);
      }
    } catch (err) {
      console.warn('Erro no cleanup afterAll plano:', err);
    }
  });

  beforeEach(async () => {
    const uniqueSuffix = String(Date.now()).slice(-6);
    const cnpj = `0000000000${uniqueSuffix}`; // simple unique cnpj for test
    const cpfResp = `52999${String(Math.floor(Math.random() * 100000)).padStart(6, '0')}`; // simple unique cpf-like value

    const uniqueEmail = `sim-${uniqueSuffix}@test.local`;
    // Criar tomador em entidades (para diferenciar de clínicas)
    const tomador = await query(
      `INSERT INTO entidades (tipo,nome,cnpj,email,telefone,endereco,cidade,estado,cep,responsavel_cpf,responsavel_nome,responsavel_email,responsavel_celular,numero_funcionarios_estimado,plano_id,ativa,pagamento_confirmado) VALUES ('entidade','Sim Contrat', $1, $2,'11999999999','Rua Sim','Cidade','ST','00000000',$3,'Resp Sim',$4,'11911111111',5,$5,false,false) RETURNING id, responsavel_cpf`,
      [cnpj, uniqueEmail, cpfResp, `resp-${uniqueSuffix}@test.local`, planoId]
    );
    tomadorId = tomador.rows[0].id;
    // store generated cpf for later assertions
    (global as any).__TEST_RESP_CPF = tomador.rows[0].responsavel_cpf;

    const contrato = await query(
      `INSERT INTO contratos (tomador_id,plano_id,numero_funcionarios,valor_total,status,aceito,conteudo) VALUES ($1,$2,$3,$4,'aguardando_pagamento',true,'Contrato Sim') RETURNING id`,
      [tomadorId, planoId, 5, 500]
    );
    contratoId = contrato.rows[0].id;
  });

  afterEach(async () => {
    try {
      if (pagamentoId) {
        await query('DELETE FROM recibos WHERE pagamento_id = $1', [
          pagamentoId,
        ]);
        await query('DELETE FROM pagamentos WHERE id = $1', [pagamentoId]);
      }
      if (contratoId)
        await query('DELETE FROM contratos WHERE id = $1', [contratoId]);
      if (tomadorId)
        await query('DELETE FROM entidades WHERE id = $1', [tomadorId]);
    } catch (err) {
      console.warn('Erro no cleanup do teste simulador:', err);
    } finally {
      pagamentoId = 0 as any;
      contratoId = 0 as any;
      tomadorId = 0 as any;
      (global as any).__TEST_RESP_CPF = undefined;
    }
  });

  test('Simulador: confirmar pagamento gera recibo e ativa login', async () => {
    const { POST: simConfirm } =
      await import('@/app/api/pagamento/simulador/confirmar/route');

    const req: any = {
      json: async () => ({
        tomador_id: tomadorId,
        contrato_id: contratoId,
        metodo_pagamento: 'parcelado',
        numero_parcelas: 3,
      }),
      headers: { get: jest.fn() },
    };

    const res: any = await simConfirm(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.pagamento_id).toBeDefined();
    // Novo fluxo: simulação retorna informação para mostrar recibo sob demanda
    expect(data.show_receipt_info).toBe(true);
    pagamentoId = data.pagamento_id;

    // Verificar pagamento no DB
    const p = await query(
      'SELECT id,status,metodo,numero_parcelas FROM pagamentos WHERE id = $1',
      [pagamentoId]
    );
    expect(p.rows.length).toBe(1);
    expect(p.rows[0].status).toBe('pago');
    expect(p.rows[0].metodo).toBe('parcelado');
    expect(p.rows[0].numero_parcelas).toBe(3);

    // Gerar recibo sob demanda via API e verificar
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

    // Verificar recibo no DB
    const r = await query('SELECT * FROM recibos WHERE pagamento_id = $1', [
      pagamentoId,
    ]);
    expect(r.rows.length).toBe(1);

    // Verificar tomador (tomador entidade) ativado via view agnóstica
    const c = await query(
      'SELECT status, ativa, pagamento_confirmado FROM tomadores WHERE id = $1',
      [tomadorId]
    );
    expect(c.rows[0].status).toBe('aprovado');
    expect(c.rows[0].ativa).toBe(true);
    expect(c.rows[0].pagamento_confirmado).toBe(true);

    // Verificar login criado
    const respCpf = (global as any).__TEST_RESP_CPF || '52998224725';
    const login = await query('SELECT * FROM funcionarios WHERE cpf = $1', [
      respCpf,
    ]);
    expect(login.rows.length).toBeGreaterThanOrEqual(1);
  }, 20000);
});
