// lib/asaas/webhook-handler.ts
// Handler para processar notificações (webhooks) do Asaas

import { NextRequest } from 'next/server';
import type { AsaasWebhookPayload, AsaasWebhookEvent } from './types';
import { mapAsaasStatusToLocal } from './mappers';
import { Pool } from 'pg';

// Pool de conexão com PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Validar se o webhook veio realmente do Asaas
 * Em desenvolvimento, aceita webhooks sem validação
 * Em produção, deve validar assinatura HMAC-SHA256
 */
export function validateWebhookSignature(request: NextRequest): boolean {
  const isDev = process.env.NODE_ENV === 'development';

  // Em desenvolvimento, aceita todos os webhooks (para testes com ngrok)
  if (isDev) {
    console.log('[Asaas Webhook] Validação desabilitada em development mode');
    return true;
  }

  const secret = process.env.ASAAS_WEBHOOK_SECRET;

  // Em produção, deve haver um secret configurado
  if (!secret) {
    console.error(
      '[Asaas Webhook] ASAAS_WEBHOOK_SECRET não configurado em produção!'
    );
    return false;
  }

  const authHeader = request.headers.get('asaas-access-token');

  if (!authHeader) {
    console.error('[Asaas Webhook] Header asaas-access-token não encontrado');
    return false;
  }

  const isValid = authHeader === secret;

  if (!isValid) {
    console.error(
      '[Asaas Webhook] Token inválido. Possível tentativa de fraude.'
    );
  }

  return isValid;
}

/**
 * Verificar se um webhook já foi processado (idempotência)
 */
async function isWebhookProcessed(
  paymentId: string,
  event: AsaasWebhookEvent
): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT id FROM webhook_logs 
       WHERE payment_id = $1 AND event = $2 
       LIMIT 1`,
      [paymentId, event]
    );

    return result.rowCount > 0;
  } catch (error) {
    // Se a tabela não existir, retorna false (primeira execução)
    console.warn('[Asaas Webhook] Tabela webhook_logs não encontrada:', error);
    return false;
  }
}

/**
 * Registrar webhook processado
 */
async function logWebhookProcessed(
  paymentId: string,
  event: AsaasWebhookEvent,
  payload: any
): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO webhook_logs (payment_id, event, payload, processed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (payment_id, event) DO NOTHING`,
      [paymentId, event, JSON.stringify(payload)]
    );
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao registrar log:', error);
    // Não falha o processamento se não conseguir logar
  }
}

/**
 * Atualizar status de pagamento no banco de dados
 */
async function updatePaymentStatus(
  asaasPaymentId: string,
  status: string,
  paymentData: AsaasWebhookPayload['payment']
): Promise<void> {
  try {
    const localStatus = mapAsaasStatusToLocal(paymentData.status);

    const result = await pool.query(
      `UPDATE pagamentos 
       SET status = $1,
           asaas_payment_id = $2,
           dados_adicionais = $3,
           atualizado_em = NOW()
       WHERE asaas_payment_id = $2
       RETURNING id, entidade_id, clinica_id`,
      [
        localStatus,
        asaasPaymentId,
        JSON.stringify({
          asaasStatus: paymentData.status,
          billingType: paymentData.billingType,
          netValue: paymentData.netValue,
          confirmedDate: paymentData.confirmedDate,
          paymentDate: paymentData.paymentDate,
          invoiceUrl: paymentData.invoiceUrl,
          bankSlipUrl: paymentData.bankSlipUrl,
          lastWebhookEvent: status,
          lastWebhookAt: new Date().toISOString(),
        }),
      ]
    );

    if (result.rowCount === 0) {
      console.warn(
        `[Asaas Webhook] Pagamento não encontrado no banco: ${asaasPaymentId}`
      );
    } else {
      console.log(`[Asaas Webhook] Pagamento atualizado:`, {
        pagamentoId: result.rows[0].id,
        entidadeId: result.rows[0].entidade_id,
        clinicaId: result.rows[0].clinica_id,
        novoStatus: localStatus,
      });
    }
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao atualizar pagamento:', error);
    throw error;
  }
}

/**
 * Extrair lote_id do externalReference se disponível
 * Formato esperado: lote_22_pagamento_31
 */
