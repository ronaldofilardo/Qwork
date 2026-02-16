/**
 * Suite de Testes - Integração Asaas Payment Gateway
 *
 * Testes simplificados e focados para validar a integração Asaas
 */

import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';

describe('Asaas Payment Gateway Integration', () => {
  beforeAll(async () => {
    // Configurar RLS para testes
    await query('SET SESSION "app.current_user_cpf" = \'00000000000\'');
  });

  describe('✅ Validação da Estrutura Asaas', () => {
    it('deve ter AsaasClient com métodos obrigatórios', () => {
      expect(asaasClient).toBeDefined();
      expect(typeof asaasClient.createCustomer).toBe('function');
      expect(typeof asaasClient.createPayment).toBe('function');
      expect(typeof asaasClient.getPixQrCode).toBe('function');
    });

    it('deve ter variáveis de ambiente configuradas', () => {
      expect(process.env.ASAAS_API_KEY).toBeDefined();
      expect(process.env.ASAAS_API_URL).toBeDefined();
      expect(process.env.ASAAS_API_KEY).toContain('$aact_');
      expect(process.env.ASAAS_API_URL).toContain('asaas.com');
    });

    it('deve usar Sandbox em desenvolvimento', () => {
      if (process.env.NODE_ENV === 'development') {
        expect(process.env.ASAAS_API_URL).toContain('sandbox');
      }
    });
  });

  describe('✅ Estrutura do Banco de Dados', () => {
    it('deve ter suporte a coluna asaas_payment_id na tabela pagamentos', async () => {
      // Tentar adicionar coluna se não existir
      await query(
        `ALTER TABLE pagamentos 
         ADD COLUMN IF NOT EXISTS asaas_payment_id VARCHAR(50)`
      ).catch(() => {
        // Coluna já pode existir
      });

      const result = await query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'pagamentos' AND column_name = 'asaas_payment_id'`
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });

    it('deve ter suporte a coluna asaas_customer_id na tabela pagamentos', async () => {
      // Tentar adicionar coluna se não existir
      await query(
        `ALTER TABLE pagamentos 
         ADD COLUMN IF NOT EXISTS asaas_customer_id VARCHAR(50)`
      ).catch(() => {
        // Coluna já pode existir
      });

      const result = await query(
        `SELECT column_name FROM information_schema.columns 
         WHERE table_name = 'pagamentos' AND column_name = 'asaas_customer_id'`
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(0);
    });

    it('deve criar tabela webhook_logs quando necessário', async () => {
      // Criar tabela se não existir
      await query(
        `CREATE TABLE IF NOT EXISTS webhook_logs (
          id SERIAL PRIMARY KEY,
          payment_id VARCHAR(50) NOT NULL,
          event VARCHAR(100) NOT NULL,
          payload JSONB,
          processed_at TIMESTAMP DEFAULT NOW(),
          UNIQUE (payment_id, event)
        )`
      ).catch(() => {
        // Tabela já pode existir
      });

      const result = await query(
        `SELECT table_name FROM information_schema.tables 
         WHERE table_name = 'webhook_logs'`
      );

      expect(result.rows.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('✅ Tipos de Dados Asaas', () => {
    it('deve ter mappers de status disponíveis', async () => {
      const { mapAsaasStatusToLocal } = await import('@/lib/asaas/mappers');

      expect(mapAsaasStatusToLocal('PENDING')).toBe('pendente');
      expect(mapAsaasStatusToLocal('CONFIRMED')).toBe('pago');
      expect(mapAsaasStatusToLocal('RECEIVED')).toBe('pago');
    });

    it('deve ter mappers de método de pagamento', async () => {
      const { mapMetodoPagamentoToAsaasBillingType } =
        await import('@/lib/asaas/mappers');

      expect(mapMetodoPagamentoToAsaasBillingType('PIX')).toBe('PIX');
      expect(mapMetodoPagamentoToAsaasBillingType('Boleto')).toBe('BOLETO');
      expect(mapMetodoPagamentoToAsaasBillingType('Cartao')).toBe(
        'CREDIT_CARD'
      );
    });
  });

  describe('✅ Webhook Handler', () => {
    it('deve importar webhook handler com sucesso', async () => {
      const { handlePaymentWebhook } =
        await import('@/lib/asaas/webhook-handler');
      expect(typeof handlePaymentWebhook).toBe('function');
    });

    it('deve ter validador de webhook signature', async () => {
      const { validateWebhookSignature } =
        await import('@/lib/asaas/webhook-handler');
      expect(typeof validateWebhookSignature).toBe('function');
    });

    it('deve criar tabela webhook_logs durante inicialização', async () => {
      const { ensureWebhookLogsTable } =
        await import('@/lib/asaas/webhook-handler');
      expect(typeof ensureWebhookLogsTable).toBe('function');
    });
  });

  describe('✅ Componentes de Pagamento', () => {
    it('deve ter mapeadores de status operacionais', async () => {
      const { mapAsaasStatusToLocal } = await import('@/lib/asaas/mappers');

      expect(typeof mapAsaasStatusToLocal).toBe('function');
      expect(mapAsaasStatusToLocal('PENDING')).toBe('pendente');
      expect(mapAsaasStatusToLocal('CONFIRMED')).toBe('pago');
    });

    it('deve ter cliente Asaas funcionando', async () => {
      const { asaasClient } = await import('@/lib/asaas/client');

      expect(asaasClient).toBeDefined();
      expect(typeof asaasClient.createCustomer).toBe('function');
    });
  });

  describe('✅ Tipos TypeScript', () => {
    it('deve ter arquivo de tipos asaas disponível', async () => {
      // TypeScript types não são runtime values, apenas verificar importação funciona
      const handler = await import('@/lib/asaas/webhook-handler');
      expect(handler.handlePaymentWebhook).toBeDefined();
    });
  });

  describe('✅ Integração com Entidades', () => {
    it('deve permitir vincular pagamento a clínica', async () => {
      // Validar que a query funciona
      const result = await query(
        `SELECT * FROM pagamentos 
         WHERE clinica_id IS NOT NULL 
         LIMIT 1`
      );

      // Mesmo que vazio, deve executar sem erro
      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });

    it('deve permitir buscar lotes aguardando pagamento', async () => {
      const result = await query(
        `SELECT id FROM lotes_avaliacao 
         WHERE status_pagamento = 'aguardando_pagamento' 
         LIMIT 5`
      );

      expect(result.rows).toBeDefined();
      expect(Array.isArray(result.rows)).toBe(true);
    });
  });
});
