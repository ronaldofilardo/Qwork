/**
 * Teste: Validação da Remoção de Código Obsoleto do Webhook Handler
 *
 * Data: 16/02/2026
 * Issue: Sistema tentava atualizar tabelas obsoletas (tomadores/contratos)
 *        causando erro de enum constraint e ROLLBACK da transação
 *
 * Solução: Removido código obsoleto, mantendo apenas atualização de lotes_avaliacao
 *
 * @see lib/asaas/webhook-handler.ts
 * @see ANALISE-MAQUINA-ESTADOS-EMISSAO-LAUDO.md
 */

import { query } from '@/lib/db';
import { handlePaymentWebhook } from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookPayload } from '@/lib/asaas/types';

describe('Correção Webhook - Remoção de Código Obsoleto', () => {
  let testEntidadeId: number;
  let testLoteId: number;
  let testPagamentoId: number;
  let testAsaasPaymentId: string;

  beforeAll(async () => {
    // 1. Criar entidade de teste
    const entidadeResult = await query(
      `INSERT INTO entidades (nome, cnpj, email, ativa)
       VALUES ('Empresa Test Webhook', '11111111000191', 'webhook@test.com', true)
       RETURNING id`
    );
    testEntidadeId = entidadeResult.rows[0].id;

    // 2. Criar lote aguardando pagamento
    const loteResult = await query(
      `INSERT INTO lotes_avaliacao (
        entidade_id,
        status,
        status_pagamento,
        valor_por_funcionario,
        liberado_por,
        numero_ordem
      ) VALUES ($1, 'concluido', 'aguardando_pagamento', 45.00, '12345678901', 1)
      RETURNING id`,
      [testEntidadeId]
    );
    testLoteId = loteResult.rows[0].id;

    // 3. Criar pagamento Asaas
    testAsaasPaymentId = `pay_test_obsolete_${Date.now()}`;
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (
        entidade_id,
        valor,
        status,
        metodo,
        asaas_payment_id,
        plataforma_nome
      ) VALUES ($1, 45.00, 'pendente', 'credit_card', $2, 'Asaas')
      RETURNING id`,
      [testEntidadeId, testAsaasPaymentId]
    );
    testPagamentoId = pagamentoResult.rows[0].id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await query(`DELETE FROM webhook_logs WHERE asaas_payment_id = $1`, [
      testAsaasPaymentId,
    ]);
    await query(`DELETE FROM pagamentos WHERE id = $1`, [testPagamentoId]);
    await query(`DELETE FROM lotes_avaliacao WHERE id = $1`, [testLoteId]);
    await query(`DELETE FROM entidades WHERE id = $1`, [testEntidadeId]);
  });

  test('✅ Webhook NÃO deve tentar atualizar tabela tomadores (obsoleta)', async () => {
    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        object: 'payment',
        id: testAsaasPaymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_456',
        dueDate: new Date().toISOString().split('T')[0],
        value: 45.0,
        netValue: 45.0,
        billingType: 'CREDIT_CARD',
        status: 'CONFIRMED',
        description: 'Emissão de Laudo - Teste',
        externalReference: `lote_${testLoteId}_pagamento_${testPagamentoId}`,
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    // Processar webhook - NÃO deve dar erro de enum
    await expect(handlePaymentWebhook(payload)).resolves.not.toThrow();

    // Verificar que o lote foi atualizado
    const loteResult = await query(
      `SELECT status_pagamento, pago_em, pagamento_metodo 
       FROM lotes_avaliacao 
       WHERE id = $1`,
      [testLoteId]
    );

    expect(loteResult.rows[0].status_pagamento).toBe('pago');
    expect(loteResult.rows[0].pago_em).not.toBeNull();
    expect(loteResult.rows[0].pagamento_metodo).toBe('credit_card');
  });

  test('✅ Webhook NÃO deve tentar atualizar tabela contratos (obsoleta)', async () => {
    // Se existisse código tentando atualizar contratos com status='aprovado',
    // causaria erro: "valor inválido para status_aprovacao_enum"

    // Resetar lote para testar novamente
    await query(
      `UPDATE lotes_avaliacao 
       SET status_pagamento = 'aguardando_pagamento', 
           pago_em = NULL 
       WHERE id = $1`,
      [testLoteId]
    );

    await query(`UPDATE pagamentos SET status = 'pendente' WHERE id = $1`, [
      testPagamentoId,
    ]);

    await query(`DELETE FROM webhook_logs WHERE asaas_payment_id = $1`, [
      testAsaasPaymentId,
    ]);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_RECEIVED',
      payment: {
        object: 'payment',
        id: testAsaasPaymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_456',
        dueDate: new Date().toISOString().split('T')[0],
        value: 45.0,
        netValue: 45.0,
        billingType: 'PIX',
        status: 'RECEIVED',
        description: 'Emissão de Laudo - Teste PIX',
        externalReference: `lote_${testLoteId}_pagamento_${testPagamentoId}`,
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    // Processar webhook - deve completar sem erro de enum
    await expect(handlePaymentWebhook(payload)).resolves.not.toThrow();

    // Verificar transação foi commitada (não houve ROLLBACK)
    const pagamentoResult = await query(
      `SELECT status FROM pagamentos WHERE id = $1`,
      [testPagamentoId]
    );
    expect(pagamentoResult.rows[0].status).toBe('pago');
  });

  test('✅ Webhook deve processar usando apenas enum status_pagamento válido', async () => {
    // Verificar que o sistema usa apenas os enums corretos:
    // status_pagamento ENUM = 'aguardando_cobranca' | 'aguardando_pagamento' | 'pago'

    const validStatusPagamento = [
      'aguardando_cobranca',
      'aguardando_pagamento',
      'pago',
    ];

    // Consultar o tipo enum do banco
    const enumResult = await query(`
      SELECT unnest(enum_range(NULL::status_pagamento))::text as valor
    `);

    const enumValues = enumResult.rows.map((r) => r.valor);

    expect(enumValues).toEqual(expect.arrayContaining(validStatusPagamento));
    expect(enumValues.length).toBe(3);

    // Confirmar que 'aprovado', 'pendente', 'rejeitado', 'em_reanalise'
    // NÃO estão no enum (esses são do sistema antigo)
    expect(enumValues).not.toContain('aprovado');
    expect(enumValues).not.toContain('pendente');
    expect(enumValues).not.toContain('rejeitado');
    expect(enumValues).not.toContain('em_reanalise');
  });

  test('✅ Transação completa sem ROLLBACK quando pagamento confirmado', async () => {
    // Resetar estado
    await query(
      `UPDATE lotes_avaliacao 
       SET status_pagamento = 'aguardando_pagamento', 
           pago_em = NULL,
           pagamento_metodo = NULL 
       WHERE id = $1`,
      [testLoteId]
    );

    await query(
      `UPDATE pagamentos 
       SET status = 'pendente',
           data_pagamento = NULL 
       WHERE id = $1`,
      [testPagamentoId]
    );

    await query(`DELETE FROM webhook_logs WHERE asaas_payment_id = $1`, [
      testAsaasPaymentId,
    ]);

    const payload: AsaasWebhookPayload = {
      event: 'PAYMENT_CONFIRMED',
      payment: {
        object: 'payment',
        id: testAsaasPaymentId,
        dateCreated: new Date().toISOString(),
        customer: 'cus_test_456',
        dueDate: new Date().toISOString().split('T')[0],
        value: 45.0,
        netValue: 42.5,
        billingType: 'CREDIT_CARD',
        status: 'CONFIRMED',
        description: 'Teste Transação Completa',
        externalReference: `lote_${testLoteId}_pagamento_${testPagamentoId}`,
        confirmedDate: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
      },
    };

    // Processar
    await handlePaymentWebhook(payload);

    // Verificar TODAS as atualizações foram persistidas (prova que não houve ROLLBACK)
    const loteResult = await query(
      `SELECT status_pagamento, pago_em, pagamento_metodo, pagamento_parcelas 
       FROM lotes_avaliacao 
       WHERE id = $1`,
      [testLoteId]
    );

    const pagamentoResult = await query(
      `SELECT status, data_pagamento 
       FROM pagamentos 
       WHERE id = $1`,
      [testPagamentoId]
    );

    const webhookResult = await query(
      `SELECT COUNT(*) as total 
       FROM webhook_logs 
       WHERE asaas_payment_id = $1`,
      [testAsaasPaymentId]
    );

    // Todas as tabelas devem ter sido atualizadas
    expect(loteResult.rows[0].status_pagamento).toBe('pago');
    expect(loteResult.rows[0].pago_em).not.toBeNull();
    expect(loteResult.rows[0].pagamento_metodo).toBe('credit_card');
    expect(loteResult.rows[0].pagamento_parcelas).toBe(1);

    expect(pagamentoResult.rows[0].status).toBe('pago');
    expect(pagamentoResult.rows[0].data_pagamento).not.toBeNull();

    expect(parseInt(webhookResult.rows[0].total)).toBeGreaterThan(0);
  });

  test('✅ ExternalReference extrai corretamente o lote_id', async () => {
    const externalRef = `lote_${testLoteId}_pagamento_${testPagamentoId}`;

    // O formato deve ser: lote_{ID}_pagamento_{ID}
    const match = externalRef.match(/lote_(\d+)_pagamento_(\d+)/);

    expect(match).not.toBeNull();
    expect(match[1]).toBe(testLoteId.toString());
    expect(match[2]).toBe(testPagamentoId.toString());
  });
});
