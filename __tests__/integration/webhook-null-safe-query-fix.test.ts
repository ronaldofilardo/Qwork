import { query } from '@/lib/db';
import { handlePaymentWebhook } from '@/lib/asaas/webhook-handler';
import { AsaasWebhookPayload } from '@/lib/asaas/types';

describe('Webhook NULL-safe Query Fix', () => {
  let empresaId: number;
  let clinicaId: number;
  let loteClinicaId: number;
  let pagamentoId: number;

  beforeAll(async () => {
    // Configurar RLS para testes
    await query('SET SESSION "app.current_user_cpf" = \'00000000000\'');

    // Setup: Criar uma clínica primeiro
    const clinicaRes = await query(
      `INSERT INTO clinicas (nome, ativa) 
       VALUES ('Clínica Test Base', true)
       RETURNING id`
    );
    const clinicaBaseId = clinicaRes.rows[0].id;

    // Criar dados de teste
    const empresaRes = await query(
      `INSERT INTO empresas_clientes (clinica_id, nome, cnpj, ativa) 
       VALUES ($1, 'Empresa Teste NULL Fix', '12345678901234', true)
       RETURNING id`,
      [clinicaBaseId]
    );
    empresaId = empresaRes.rows[0].id;

    const clinicaRes2 = await query(
      `INSERT INTO clinicas (nome, ativa) 
       VALUES ('Clínica Teste NULL Fix', true)
       RETURNING id`
    );
    clinicaId = clinicaRes2.rows[0].id;

    // Criar lote com clínica (entidade_id NULL)
    const loteRes = await query(
      `INSERT INTO lotes_avaliacao 
       (empresa_id, clinica_id, entidade_id, status, status_pagamento, valor_por_funcionario)
       VALUES ($1, $2, NULL, 'pendente_liberacao', 'aguardando_pagamento', 150.00)
       RETURNING id`,
      [empresaId, clinicaId]
    );
    loteClinicaId = loteRes.rows[0].id;

    // Criar pagamento
    const pagRes = await query(
      `INSERT INTO pagamentos 
       (empresa_id, clinica_id, status, valor, asaas_payment_id)
       VALUES ($1, $2, 'aguardando_confirmacao', 150.00, 'pay_test_null_fix_12345')
       RETURNING id`,
      [empresaId, clinicaId]
    );
    pagamentoId = pagRes.rows[0].id;
  });

  afterAll(async () => {
    // Cleanup
    await query(
      'DELETE FROM lotes_avaliacao WHERE id = $1',
      [loteClinicaId]
    );
    await query(
      'DELETE FROM pagamentos WHERE id = $1',
      [pagamentoId]
    );
    await query(
      'DELETE FROM clinicas WHERE id = $1',
      [clinicaId]
    );
    await query(
      'DELETE FROM empresas_clientes WHERE id = $1',
      [empresaId]
    );
  });

  test(
    'deve atualizar lotes com clinica_id quando entidade_id é NULL (NULL-safe query)',
    async () => {
      const payload: AsaasWebhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_test_null_fix_12345',
          object: 'payment',
          dateCreated: new Date().toISOString(),
          status: 'CONFIRMED',
          value: 150.0,
          netValue: 150.0,
          billingType: 'PIX',
          pixQrCode: 'test-pix',
          pixQrCodeUrl: 'https://pix-test',
          confirmedDate: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
          description: 'Pagamento teste NULL fix',
          externalReference: `lote_${loteClinicaId}`,
        },
      };

      // Executar webhook
      await handlePaymentWebhook(payload);

      // Verificar se lote foi atualizado
      const checkResult = await query(
        `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
        [loteClinicaId]
      );

      expect(checkResult.rows).toHaveLength(1);
      expect(checkResult.rows[0].status_pagamento).toBe('pago');
    }
  );

  test(
    'deve continuar funcionando com entidade_id quando clinica_id é NULL',
    async () => {
      let entidadeId: number;
      let loteEntidadeId: number;
      let pagEntidadeId: number;

      // Criar entidade
      const entidadeRes = await query(
        `INSERT INTO entidades (nome, ativa) 
         VALUES ('Entidade Teste NULL Fix', true)
         RETURNING id`
      );
      entidadeId = entidadeRes.rows[0].id;

      // Criar lote com entidade (clinica_id NULL)
      const loteRes = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, entidade_id, clinica_id, status, status_pagamento, valor_por_funcionario)
         VALUES ($1, $2, NULL, 'pendente_liberacao', 'aguardando_pagamento', 200.00)
         RETURNING id`,
        [empresaId, entidadeId]
      );
      loteEntidadeId = loteRes.rows[0].id;

      // Criar pagamento
      const pagRes = await query(
        `INSERT INTO pagamentos 
         (empresa_id, entidade_id, status, valor, asaas_payment_id)
         VALUES ($1, $2, 'aguardando_confirmacao', 200.00, 'pay_test_null_fix_entidade_67890')
         RETURNING id`,
        [empresaId, entidadeId]
      );
      pagEntidadeId = pagRes.rows[0].id;

      // Webhook para pagamento de entidade
      const payload: AsaasWebhookPayload = {
        event: 'PAYMENT_CONFIRMED',
        payment: {
          id: 'pay_test_null_fix_entidade_67890',
          object: 'payment',
          dateCreated: new Date().toISOString(),
          status: 'CONFIRMED',
          value: 200.0,
          netValue: 200.0,
          billingType: 'BOLETO',
          confirmedDate: new Date().toISOString(),
          paymentDate: new Date().toISOString(),
          description: 'Pagamento entidade teste NULL fix',
          externalReference: `lote_${loteEntidadeId}`,
        },
      };

      // Executar webhook
      await handlePaymentWebhook(payload);

      // Verificar se lote foi atualizado
      const checkResult = await query(
        `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
        [loteEntidadeId]
      );

      expect(checkResult.rows).toHaveLength(1);
      expect(checkResult.rows[0].status_pagamento).toBe('pago');

      // Cleanup
      await query(
        'DELETE FROM lotes_avaliacao WHERE id = $1',
        [loteEntidadeId]
      );
      await query(
        'DELETE FROM pagamentos WHERE id = $1',
        [pagEntidadeId]
      );
      await query(
        'DELETE FROM entidades WHERE id = $1',
        [entidadeId]
      );
    }
  );

  test(
    'deve buscar corretamente lotes com status aguardando_pagamento',
    async () => {
      // Recreate lote with aguardando_pagamento state for this test
      const newLoteRes = await query(
        `INSERT INTO lotes_avaliacao 
         (empresa_id, clinica_id, entidade_id, status, status_pagamento, valor_por_funcionario)
         VALUES ($1, $2, NULL, 'pendente_liberacao', 'aguardando_pagamento', 150.00)
         RETURNING id`,
        [empresaId, clinicaId]
      );
      const testLoteId = newLoteRes.rows[0].id;

      try {
        // Verificar que lote foi criado com status correto
        const checkResult = await query(
          `SELECT status_pagamento, clinica_id, entidade_id FROM lotes_avaliacao WHERE id = $1`,
          [testLoteId]
        );

        expect(checkResult.rows).toHaveLength(1);
        const lote = checkResult.rows[0];
        expect(lote.status_pagamento).toBe('aguardando_pagamento');
        expect(lote.clinica_id).toBe(clinicaId);
        expect(lote.entidade_id).toBeNull();
      } finally {
        // Cleanup
        await query(
          'DELETE FROM lotes_avaliacao WHERE id = $1',
          [testLoteId]
        );
      }
    }
  );
});