function extractLoteIdFromExternalReference(
  externalReference?: string
): number | null {
  if (!externalReference) return null;

  const match = externalReference.match(/^lote_(\d+)_pagamento_\d+$/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Ativar assinatura do cliente (liberar acesso ao sistema)
 */
async function activateSubscription(
  asaasPaymentId: string,
  paymentData: AsaasWebhookPayload['payment'],
  event: AsaasWebhookEvent
): Promise<void> {
  console.log('[Asaas Webhook] 🚀 INICIANDO activateSubscription:', {
    asaasPaymentId,
    event,
    externalReference: paymentData.externalReference,
    status: paymentData.status,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    console.log('[Asaas Webhook] ✅ Transação iniciada (BEGIN)');

    // 1. Buscar o pagamento usando asaas_payment_id
    const paymentResult = await client.query(
      `SELECT id, entidade_id, clinica_id, valor
       FROM pagamentos
       WHERE asaas_payment_id = $1`,
      [asaasPaymentId]
    );

    if (paymentResult.rowCount === 0) {
      throw new Error(
        `Pagamento não encontrado com asaas_payment_id: ${asaasPaymentId}`
      );
    }

    const pagamento = paymentResult.rows[0];
    const { id: pagamentoId, entidade_id, clinica_id, valor } = pagamento;

    // 2. Atualizar status do pagamento para 'pago'
    await client.query(
      `UPDATE pagamentos
       SET status = 'pago',
           data_pagamento = COALESCE($1::timestamp, NOW()),
           dados_adicionais = jsonb_set(
             COALESCE(dados_adicionais, '{}'::jsonb),
             '{asaasConfirmedDate}',
             to_jsonb($2::text)
           ),
           atualizado_em = NOW()
       WHERE id = $3`,
      [
        paymentData.paymentDate || paymentData.confirmedDate,
        paymentData.confirmedDate,
        pagamentoId,
      ]
    );

    // 3. Tentar extrair lote_id do externalReference
    const loteId = extractLoteIdFromExternalReference(
      paymentData.externalReference
    );

    let lotesResult;

    if (loteId) {
      // 3a. Se lote_id foi extraído, atualizar diretamente o lote específico
      console.log(
        `[Asaas Webhook] 🎯 Lote identificado via externalReference: ${loteId}`
      );

      console.log(
        '[Asaas Webhook] 🔍 Executando query:',
        `SELECT id FROM lotes_avaliacao WHERE id = ${loteId} AND status_pagamento = 'aguardando_pagamento'`
      );

      lotesResult = await client.query(
        `SELECT id FROM lotes_avaliacao
         WHERE id = $1 AND status_pagamento = 'aguardando_pagamento'`,
        [loteId]
      );

      console.log(
        `[Asaas Webhook] 📊 Resultado da query: ${lotesResult.rowCount} linha(s) encontrada(s)`
      );
      if (lotesResult.rowCount > 0) {
        console.log(
          `[Asaas Webhook] ✅ Lote encontrado: ${lotesResult.rows[0].id}`
        );
      }

      if (lotesResult.rowCount === 0) {
        console.warn(
          `[Asaas Webhook] ⚠️  Lote ${loteId} não encontrado ou não está aguardando pagamento`
        );

        // Debug: Verificar estado atual do lote
        const debugResult = await client.query(
          `SELECT id, status_pagamento FROM lotes_avaliacao WHERE id = $1`,
          [loteId]
        );
        if (debugResult.rowCount > 0) {
          console.warn(
            `[Asaas Webhook] 🔍 Status atual do lote ${loteId}:`,
            debugResult.rows[0]
          );
        } else {
          console.error(
            `[Asaas Webhook] ❌ Lote ${loteId} não existe no banco!`
          );
        }
      }
    } else {
      // 3b. Fallback: Buscar lotes por entidade_id/clinica_id (comportamento antigo)
      console.log(
        `[Asaas Webhook] Buscando lotes para entidade_id=${entidade_id}, clinica_id=${clinica_id}`
      );

      lotesResult = await client.query(
        `SELECT id FROM lotes_avaliacao
         WHERE status_pagamento = 'aguardando_pagamento'
         AND (
           ($1::int IS NOT NULL AND entidade_id = $1)
           OR
           ($2::int IS NOT NULL AND clinica_id = $2)
         )`,
        [entidade_id || null, clinica_id || null]
      );
    }

    console.log(
      `[Asaas Webhook] 🔍 Encontrados ${lotesResult.rowCount} lotes para atualizar:`,
      lotesResult.rows.map((r: any) => r.id)
    );

    if (lotesResult.rowCount === 0) {
      console.warn(
        `[Asaas Webhook] ⚠️ ATENÇÃO: Nenhum lote encontrado para atualizar!`,
        {
          loteIdExtraido: loteId,
          entidade_id,
          clinica_id,
          externalReference: paymentData.externalReference,
        }
      );
    }

    for (const lote of lotesResult.rows) {
      console.log(`[Asaas Webhook] 🔄 Atualizando lote ${lote.id}...`);
      console.log(
        `[Asaas Webhook] 📝 Executando UPDATE lotes_avaliacao SET status_pagamento='pago', pago_em=NOW() WHERE id=${lote.id}`
      );

      const updateResult = await client.query(
        `UPDATE lotes_avaliacao
         SET status_pagamento = 'pago',
             pago_em = NOW(),
             pagamento_metodo = $1,
             pagamento_parcelas = 1
         WHERE id = $2
         RETURNING id, status_pagamento, pago_em, pagamento_metodo`,
        [paymentData.billingType?.toLowerCase() || 'pix', lote.id]
      );

      if (updateResult.rowCount > 0) {
        const loteAtualizado = updateResult.rows[0];
        console.log('[Asaas Webhook] ✅ Lote atualizado com sucesso:', {
          lote_id: loteAtualizado.id,
          novo_status_pagamento: loteAtualizado.status_pagamento,
          pago_em: loteAtualizado.pago_em,
          pagamento_metodo: loteAtualizado.pagamento_metodo,
        });
      } else {
        console.error(
          `[Asaas Webhook] ❌ Falha ao atualizar lote ${lote.id}: nenhuma linha afetada`
        );
      }
    }

    // 4. Registrar webhook processado
    await logWebhookProcessed(asaasPaymentId, event, paymentData);

    await client.query('COMMIT');

    console.log(`[Asaas Webhook] ✅ PAGAMENTO CONFIRMADO:`, {
      pagamentoId,
      asaasPaymentId,
      lotesAtualizados: lotesResult.rowCount,
      valor,
      netValue: paymentData.netValue,
      formaPagamento: paymentData.billingType,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[Asaas Webhook] Erro ao processar pagamento:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Processar evento de pagamento do webhook
 */
export async function handlePaymentWebhook(
  payload: AsaasWebhookPayload
): Promise<void> {
  const { event, payment } = payload;

  console.log(
    `[Asaas Webhook] 📨 Iniciando processamento do evento: ${event}`,
    {
      paymentId: payment.id,
      externalRef: payment.externalReference,
      status: payment.status,
      value: payment.value,
      billingType: payment.billingType,
    }
  );

  // Extrair informações do externalReference
  const loteId = extractLoteIdFromExternalReference(payment.externalReference);
  console.log('[Asaas Webhook] 🔍 Análise do externalReference:', {
    externalReference: payment.externalReference,
    loteIdExtraido: loteId,
    detectadoComoEmissao: !!loteId,
  });

  if (loteId) {
    console.log(
      `[Asaas Webhook] 🎯 Detectado pagamento de emissão para Lote #${loteId}`
    );
  } else {
    console.log(
      `[Asaas Webhook] ⚠️  Não foi possível extrair lote_id do externalReference`
    );
  }

  // Verificar se já processamos este webhook (idempotência)
  const alreadyProcessed = await isWebhookProcessed(payment.id, event);
  if (alreadyProcessed) {
    console.log(
      `[Asaas Webhook] ⚠️  Evento ${event} já processado para ${payment.id}. Ignorando.`
    );
    return;
  }

  try {
    // Processar conforme o tipo de evento
    console.log(`[Asaas Webhook] Tratando evento: ${event}`);
    switch (event) {
      case 'PAYMENT_CREATED':
        // Pagamento criado - atualizar status para 'processando'
        await updatePaymentStatus(payment.id, 'CREATED', payment);
        break;

      case 'PAYMENT_UPDATED':
        // Pagamento atualizado - sincronizar dados
        await updatePaymentStatus(payment.id, 'UPDATED', payment);
        break;

      case 'PAYMENT_CONFIRMED':
        // Pagamento confirmado (cartão aprovado, boleto pago, PIX pago)
        // Para cartão de crédito e PIX, já libera o acesso imediatamente
        console.log(
          '[Asaas Webhook] 🔵 ========== PROCESSANDO PAYMENT_CONFIRMED =========='
        );
        console.log('[Asaas Webhook] 💳 Payment ID:', payment.id);
        console.log('[Asaas Webhook] 💰 Valor:', payment.value);
        console.log(
          '[Asaas Webhook] 🏷️  External Ref:',
          payment.externalReference
        );
        console.log('[Asaas Webhook] 📊 Status Asaas:', payment.status);
        console.log('[Asaas Webhook] 🔄 Executando: activateSubscription...');

        await activateSubscription(payment.id, payment, event);

        console.log(
          '[Asaas Webhook] ✅ PAYMENT_CONFIRMED processado com sucesso'
        );
        console.log(
          '[Asaas Webhook] ==================================================='
        );
        break;

      case 'PAYMENT_RECEIVED':
        // 💰 PAGAMENTO EFETIVAMENTE RECEBIDO!
        // Evento redundante se já processamos PAYMENT_CONFIRMED, mas garantimos que seja processado
        console.log(
          '[Asaas Webhook] 💰 Executando: PAYMENT_RECEIVED - ativando subscription'
        );
        await activateSubscription(payment.id, payment, event);
        console.log(
          '[Asaas Webhook] ✅ PAYMENT_RECEIVED processado com sucesso'
        );
        break;

      case 'PAYMENT_OVERDUE':
        // Pagamento vencido
        await updatePaymentStatus(payment.id, 'OVERDUE', payment);
        // TODO: Enviar notificação ao cliente sobre vencimento
        break;

      case 'PAYMENT_REFUNDED':
      case 'PAYMENT_REFUND_IN_PROGRESS':
        // Pagamento estornado
        await updatePaymentStatus(payment.id, 'REFUNDED', payment);
        // TODO: Desativar acesso do cliente se necessário
        break;

      case 'PAYMENT_DELETED':
      case 'PAYMENT_RESTORED':
        // Pagamento cancelado ou restaurado
        await updatePaymentStatus(payment.id, event, payment);
        break;

      case 'PAYMENT_CHARGEBACK_REQUESTED':
      case 'PAYMENT_CHARGEBACK_DISPUTE':
      case 'PAYMENT_AWAITING_CHARGEBACK_REVERSAL':
        // Chargeback (contestação de cartão)
        await updatePaymentStatus(payment.id, 'CHARGEBACK', payment);
        console.warn(
          `[Asaas Webhook] ⚠️ CHARGEBACK para pagamento ${payment.id}`
        );
        // TODO: Notificar admin sobre chargeback
        break;

      case 'PAYMENT_RECEIVED_IN_CASH_UNDONE':
        // Recebimento em dinheiro desfeito
        await updatePaymentStatus(payment.id, 'UNDONE', payment);
        break;

      case 'PAYMENT_BANK_SLIP_VIEWED':
      case 'PAYMENT_CHECKOUT_VIEWED':
        // Eventos informativos (boleto/checkout visualizado)
        // Apenas logar, não atualizar status
        console.log(`[Asaas Webhook] 👁️ ${event} - ${payment.id}`);
        break;

      default:
        console.log(`[Asaas Webhook] Evento não tratado: ${event}`);
    }

    // Registrar que processamos este webhook
    await logWebhookProcessed(payment.id, event, payload);
  } catch (error) {
    console.error(`[Asaas Webhook] Erro ao processar evento ${event}:`, error);
    // Re-throw para que a rota retorne erro e o Asaas tente novamente
    throw error;
  }
}

/**
 * Criar tabela de logs de webhooks (se não existir)
 * Chamado na inicialização da aplicação
 */
export async function ensureWebhookLogsTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        payment_id VARCHAR(50) NOT NULL,
        event VARCHAR(100) NOT NULL,
        payload JSONB,
        processed_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (payment_id, event)
      );
      
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id 
        ON webhook_logs(payment_id);
      
      CREATE INDEX IF NOT EXISTS idx_webhook_logs_processed_at 
        ON webhook_logs(processed_at DESC);
    `);

    console.log('[Asaas Webhook] Tabela webhook_logs garantida');
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao criar tabela webhook_logs:', error);
  }
}
