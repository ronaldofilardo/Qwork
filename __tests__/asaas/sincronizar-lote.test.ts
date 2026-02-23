/**
 * Testes: /api/pagamento/asaas/sincronizar-lote
 *
 * Padrão RLS: lotes_avaliacao tem trigger que exige app.current_user_cpf.
 * Solução: pg.Client dedicado com SET (session) para cada INSERT em lotes_avaliacao.
 * Isso garante que a variável esteja na mesma conexão que executa o INSERT,
 * independente do pool LIFO.
 *
 * pagamentos, empresas_clientes e clinicas não têm trigger RLS — usam query() normal.
 *
 * @see app/api/pagamento/asaas/sincronizar-lote/route.ts
 */

import { query } from '@/lib/db';
import { createTesttomador } from '../helpers/test-data-factory';
import { NextRequest } from 'next/server';
import { Pool as PgPool } from 'pg';

// Pool singleton reutilizado por todos os setupLote — fecha apenas no afterAll global
const setupPool = new PgPool({
  connectionString: process.env.TEST_DATABASE_URL,
});

afterAll(async () => {
  await setupPool.end().catch(() => {});
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

/**
 * Configura app vars RLS num client dedicado via SET SESSION.
 * SET SESSION persiste em toda a sessão (não só na transação atual),
 * garantindo que qualquer trigger/RLS na mesma conexão veja os valores.
 */
async function setRLSContext(
  client: Awaited<ReturnType<InstanceType<typeof PgPool>['connect']>>,
  clinicaId: number
) {
  await client.query(`SET SESSION app.current_user_cpf = '00000000000'`);
  await client.query(`SET SESSION app.current_user_perfil = 'rh'`);
  await client.query(
    `SET SESSION app.current_user_clinica_id = '${clinicaId}'`
  );
}

/**
 * Cria clínica + empresa + lote num único client dedicado.
 * empresas_clientes e lotes_avaliacao têm audit_trigger_func → current_user_cpf() (strict).
 * SET SESSION no client garante que todos os INSERTs (incluindo triggers) vejam o contexto.
 */
async function setupLote(statusPagamento = 'aguardando_pagamento') {
  // createTesttomador usa tabelas sem audit_trigger_func (tomadores, clinicas)
  const clinicaId = await createTesttomador({ tipo: 'clinica' });

  const client = await setupPool.connect();
  try {
    await setRLSContext(client, clinicaId);

    // Insert empresa (audit_trigger_func → current_user_cpf())
    const empresaRes = await client.query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa)
       VALUES ($1, $2, $3, true) RETURNING id`,
      [clinicaId, `EmpSL ${uid()}`, `${Date.now().toString().slice(-14)}`]
    );
    const empresaId = empresaRes.rows[0].id as number;

    // Insert lote: RLS exige clinica_id = current_setting('app.current_user_clinica_id')
    // Quando status_pagamento = 'pago', CHECK constraint exige pagamento_metodo/parcelas/pago_em
    const pagoMetodo = statusPagamento === 'pago' ? 'boleto' : null;
    const pagoParcelas = statusPagamento === 'pago' ? 1 : null;
    const pagoEm = statusPagamento === 'pago' ? new Date() : null;
    await client.query('BEGIN');
    const loteRes = await client.query(
      `INSERT INTO lotes_avaliacao
         (empresa_id, clinica_id, entidade_id, status, status_pagamento,
          valor_por_funcionario, pagamento_metodo, pagamento_parcelas, pago_em)
       VALUES ($1, $2, NULL, 'ativo', $3::status_pagamento,
               100.00, $4, $5, $6)
       RETURNING id`,
      [empresaId, clinicaId, statusPagamento, pagoMetodo, pagoParcelas, pagoEm]
    );
    await client.query('COMMIT');
    const loteId = loteRes.rows[0].id as number;

    return { clinicaId, empresaId, loteId };
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
    // NÃO fechar pool aqui — é singleton gerenciado pelo afterAll global
  }
}

/** Cria pagamento vinculado ao lote.
 * NOTA: a tabela pagamentos NÃO tem empresa_id — usa clinica_id/entidade_id + dados_adicionais.
 */
async function setupPagamento(opts: {
  clinicaId: number;
  empresaId?: number; // kept for compat — não usado no INSERT
  loteId?: number;
  asaasPaymentId?: string;
}) {
  const asaasPaymentId = opts.asaasPaymentId ?? `pay_sl_${uid()}`;
  const dadosAdicionais = opts.loteId
    ? JSON.stringify({ lote_id: String(opts.loteId) })
    : '{}';
  const res = await query(
    `INSERT INTO pagamentos
       (clinica_id, entidade_id, valor, status, asaas_payment_id,
        asaas_customer_id, metodo, dados_adicionais)
     VALUES ($1, NULL, 100.00, 'pendente', $2, 'cus_sl', 'boleto', $3::jsonb)
     RETURNING id`,
    [opts.clinicaId, asaasPaymentId, dadosAdicionais]
  );
  return { pagamentoId: res.rows[0].id as number, asaasPaymentId };
}

async function cleanup(loteId: number, empresaId: number, clinicaId: number) {
  // pagamentos não tem empresa_id — deletar por clinica_id para limpar dados de teste
  await query('DELETE FROM pagamentos WHERE clinica_id = $1', [
    clinicaId,
  ]).catch(() => {});
  await query('DELETE FROM lotes_avaliacao WHERE id = $1', [loteId]).catch(
    () => {}
  );
  await query('DELETE FROM empresas_clientes WHERE id = $1', [empresaId]).catch(
    () => {}
  );
  await query('DELETE FROM clinicas WHERE id = $1', [clinicaId]).catch(
    () => {}
  );
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockActivate = jest.fn().mockResolvedValue(undefined);
const mockLogWebhook = jest.fn().mockResolvedValue(undefined);
const mockAlreadyProcessed = jest.fn().mockResolvedValue(false);
const mockGetPayment = jest.fn();

function mockRoute() {
  jest.resetModules();
  jest.doMock('@/lib/asaas/client', () => ({
    asaasClient: { getPayment: mockGetPayment },
  }));
  jest.doMock('@/lib/asaas/webhook-handler', () => ({
    activateSubscription: mockActivate,
    logWebhookProcessed: mockLogWebhook,
    isWebhookAlreadyProcessed: mockAlreadyProcessed,
    handlePaymentWebhook: jest.fn(),
    validateWebhookSignature: jest.fn(),
  }));
  return import('@/app/api/pagamento/asaas/sincronizar-lote/route');
}

function post(body: object) {
  return new NextRequest(
    'http://localhost/api/pagamento/asaas/sincronizar-lote',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

function get(params: Record<string, string> = {}) {
  const url = new URL('http://localhost/api/pagamento/asaas/sincronizar-lote');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new NextRequest(url.toString(), { method: 'GET' });
}

function asaasPayload(
  status: string,
  loteId: number,
  pagamentoId: number,
  payId: string
) {
  return {
    id: payId,
    status,
    externalReference: `lote_${loteId}_pagamento_${pagamentoId}`,
    value: 100,
    netValue: 95,
    billingType: 'BOLETO',
    dateCreated: new Date().toISOString(),
    customer: 'cus_test',
  };
}

// ── Suite 1: Validações de entrada (sem BD) ────────────────────────────────────

describe('/sincronizar-lote — Validações de entrada', () => {
  let POST: (r: NextRequest) => Promise<Response>;
  let GET: (r: NextRequest) => Promise<Response>;

  beforeAll(async () => {
    ({ POST, GET } = await mockRoute());
  });
  afterAll(() => jest.resetModules());

  it('POST sem lote_id → 400', async () => {
    const res = await POST(post({}));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/lote_id/i);
  });

  it('POST lote_id=0 → 400', async () => {
    expect((await POST(post({ lote_id: 0 }))).status).toBe(400);
  });

  it('POST lote_id negativo → 400', async () => {
    expect((await POST(post({ lote_id: -1 }))).status).toBe(400);
  });

  it('POST lote_id="abc" → 400', async () => {
    expect((await POST(post({ lote_id: 'abc' }))).status).toBe(400);
  });

  it('POST lote inexistente → 404', async () => {
    const res = await POST(post({ lote_id: 999999999 }));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toMatch(/n.o encontrado/i);
  });

  it('GET sem lote_id → 400', async () => {
    const res = await GET(get());
    expect(res.status).toBe(400);
  });
});

// ── Suite 2: Estados terminais (sem consulta ao Asaas) ────────────────────────

describe('/sincronizar-lote — Estados terminais', () => {
  let POST: (r: NextRequest) => Promise<Response>;
  let ctx: Awaited<ReturnType<typeof setupLote>>;
  let ctxCobranca: Awaited<ReturnType<typeof setupLote>>;

  beforeAll(async () => {
    ({ POST } = await mockRoute());
    ctx = await setupLote('pago');
    ctxCobranca = await setupLote('aguardando_cobranca');
  });

  afterAll(async () => {
    await cleanup(ctx.loteId, ctx.empresaId, ctx.clinicaId);
    await cleanup(
      ctxCobranca.loteId,
      ctxCobranca.empresaId,
      ctxCobranca.clinicaId
    );
    jest.resetModules();
  });

  it('status=pago → synced=false, Asaas não consultado', async () => {
    const res = await POST(post({ lote_id: ctx.loteId }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.synced).toBe(false);
    expect(json.status_pagamento).toBe('pago');
    expect(mockGetPayment).not.toHaveBeenCalled();
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('status=aguardando_cobranca → synced=false, Asaas não consultado', async () => {
    const res = await POST(post({ lote_id: ctxCobranca.loteId }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.synced).toBe(false);
    expect(json.status_pagamento).toBe('aguardando_cobranca');
    expect(mockGetPayment).not.toHaveBeenCalled();
  });
});

// ── Suite 3: Asaas não confirma pagamento ─────────────────────────────────────

describe('/sincronizar-lote — Pagamento não confirmado', () => {
  let POST: (r: NextRequest) => Promise<Response>;
  let ctx: Awaited<ReturnType<typeof setupLote>>;

  beforeAll(async () => {
    ({ POST } = await mockRoute());
    ctx = await setupLote('aguardando_pagamento');
  });

  afterEach(async () => {
    mockGetPayment.mockClear();
    mockActivate.mockClear();
    mockAlreadyProcessed.mockReset();
    mockAlreadyProcessed.mockResolvedValue(false);
    await query('DELETE FROM pagamentos WHERE empresa_id = $1', [
      ctx.empresaId,
    ]).catch(() => {});
  });

  afterAll(async () => {
    await cleanup(ctx.loteId, ctx.empresaId, ctx.clinicaId);
    jest.resetModules();
  });

  it('sem pagamentos candidatos → synced=false, Asaas não consultado', async () => {
    const res = await POST(post({ lote_id: ctx.loteId }));
    expect(res.status).toBe(200);
    expect((await res.json()).synced).toBe(false);
    expect(mockGetPayment).not.toHaveBeenCalled();
  });

  it('Asaas retorna PENDING → synced=false', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...ctx,
      loteId: ctx.loteId,
    });
    mockGetPayment.mockResolvedValueOnce(
      asaasPayload('PENDING', ctx.loteId, pagamentoId, asaasPaymentId)
    );

    const res = await POST(post({ lote_id: ctx.loteId }));
    expect((await res.json()).synced).toBe(false);
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('externalReference de outro lote → synced=false', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...ctx,
      loteId: ctx.loteId,
    });
    mockGetPayment.mockResolvedValueOnce({
      ...asaasPayload('RECEIVED', ctx.loteId, pagamentoId, asaasPaymentId),
      externalReference: `lote_99999_pagamento_${pagamentoId}`,
    });

    expect(
      (await (await POST(post({ lote_id: ctx.loteId }))).json()).synced
    ).toBe(false);
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('externalReference sem formato de lote → synced=false', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...ctx,
      loteId: ctx.loteId,
    });
    mockGetPayment.mockResolvedValueOnce({
      ...asaasPayload('RECEIVED', ctx.loteId, pagamentoId, asaasPaymentId),
      externalReference: `pagamento_avulso_${pagamentoId}`,
    });

    expect(
      (await (await POST(post({ lote_id: ctx.loteId }))).json()).synced
    ).toBe(false);
  });

  it('sem externalReference → synced=false', async () => {
    const { asaasPaymentId } = await setupPagamento({
      ...ctx,
      loteId: ctx.loteId,
    });
    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'RECEIVED',
    });

    expect(
      (await (await POST(post({ lote_id: ctx.loteId }))).json()).synced
    ).toBe(false);
  });

  it('Asaas lança erro → synced=false (não estoura 500)', async () => {
    await setupPagamento({ ...ctx, loteId: ctx.loteId });
    mockGetPayment.mockRejectedValueOnce(new Error('timeout'));

    const res = await POST(post({ lote_id: ctx.loteId }));
    expect(res.status).toBe(200);
    expect((await res.json()).synced).toBe(false);
  });
});

// ── Suite 4: Confirmação real ──────────────────────────────────────────────────
// Cada teste usa um lote próprio porque após sync o lote vai para 'pago'.

describe('/sincronizar-lote — Pagamento confirmado', () => {
  let POST: (r: NextRequest) => Promise<Response>;
  let GET_handler: (r: NextRequest) => Promise<Response>;

  // 4 lotes independentes para os 4 testes de confirmação
  let loteRecv: Awaited<ReturnType<typeof setupLote>>;
  let loteConf: Awaited<ReturnType<typeof setupLote>>;
  let loteOrdem: Awaited<ReturnType<typeof setupLote>>;
  let loteGet: Awaited<ReturnType<typeof setupLote>>;

  beforeAll(async () => {
    const route = await mockRoute();
    POST = route.POST;
    GET_handler = route.GET;
    mockAlreadyProcessed.mockResolvedValue(false);

    // setupLote usa client dedicado — pode ser chamado em paralelo sem problema
    [loteRecv, loteConf, loteOrdem, loteGet] = await Promise.all([
      setupLote('aguardando_pagamento'),
      setupLote('aguardando_pagamento'),
      setupLote('aguardando_pagamento'),
      setupLote('aguardando_pagamento'),
    ]);
  });

  afterEach(() => {
    mockGetPayment.mockClear();
    mockActivate.mockClear();
    mockLogWebhook.mockClear();
    mockAlreadyProcessed.mockReset();
    mockAlreadyProcessed.mockResolvedValue(false);
  });

  afterAll(async () => {
    await Promise.all([
      cleanup(loteRecv.loteId, loteRecv.empresaId, loteRecv.clinicaId),
      cleanup(loteConf.loteId, loteConf.empresaId, loteConf.clinicaId),
      cleanup(loteOrdem.loteId, loteOrdem.empresaId, loteOrdem.clinicaId),
      cleanup(loteGet.loteId, loteGet.empresaId, loteGet.clinicaId),
    ]);
    jest.resetModules();
  });

  it('[CRÍTICO] RECEIVED + externalReference correto → synced=true, activate+log chamados', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...loteRecv,
      loteId: loteRecv.loteId,
    });
    mockGetPayment.mockResolvedValueOnce(
      asaasPayload('RECEIVED', loteRecv.loteId, pagamentoId, asaasPaymentId)
    );

    const res = await POST(post({ lote_id: loteRecv.loteId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBe(true);
    expect(json.status_pagamento).toBe('pago');
    expect(json.asaas_payment_id).toBe(asaasPaymentId);
    expect(json.asaas_status).toBe('RECEIVED');
    expect(mockActivate).toHaveBeenCalledTimes(1);
    expect(mockLogWebhook).toHaveBeenCalledTimes(1);
  });

  it('CONFIRMED → synced=true, evento=PAYMENT_CONFIRMED', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...loteConf,
      loteId: loteConf.loteId,
    });
    mockGetPayment.mockResolvedValueOnce(
      asaasPayload('CONFIRMED', loteConf.loteId, pagamentoId, asaasPaymentId)
    );

    const res = await POST(post({ lote_id: loteConf.loteId }));
    expect((await res.json()).synced).toBe(true);

    const [, , event] = mockActivate.mock.calls[0];
    expect(event).toBe('PAYMENT_CONFIRMED');
  });

  it('logWebhookProcessed é chamado DEPOIS de activateSubscription', async () => {
    const order: string[] = [];
    mockActivate.mockImplementationOnce(async () => order.push('activate'));
    mockLogWebhook.mockImplementationOnce(async () => order.push('log'));

    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...loteOrdem,
      loteId: loteOrdem.loteId,
    });
    mockGetPayment.mockResolvedValueOnce(
      asaasPayload('RECEIVED', loteOrdem.loteId, pagamentoId, asaasPaymentId)
    );

    await POST(post({ lote_id: loteOrdem.loteId }));

    expect(order.indexOf('activate')).toBeLessThan(order.indexOf('log'));
  });

  it('GET ?lote_id=X → synced=true (GET delega ao handler do POST)', async () => {
    const { pagamentoId, asaasPaymentId } = await setupPagamento({
      ...loteGet,
      loteId: loteGet.loteId,
    });
    mockGetPayment.mockResolvedValueOnce(
      asaasPayload('RECEIVED', loteGet.loteId, pagamentoId, asaasPaymentId)
    );

    const res = await GET_handler(get({ lote_id: String(loteGet.loteId) }));
    expect(res.status).toBe(200);
    expect((await res.json()).synced).toBe(true);
  });
});

// ── Suite 5: Idempotência ─────────────────────────────────────────────────────

describe('/sincronizar-lote — Idempotência (lote já pago)', () => {
  let POST: (r: NextRequest) => Promise<Response>;
  let ctx: Awaited<ReturnType<typeof setupLote>>;

  beforeAll(async () => {
    ({ POST } = await mockRoute());
    mockAlreadyProcessed.mockResolvedValue(true);
    ctx = await setupLote('pago');
  });

  afterAll(async () => {
    await cleanup(ctx.loteId, ctx.empresaId, ctx.clinicaId);
    jest.resetModules();
  });

  it('lote pago → synced=false, Asaas não consultado (idempotente)', async () => {
    const res = await POST(post({ lote_id: ctx.loteId }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.synced).toBe(false);
    expect(json.status_pagamento).toBe('pago');
    expect(mockGetPayment).not.toHaveBeenCalled();
    expect(mockActivate).not.toHaveBeenCalled();
  });
});
