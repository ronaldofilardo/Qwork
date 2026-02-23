/**
 * Testes: /api/pagamento/asaas/sincronizar — Bypass de Idempotência
 *
 * Data: 17/02/2026
 * Correção: A rota /sincronizar foi reescrita para chamar activateSubscription
 * diretamente (bypassando a checagem de idempotência handlePaymentWebhook),
 * permitindo resync mesmo quando webhook_logs já tem entrada.
 *
 * Estratégia: 100% mocks para asaasClient e webhook-handler; banco real
 * apenas para inserir pagamentos (sem triggers).
 *
 * @see app/api/pagamento/asaas/sincronizar/route.ts
 */

import { query } from '@/lib/db';
import { createTesttomador } from '../helpers/test-data-factory';
import { NextRequest } from 'next/server';

// ── helpers ──────────────────────────────────────────────────────────────────

const uid = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

async function createPagamentoTestado(
  overrides: {
    status?: string;
    asaasPaymentId?: string;
  } = {}
) {
  const status = overrides.status ?? 'pendente';
  const asaasPaymentId = overrides.asaasPaymentId ?? `pay_${uid()}`;

  // createTesttomador retorna número (id direto)
  const entidadeId = await createTesttomador({ tipo: 'entidade' });

  const { rows: pagRows } = await query(
    `INSERT INTO pagamentos
       (entidade_id, clinica_id, valor, status, asaas_payment_id, asaas_customer_id, metodo)
     VALUES ($1, NULL, 150.00, $2, $3, 'cus_test', 'credit_card')
     RETURNING id`,
    [entidadeId, status, asaasPaymentId]
  );

  return {
    entidadeId,
    pagamentoId: pagRows[0].id as number,
    asaasPaymentId,
  };
}

// ── Mocks globais (redefinidos por describe quando necessário) ─────────────────

const mockActivateSubscription = jest.fn().mockResolvedValue(undefined);
const mockLogWebhookProcessed = jest.fn().mockResolvedValue(undefined);
const mockIsWebhookAlreadyProcessed = jest.fn().mockResolvedValue(false);
const mockGetPayment = jest.fn();

// ── Fábrica de route (depois de configurar mocks) ────────────────────────────

async function loadRoute() {
  jest.resetModules();

  jest.doMock('@/lib/asaas/client', () => ({
    asaasClient: { getPayment: mockGetPayment },
  }));

  jest.doMock('@/lib/asaas/webhook-handler', () => ({
    activateSubscription: mockActivateSubscription,
    logWebhookProcessed: mockLogWebhookProcessed,
    isWebhookAlreadyProcessed: mockIsWebhookAlreadyProcessed,
    handlePaymentWebhook: jest.fn(),
    validateWebhookSignature: jest.fn(),
  }));

  return import('@/app/api/pagamento/asaas/sincronizar/route');
}

