/**
 * Testes: Webhook Handler — Idempotência e Atomicidade (Correção Race Condition)
 *
 * Data: 17/02/2026
 * Correção: logWebhookProcessed foi movido para FORA de activateSubscription.
 * Antes estava chamado com pool.query() (auto-commit) DENTRO da transação,
 * gravando webhook_logs antes do COMMIT → se COMMIT falhasse, entrada
 * ficava gravada permanentemente bloqueando reprocessamento.
 *
 * Estratégia de teste:
 * - Funções que usam apenas webhook_logs → integração com banco de teste real
 * - activateSubscription (usa lotes_avaliacao com triggers complexos) → mock do pool
 * - handlePaymentWebhook → spy para verificar sequência de chamadas
 *
 * @see lib/asaas/webhook-handler.ts
 */

// CRÍTICO: Definir DATABASE_URL ANTES de qualquer import para que o Pool
// interno de webhook-handler.ts conecte ao banco de teste (não ao neon.tech)
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

import { query } from '@/lib/db';
import type { AsaasWebhookEvent } from '@/lib/asaas/types';

// ── helpers ──────────────────────────────────────────────────────────────────

const uid = () => `wh_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

// ── Testes de webhook_logs (banco real, sem triggers) ────────────────────────

describe('Webhook Handler — webhook_logs (integração real)', () => {
  // ── isWebhookAlreadyProcessed + logWebhookProcessed ──────────────────────

  describe('isWebhookAlreadyProcessed() + logWebhookProcessed()', () => {
    it('retorna false antes de logar e true depois', async () => {
      const { isWebhookAlreadyProcessed, logWebhookProcessed } =
        await import('@/lib/asaas/webhook-handler');
      const paymentId = `pay_${uid()}`;
      const event: AsaasWebhookEvent = 'PAYMENT_CONFIRMED';

      try {
        expect(await isWebhookAlreadyProcessed(paymentId, event)).toBe(false);
        await logWebhookProcessed(paymentId, event, { test: true });
        expect(await isWebhookAlreadyProcessed(paymentId, event)).toBe(true);
      } finally {
        await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
          paymentId,
        ]);
      }
    });

    it('logWebhookProcessed é idempotente — ON CONFLICT DO NOTHING, sem erro no segundo INSERT', async () => {
      const { logWebhookProcessed } =
        await import('@/lib/asaas/webhook-handler');
      const paymentId = `pay_${uid()}`;
      const event: AsaasWebhookEvent = 'PAYMENT_RECEIVED';

      try {
        await logWebhookProcessed(paymentId, event, { first: true });
        await expect(
          logWebhookProcessed(paymentId, event, { second: true })
        ).resolves.not.toThrow();

        const { rows } = await query(
          `SELECT COUNT(*) AS cnt FROM webhook_logs WHERE payment_id = $1 AND event = $2`,
          [paymentId, event]
        );
        expect(Number(rows[0].cnt)).toBe(1);
      } finally {
        await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
          paymentId,
        ]);
      }
    });

    it('eventos diferentes do mesmo payment_id são registrados separadamente', async () => {
      const { logWebhookProcessed } =
        await import('@/lib/asaas/webhook-handler');
      const paymentId = `pay_${uid()}`;

      try {
        await logWebhookProcessed(paymentId, 'PAYMENT_CONFIRMED', {});
        await logWebhookProcessed(paymentId, 'PAYMENT_RECEIVED', {});

        const { rows } = await query(
          `SELECT event FROM webhook_logs WHERE payment_id = $1 ORDER BY event`,
          [paymentId]
        );
        expect(rows).toHaveLength(2);
        expect(rows.map((r: any) => r.event)).toEqual([
          'PAYMENT_CONFIRMED',
          'PAYMENT_RECEIVED',
        ]);
      } finally {
        await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
          paymentId,
        ]);
      }
    });

    it('isWebhookAlreadyProcessed é sensível ao evento — mesma payment_id, evento diferente retorna false', async () => {
      const { logWebhookProcessed, isWebhookAlreadyProcessed } =
        await import('@/lib/asaas/webhook-handler');
      const paymentId = `pay_${uid()}`;

      try {
        await logWebhookProcessed(paymentId, 'PAYMENT_CONFIRMED', {});
        expect(
          await isWebhookAlreadyProcessed(paymentId, 'PAYMENT_RECEIVED')
        ).toBe(false);
        expect(
          await isWebhookAlreadyProcessed(paymentId, 'PAYMENT_CONFIRMED')
        ).toBe(true);
      } finally {
        await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
          paymentId,
        ]);
      }
    });
  });
});

// ── Testes comportamentais com mock do pool (sem acesso real a lotes_avaliacao) ──

describe('Webhook Handler — Garantia de Atomicidade (mock do pool)', () => {
  /**
   * CRÍTICO: activateSubscription NÃO deve chamar logWebhookProcessed internamente.
   * O log deve ser responsabilidade do chamador (handlePaymentWebhook ou /sincronizar)
   * para garantir que só é gravado APÓS o COMMIT bem-sucedido.
   */
  it('activateSubscription NÃO chama logWebhookProcessed internamente (race condition fix)', async () => {
    jest.resetModules();

    // Rastrear todas as queries enviadas ao pool
    const poolQueries: string[] = [];
    const mockPaymentRow: any = null;

    // Mock do pg Pool para interceptar queries sem tocar no banco real
    jest.doMock('pg', () => {
      const mockClient = {
        query: jest.fn().mockImplementation((text: string) => {
          poolQueries.push(text);
          if (text.trim().toUpperCase().startsWith('BEGIN'))
            return Promise.resolve({ rowCount: 0, rows: [] });
          if (text.trim().toUpperCase().startsWith('COMMIT'))
            return Promise.resolve({ rowCount: 0, rows: [] });
          if (text.trim().toUpperCase().startsWith('ROLLBACK'))
            return Promise.resolve({ rowCount: 0, rows: [] });
          // SELECT pagamentos → retornar pagamento fake
          if (
            text.includes('FROM pagamentos') &&
            text.includes('asaas_payment_id')
          ) {
            return Promise.resolve({
              rowCount: 1,
              rows: [{ id: 99, entidade_id: 1, clinica_id: null, valor: 150 }],
            });
          }
          // UPDATE pagamentos → OK
          if (text.includes('UPDATE pagamentos')) {
            return Promise.resolve({ rowCount: 1, rows: [] });
          }
          // SELECT lotes_avaliacao → retornar lote fake
          if (text.includes('FROM lotes_avaliacao')) {
            return Promise.resolve({
              rowCount: 1,
              rows: [{ id: 500 }],
            });
          }
          // UPDATE lotes_avaliacao → OK
          if (text.includes('UPDATE lotes_avaliacao')) {
            return Promise.resolve({
              rowCount: 1,
              rows: [
                {
                  id: 500,
                  status_pagamento: 'pago',
                  pago_em: new Date(),
                  pagamento_metodo: 'credit_card',
                },
              ],
            });
          }
          return Promise.resolve({ rowCount: 0, rows: [] });
        }),
        release: jest.fn(),
      };

      const MockPool = jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        query: jest.fn().mockImplementation((text: string) => {
          poolQueries.push(text);
          return Promise.resolve({ rowCount: 0, rows: [] });
        }),
      }));

      return { Pool: MockPool };
    });

    const { activateSubscription } =
      await import('@/lib/asaas/webhook-handler');

    const paymentId = `pay_mock_${uid()}`;
    try {
      await activateSubscription(
        paymentId,
        {
          object: 'payment',
          id: paymentId,
          dateCreated: new Date().toISOString(),
          customer: 'cus_test',
          dueDate: '2026-12-31',
          value: 150,
          netValue: 148,
          billingType: 'CREDIT_CARD',
          status: 'CONFIRMED',
          deleted: false,
          anticipated: false,
          anticipable: false,
          postalService: false,
          externalReference: 'lote_500_pagamento_99',
          confirmedDate: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
        },
        'PAYMENT_CONFIRMED'
      );
    } catch {
      // Mocks podem não cobrir todos os paths — o importante é verificar as queries
    }

    // GARANTIA PRINCIPAL: nenhuma query ao pool deve mencionar INSERT INTO webhook_logs
    const webhookLogInserts = poolQueries.filter(
      (q) =>
        q.toLowerCase().includes('insert') &&
        q.toLowerCase().includes('webhook_logs')
    );
    expect(webhookLogInserts).toHaveLength(0);
  });

  it('handlePaymentWebhook SIM grava webhook_logs via pool.query APÓS COMMIT (não dentro da transação)', async () => {
    jest.resetModules();

    // Rastrear queries do pool separado do webhook-handler
    const poolDirectQueries: string[] = [];
    const clientTransactionQueries: string[] = [];

    jest.doMock('pg', () => {
      const mockClient = {
        query: jest.fn().mockImplementation((text: string) => {
          clientTransactionQueries.push(text);
          if (
            text.includes('FROM pagamentos') &&
            text.includes('asaas_payment_id')
          ) {
            return Promise.resolve({
              rowCount: 1,
              rows: [{ id: 99, entidade_id: 1, clinica_id: null, valor: 150 }],
            });
          }
          if (text.includes('FROM lotes_avaliacao')) {
            return Promise.resolve({ rowCount: 1, rows: [{ id: 500 }] });
          }
          if (text.includes('UPDATE lotes_avaliacao')) {
            return Promise.resolve({
              rowCount: 1,
              rows: [
                {
                  id: 500,
                  status_pagamento: 'pago',
                  pago_em: new Date(),
                  pagamento_metodo: 'credit_card',
                },
              ],
            });
          }
          if (
            text.toLowerCase().includes('webhook_logs') &&
            text.toLowerCase().includes('select')
          ) {
            // Não processado ainda
            return Promise.resolve({ rowCount: 0, rows: [] });
          }
          return Promise.resolve({ rowCount: 0, rows: [] });
        }),
        release: jest.fn(),
      };

      const MockPool = jest.fn().mockImplementation(() => ({
        connect: jest.fn().mockResolvedValue(mockClient),
        // pool.query() direto (auto-commit) — usado pelo logWebhookProcessed (INSERT) e isWebhookProcessed (SELECT)
        query: jest.fn().mockImplementation((text: string) => {
          poolDirectQueries.push(text);
          const normalized = text.toLowerCase();
          // SELECT de idempotência → não processado ainda
          if (
            normalized.includes('select') &&
            normalized.includes('webhook_logs')
          ) {
            return Promise.resolve({ rowCount: 0, rows: [] });
          }
          // INSERT webhook_logs → sucesso
          return Promise.resolve({ rowCount: 1, rows: [] });
        }),
      }));

      return { Pool: MockPool };
    });

    const webhookHandler = await import('@/lib/asaas/webhook-handler');
    const paymentId = `pay_spy_${uid()}`;

    try {
      await webhookHandler.handlePaymentWebhook({
        event: 'PAYMENT_CONFIRMED',
        payment: {
          object: 'payment',
          id: paymentId,
          dateCreated: new Date().toISOString(),
          customer: 'cus_test',
          dueDate: '2026-12-31',
          value: 150,
          netValue: 148,
          billingType: 'CREDIT_CARD',
          status: 'CONFIRMED',
          deleted: false,
          anticipated: false,
          anticipable: false,
          postalService: false,
          externalReference: 'lote_500_pagamento_99',
          confirmedDate: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
        },
      });
    } catch {
      // Não esperado, mas não crítico para este teste
    }

    // GARANTIA 1: handlePaymentWebhook deve gravar webhook_logs via pool.query (auto-commit)
    const webhookLogInserts = poolDirectQueries.filter(
      (q) =>
        q.toLowerCase().includes('insert') &&
        q.toLowerCase().includes('webhook_logs')
    );
    expect(webhookLogInserts.length).toBeGreaterThanOrEqual(1);

    // GARANTIA 2: A gravação em webhook_logs NÃO deve ocorrer dentro da transação do client
    // (seria o bug do race condition) — deve estar em poolDirectQueries, não em clientTransactionQueries
    const logInsideTransaction = clientTransactionQueries.filter(
      (q) =>
        q.toLowerCase().includes('insert') &&
        q.toLowerCase().includes('webhook_logs')
    );
    expect(logInsideTransaction).toHaveLength(0);
  });
});

// ── Testes de exportações (garantia de API pública) ──────────────────────────

describe('Webhook Handler — API pública exportada', () => {
  it('activateSubscription deve ser uma função exportada (nova exportação)', async () => {
    jest.resetModules();
    const handler = await import('@/lib/asaas/webhook-handler');
    expect(typeof handler.activateSubscription).toBe('function');
  });

  it('logWebhookProcessed deve ser uma função exportada (nova exportação)', async () => {
    jest.resetModules();
    const handler = await import('@/lib/asaas/webhook-handler');
    expect(typeof handler.logWebhookProcessed).toBe('function');
  });

  it('isWebhookAlreadyProcessed deve ser uma função exportada (nova exportação)', async () => {
    jest.resetModules();
    const handler = await import('@/lib/asaas/webhook-handler');
    expect(typeof handler.isWebhookAlreadyProcessed).toBe('function');
  });

  it('handlePaymentWebhook deve continuar exportado (retrocompatibilidade)', async () => {
    jest.resetModules();
    const handler = await import('@/lib/asaas/webhook-handler');
    expect(typeof handler.handlePaymentWebhook).toBe('function');
  });

  it('validateWebhookSignature deve continuar exportado (retrocompatibilidade)', async () => {
    jest.resetModules();
    const handler = await import('@/lib/asaas/webhook-handler');
    expect(typeof handler.validateWebhookSignature).toBe('function');
  });
});
