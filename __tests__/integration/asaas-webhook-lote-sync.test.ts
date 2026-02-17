/**
 * Teste de Sincronização de Estados Asaas → Sistema
 *
 * Valida que quando o Asaas envia um webhook PAYMENT_CONFIRMED ou PAYMENT_RECEIVED,
 * o sistema atualiza corretamente o status do lote para 'pago'
 *
 * @see lib/asaas/webhook-handler.ts
 * @see app/api/pagamento/asaas/criar/route.ts
 */

import { query } from '@/lib/db';
import { handlePaymentWebhook } from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookPayload } from '@/lib/asaas/types';

describe('Asaas Webhook - Sincronização de Lote', () => {
  let loteId: number;
  let pagamentoId: number;
  let asaasPaymentId: string;

  beforeAll(async () => {
    // Criar uma entidade de teste
    const entidadeResult = await query(
      `INSERT INTO entidades (nome, cnpj, email)
       VALUES ('Test Company', '12345678000199', 'test@company.com')
       RETURNING id`
    );
    const entidadeId = entidadeResult.rows[0].id;

    // Criar um lote de teste
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (
        entidade_id, status, status_pagamento, 
        valor_por_funcionario, liberado_por
      ) VALUES ($1, 'concluido', 'aguardando_pagamento', 22.55, '00000000000')
      RETURNING id`,
      [entidadeId]
    );
    loteId = loteResult.rows[0].id;

    // Criar um pagamento vinculado
    asaasPaymentId = `pay_test_${Date.now()}`;
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (
        entidade_id, valor, status, metodo, 
        asaas_payment_id, plataforma_nome
      ) VALUES ($1, 22.55, 'pendente', 'pix', $2, 'Asaas')
      RETURNING id`,
      [entidadeId, asaasPaymentId]
    );
    pagamentoId = pagamentoResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query(`DELETE FROM pagamentos WHERE id = $1`, [pagamentoId]);
    await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [loteId]);
    await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
      asaasPaymentId,
    ]);
  });

  test('Webhook PAYMENT_CONFIRMED deve atualizar lote para pago (via externalReference)', async () => {
    // Criar payload do webhook com externalReference incluindo lote_id
    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        object: 'payment',
        id: asaasPaymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_123',
        dueDate: new Date().toISOString().split('T')[0],
        value: 22.55,
        netValue: 22.55,
        billingType: 'PIX',
        status: 'CONFIRMED',
        description: 'Teste',
        externalReference: `lote_${loteId}_pagamento_${pagamentoId}`, // ✅ Novo formato
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    // Processar webhook
    await handlePaymentWebhook(payload);

    // Verificar se o pagamento foi atualizado
    const pagamentoCheck = await query(
      `SELECT status FROM pagamentos WHERE id = $1`,
      [pagamentoId]
    );
    expect(pagamentoCheck.rows[0].status).toBe('pago');

    // Verificar se o lote foi atualizado corretamente
    const loteCheck = await query(
      `SELECT status_pagamento, pagamento_metodo, pago_em 
       FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );

    expect(loteCheck.rows[0].status_pagamento).toBe('pago');
    expect(loteCheck.rows[0].pagamento_metodo).toBe('pix');
    expect(loteCheck.rows[0].pago_em).not.toBeNull();
  });

  test('Webhook PAYMENT_RECEIVED deve atualizar lote para pago', async () => {
    // Resetar status do lote
    await query(
      `UPDATE lotes_avaliacao 
       SET status_pagamento = 'aguardando_pagamento', 
           pago_em = NULL 
       WHERE id = $1`,
      [loteId]
    );

    await query(`UPDATE pagamentos SET status = 'pendente' WHERE id = $1`, [
      pagamentoId,
    ]);

    // Limpar log de webhook anterior
    await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
      asaasPaymentId,
    ]);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        object: 'payment',
        id: asaasPaymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_123',
        dueDate: new Date().toISOString().split('T')[0],
        value: 22.55,
        netValue: 22.55,
        billingType: 'CREDIT_CARD',
        status: 'RECEIVED',
        description: 'Teste',
        externalReference: `lote_${loteId}_pagamento_${pagamentoId}`,
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    await handlePaymentWebhook(payload);

    // Verificar resultado
    const loteCheck = await query(
      `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );

    expect(loteCheck.rows[0].status_pagamento).toBe('pago');
  });

  test('Webhook sem lote_id no externalReference deve usar fallback (entidade_id)', async () => {
    // Criar novo lote e pagamento sem vínculo direto
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (
        entidade_id, status, status_pagamento, 
        valor_por_funcionario, liberado_por
      ) VALUES (
        (SELECT entidade_id FROM pagamentos WHERE id = $1),
        'concluido', 'aguardando_pagamento', 15.00, '00000000000'
      ) RETURNING id`,
      [pagamentoId]
    );
    const novoLoteId = loteResult.rows[0].id;

    const asaasPaymentId2 = `pay_test_fallback_${Date.now()}`;
    const entidadeId = (
      await query(`SELECT entidade_id FROM pagamentos WHERE id = $1`, [
        pagamentoId,
      ])
    ).rows[0].entidade_id;

    await query(
      `INSERT INTO pagamentos (
        entidade_id, valor, status, metodo, 
        asaas_payment_id, plataforma_nome
      ) VALUES ($1, 15.00, 'pendente', 'boleto', $2, 'Asaas')`,
      [entidadeId, asaasPaymentId2]
    );

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        object: 'payment',
        id: asaasPaymentId2,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_123',
        dueDate: new Date().toISOString().split('T')[0],
        value: 15.0,
        netValue: 15.0,
        billingType: 'BOLETO',
        status: 'CONFIRMED',
        description: 'Teste Fallback',
        externalReference: `pagamento_old_format`, // ❌ Formato antigo sem lote_id
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    await handlePaymentWebhook(payload);

    // O fallback deve encontrar o lote pela entidade_id
    const loteCheck = await query(
      `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
      [novoLoteId]
    );

    expect(loteCheck.rows[0].status_pagamento).toBe('pago');

    // Cleanup
    await query(`DELETE FROM pagamentos WHERE asaas_payment_id = $1`, [
      asaasPaymentId2,
    ]);
    await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [novoLoteId]);
    await query(`DELETE FROM webhook_logs WHERE payment_id = $1`, [
      asaasPaymentId2,
    ]);
  });
});