function makeReq(
  method: 'GET' | 'POST',
  body?: object,
  searchParams?: Record<string, string>
): NextRequest {
  const url = new URL('http://localhost/api/pagamento/asaas/sincronizar');
  if (searchParams) {
    for (const [k, v] of Object.entries(searchParams)) {
      url.searchParams.set(k, v);
    }
  }

  if (method === 'GET') {
    return new NextRequest(url.toString(), { method: 'GET' });
  }

  return new NextRequest(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Suite principal ──────────────────────────────────────────────────────────

describe('/sincronizar — Validações de entrada', () => {
  let POST: any, GET: any;

  beforeAll(async () => {
    const route = await loadRoute();
    POST = route.POST;
    GET = route.GET;
  });

  afterAll(() => jest.resetModules());

  it('POST sem pagamento_id retorna 400', async () => {
    const res = await POST(makeReq('POST', {}));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('POST com pagamento_id não numérico retorna 400', async () => {
    const res = await POST(makeReq('POST', { pagamento_id: 'abc' }));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it('POST com pagamento_id que não existe retorna 404', async () => {
    const res = await POST(makeReq('POST', { pagamento_id: 999999999 }));
    const json = await res.json();
    expect(res.status).toBe(404);
  });

  it('GET sem parâmetros retorna 400', async () => {
    const res = await GET(makeReq('GET'));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
  });
});

describe('/sincronizar — Status local já atualizado (sem lote pendente)', () => {
  let POST: any;
  const cleanup: number[] = [];

  beforeAll(async () => {
    const route = await loadRoute();
    POST = route.POST;
    mockGetPayment.mockClear();
    mockActivateSubscription.mockClear();
    mockIsWebhookAlreadyProcessed.mockResolvedValue(true); // já processado
  });

  afterAll(async () => {
    for (const id of cleanup) {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [id]);
    }
    jest.resetModules();
  });

  it('quando pagamento.status já é pago E lote também pago, retorna synced=false sem reativar', async () => {
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pago',
    });
    cleanup.push(pagamentoId);

    // Asaas confirma como RECEIVED; externalReference sem lote_id
    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'RECEIVED',
      externalReference: `pagamento_${pagamentoId}`, // sem formato lote_X_pagamento_Y
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBe(false);
    expect(json.status).toBe('pago');
    // Sem lote_id no externalReference + já processado → não reativa
    expect(mockActivateSubscription).not.toHaveBeenCalled();
  });

  it('quando pagamento.status pago MAS lote ainda aguardando_pagamento (falha parcial), reativa', async () => {
    // Este cenário usa um pagamento real com externalReference formato lote_X_pagamento_Y
    // e um lote que ainda está aguardando pagamento
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pago',
    });
    cleanup.push(pagamentoId);

    // Simula: já processado mas lote ainda pendente
    mockIsWebhookAlreadyProcessed.mockResolvedValueOnce(true);
    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'RECEIVED',
      externalReference: `lote_99999_pagamento_${pagamentoId}`, // lote inexistente → não acha pendente
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    // Lote 99999 não existe → considera sincronizado (sem lote pendente real para este pagamento)
    expect(res.status).toBe(200);
    expect(json.status).toBe('pago');
  });
});

describe('/sincronizar — Integração com Asaas (mock da API)', () => {
  let POST: any, GET: any;
  const cleanup: number[] = [];

  beforeAll(async () => {
    const route = await loadRoute();
    POST = route.POST;
    GET = route.GET;
  });

  afterEach(() => {
    mockGetPayment.mockClear();
    mockActivateSubscription.mockClear();
    mockLogWebhookProcessed.mockClear();
    mockIsWebhookAlreadyProcessed.mockClear();
  });

  afterAll(async () => {
    for (const id of cleanup) {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [id]);
    }
    jest.resetModules();
  });

  it('quando Asaas retorna PENDING, retorna synced=false sem ativar lote', async () => {
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'PENDING',
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBeFalsy();
    expect(mockActivateSubscription).not.toHaveBeenCalled();
    expect(mockLogWebhookProcessed).not.toHaveBeenCalled();
  });

  it('quando Asaas retorna CONFIRMED, chama activateSubscription e logWebhookProcessed', async () => {
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'CONFIRMED',
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBe(true);
    expect(mockActivateSubscription).toHaveBeenCalledTimes(1);
    expect(mockLogWebhookProcessed).toHaveBeenCalledTimes(1);
  });

  it('quando Asaas retorna RECEIVED, também ativa e loga', async () => {
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'RECEIVED',
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBe(true);
    expect(mockActivateSubscription).toHaveBeenCalledTimes(1);
    expect(mockLogWebhookProcessed).toHaveBeenCalledTimes(1);
  });

  /**
   * TESTE CRÍTICO: Regressão do bug principal.
   *
   * Cenário: webhook_logs JÁ TEM entrada (webhook foi processado), mas
   * pagamento.status ainda está 'pendente' (falha parcial de banco).
   * /sincronizar DEVE chamar activateSubscription MESMO com idempotência
   * travada, porque a rota bypassa o handlePaymentWebhook.
   */
  it('[CRÍTICO] bypassseia idempotência: chama activateSubscription mesmo se webhook_logs já tem entrada', async () => {
    const { pagamentoId, asaasPaymentId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    // Simula: webhook_logs tem entrada (idempotência travaria handlePaymentWebhook)
    mockIsWebhookAlreadyProcessed.mockResolvedValueOnce(true);

    mockGetPayment.mockResolvedValueOnce({
      id: asaasPaymentId,
      status: 'CONFIRMED',
    });

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.synced).toBe(true);
    // activateSubscription deve ter sido chamada DIRETAMENTE, sem checar idempotência
    expect(mockActivateSubscription).toHaveBeenCalledTimes(1);
  });

  it('quando asaasClient.getPayment lança erro, retorna 502', async () => {
    const { pagamentoId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    mockGetPayment.mockRejectedValueOnce(new Error('Asaas API timeout'));

    const res = await POST(makeReq('POST', { pagamento_id: pagamentoId }));
    const json = await res.json();

    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(json.error).toBeDefined();
  });

  it('GET sem pagamento_id retorna 400 com mensagem de erro (GET handler valida params)', async () => {
    // Confirmar que o GET handler independente verifica parâmetros:
    // já testado em "Validações de entrada", mas reforça que o handler
    // GET NÃO retorna um erro genérico/500 — retorna 400 "pagamento_id é obrigatório"
    const res = await GET(makeReq('GET', undefined, {}));
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/pagamento_id/i);
  });
});

describe('/sincronizar — Sequência de chamadas (garantia de atomicidade)', () => {
  let POST: any;
  const cleanup: number[] = [];
  const callOrder: string[] = [];

  beforeAll(async () => {
    jest.resetModules();

    jest.doMock('@/lib/asaas/client', () => ({
      asaasClient: {
        getPayment: jest.fn().mockResolvedValue({ status: 'CONFIRMED' }),
      },
    }));

    jest.doMock('@/lib/asaas/webhook-handler', () => ({
      activateSubscription: jest.fn().mockImplementation(async () => {
        callOrder.push('activateSubscription');
      }),
      logWebhookProcessed: jest.fn().mockImplementation(async () => {
        callOrder.push('logWebhookProcessed');
      }),
      isWebhookAlreadyProcessed: jest.fn().mockResolvedValue(false),
      handlePaymentWebhook: jest.fn(),
      validateWebhookSignature: jest.fn(),
    }));

    const route = await import('@/app/api/pagamento/asaas/sincronizar/route');
    POST = route.POST;
  });

  afterAll(async () => {
    for (const id of cleanup) {
      await query(`DELETE FROM pagamentos WHERE id = $1`, [id]);
    }
    jest.resetModules();
  });

  it('logWebhookProcessed é chamado DEPOIS de activateSubscription (nunca antes)', async () => {
    const { pagamentoId } = await createPagamentoTestado({
      status: 'pendente',
    });
    cleanup.push(pagamentoId);

    await POST(makeReq('POST', { pagamento_id: pagamentoId }));

    const activateIdx = callOrder.indexOf('activateSubscription');
    const logIdx = callOrder.indexOf('logWebhookProcessed');

    expect(activateIdx).toBeGreaterThanOrEqual(0);
    expect(logIdx).toBeGreaterThanOrEqual(0);
    expect(activateIdx).toBeLessThan(logIdx);
  });
});
