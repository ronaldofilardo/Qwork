// lib/asaas/webhook-handler.ts
// Handler para processar notificações (webhooks) do Asaas

import { NextRequest } from 'next/server';
import type { AsaasWebhookPayload, AsaasWebhookEvent } from './types';
import { mapAsaasStatusToLocal } from './mappers';
import { transaction, query as dbQuery } from '@/lib/db';
import { criarComissaoAutomatica } from '@/lib/db/comissionamento';
import { dispararEmailLotePago } from '@/lib/email';

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
    const result = await dbQuery(
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
 * Verificar se um webhook já foi processado (idempotência)
 * Exportado para uso pelo /api/pagamento/asaas/sincronizar
 */
export async function isWebhookAlreadyProcessed(
  paymentId: string,
  event: AsaasWebhookEvent
): Promise<boolean> {
  return isWebhookProcessed(paymentId, event);
}

/**
 * Registrar webhook processado
 * Exportado para uso pelo /api/pagamento/asaas/sincronizar
 */
export async function logWebhookProcessed(
  paymentId: string,
  event: AsaasWebhookEvent,
  payload: any
): Promise<void> {
  try {
    await dbQuery(
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

    // Usar operador || (merge) ao invés de substituição direta do JSONB.
    // Isso preserva campos que possam ter sido gravados anteriormente,
    // como 'lote_id' inserido pelo /api/pagamento/asaas/criar.
    const result = await dbQuery(
      `UPDATE pagamentos 
       SET status = $1,
           asaas_payment_id = $2,
           dados_adicionais = COALESCE(dados_adicionais, '{}'::jsonb) || $3::jsonb,
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
 * Exportado para uso direto pelo /api/pagamento/asaas/sincronizar (sem camada de idempotência)
 */
export async function activateSubscription(
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

  // Variáveis capturadas para geração de comissões após commit da transação
  let lotesAtualizados: number[] = [];
  let comissaoEntidadeId: number | null = null;
  let comissaoClinicaId: number | null = null;
  let valorLote: number = 0;
  let comissaoNumeroParcela: number = 1;
  let comissaoTotalParcelas: number = 1;

  try {
    await transaction(async (client) => {
      console.log('[Asaas Webhook] ✅ Transação iniciada');

      // 1. Buscar o pagamento usando asaas_payment_id
      let paymentResult = await client.query(
        `SELECT id, entidade_id, clinica_id, empresa_id, valor, numero_parcelas, tipo_cobranca
       FROM pagamentos
       WHERE asaas_payment_id = $1`,
        [asaasPaymentId]
      );

      // Fallback para pagamentos parcelados: o Asaas gera IDs distintos por parcela.
      // O externalReference (ex: lote_32_pagamento_44) contém o ID local do pagamento.
      if (paymentResult.rowCount === 0 && paymentData.externalReference) {
        const localIdMatch =
          paymentData.externalReference.match(/pagamento_(\d+)/);
        if (localIdMatch) {
          const localPagamentoId = parseInt(localIdMatch[1], 10);
          console.log(
            `[Asaas Webhook] 🔄 Lookup por asaas_payment_id falhou — tentando via externalReference (pagamento local ${localPagamentoId})`
          );
          paymentResult = await client.query(
            `SELECT id, entidade_id, clinica_id, empresa_id, valor, numero_parcelas, tipo_cobranca
           FROM pagamentos
           WHERE id = $1`,
            [localPagamentoId]
          );
        }
      }

      if (paymentResult.rowCount === 0) {
        throw new Error(
          `Pagamento não encontrado com asaas_payment_id: ${asaasPaymentId}`
        );
      }

      const pagamento = paymentResult.rows[0];
      const {
        id: pagamentoId,
        entidade_id,
        clinica_id,
        empresa_id,
        valor,
        numero_parcelas,
        tipo_cobranca,
      } = pagamento;

      // Número real de parcelas: salvo em numero_parcelas no momento da criação do pagamento.
      // O Asaas envia um webhook por parcela — installmentCount não está disponível no payload.
      const parcelasReais: number = numero_parcelas ?? 1;

      // 2. Atualizar status do pagamento para 'pago'
      await client.query(
        `UPDATE pagamentos
       SET status = 'pago',
           data_pagamento = COALESCE($1::timestamp, NOW()),
           asaas_net_value = COALESCE($4::numeric, asaas_net_value),
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
          paymentData.netValue ?? null,
        ]
      );

      // 2b. Marcar a parcela específica como paga em detalhes_parcelas.
      // paymentData.installmentNumber indica qual parcela chegou (1, 2, 3...).
      // Para pagamentos à vista (não parcelados), installmentNumber é undefined → usa 1.
      const numeroParcela = paymentData.installmentNumber ?? 1;
      const dataPagamentoStr =
        paymentData.paymentDate ||
        paymentData.confirmedDate ||
        new Date().toISOString();

      await client.query(
        `UPDATE pagamentos
       SET detalhes_parcelas = (
         SELECT jsonb_agg(
           CASE
             WHEN (elem->>'numero')::int = $1
             THEN elem || jsonb_build_object(
               'pago', true,
               'status', 'pago',
               'data_pagamento', $2::text
             )
             ELSE elem
           END
         )
         FROM jsonb_array_elements(COALESCE(detalhes_parcelas, '[]'::jsonb)) AS elem
       )
       WHERE id = $3 AND detalhes_parcelas IS NOT NULL`,
        [numeroParcela, dataPagamentoStr, pagamentoId]
      );
      console.log(
        `[Asaas Webhook] ✅ Parcela ${numeroParcela} marcada como paga em detalhes_parcelas (pagamento ${pagamentoId})`
      );

      // 3. Se for cobrança de manutenção, registrar crédito e encerrar — sem liberar lotes
      if (tipo_cobranca === 'manutencao') {
        console.log(
          `[Asaas Webhook] 🔧 Pagamento de manutenção confirmado (pagamento ${pagamentoId}). Registrando crédito.`
        );

        if (entidade_id) {
          await client.query(
            `INSERT INTO creditos_manutencao (entidade_id, pagamento_id, valor, criado_em)
             VALUES ($1, $2, $3, NOW())`,
            [entidade_id, pagamentoId, valor]
          );
          await client.query(
            `UPDATE entidades SET credito_manutencao_pendente = COALESCE(credito_manutencao_pendente, 0) + $1 WHERE id = $2`,
            [valor, entidade_id]
          );
          console.log(
            `[Asaas Webhook] ✅ Crédito R$${valor} registrado para entidade ${entidade_id}`
          );
        } else if (clinica_id) {
          await client.query(
            `INSERT INTO creditos_manutencao (clinica_id, empresa_id, pagamento_id, valor, criado_em)
             VALUES ($1, $2, $3, $4, NOW())`,
            [clinica_id, empresa_id ?? null, pagamentoId, valor]
          );
          await client.query(
            `UPDATE clinicas SET credito_manutencao_pendente = COALESCE(credito_manutencao_pendente, 0) + $1 WHERE id = $2`,
            [valor, clinica_id]
          );
          console.log(
            `[Asaas Webhook] ✅ Crédito R$${valor} registrado para clínica ${clinica_id}`
          );
        }

        // Capturar dados mínimos para o log (sem lotes)
        comissaoEntidadeId = entidade_id ?? null;
        comissaoClinicaId = clinica_id ?? null;
        valorLote = valor;
        comissaoNumeroParcela = numeroParcela;
        comissaoTotalParcelas = parcelasReais;
        return; // Encerra a transação sem processar lotes
      }

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

      // Verificar se o tomador é isento — se for, ignorar atualização de lotes
      if (lotesResult.rowCount && lotesResult.rowCount > 0) {
        let isIsentoTomador = false;
        if (clinica_id) {
          const isentoRes = await client.query(
            `SELECT isento_pagamento FROM clinicas WHERE id = $1`,
            [clinica_id]
          );
          isIsentoTomador = isentoRes.rows[0]?.isento_pagamento === true;
        } else if (entidade_id) {
          const isentoRes = await client.query(
            `SELECT isento_pagamento FROM entidades WHERE id = $1`,
            [entidade_id]
          );
          isIsentoTomador = isentoRes.rows[0]?.isento_pagamento === true;
        }
        if (isIsentoTomador) {
          console.warn(
            `[Asaas Webhook] ⚠️ Tomador ${clinica_id ? `clínica ${clinica_id}` : `entidade ${entidade_id}`} é isento_pagamento — ignorando atualização de lotes`
          );
          lotesAtualizados = [];
          return; // Encerra a transação sem marcar lotes como pago
        }
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
             pagamento_parcelas = $3
         WHERE id = $2
         RETURNING id, status_pagamento, pago_em, pagamento_metodo, pagamento_parcelas`,
          [
            paymentData.billingType?.toLowerCase() || 'pix',
            lote.id,
            parcelasReais,
          ]
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

      // Capturar dados para geração de comissões após commit
      lotesAtualizados = lotesResult.rows.map((r: any) => r.id);
      comissaoEntidadeId = entidade_id ?? null;
      comissaoClinicaId = clinica_id ?? null;
      valorLote = valor;
      comissaoNumeroParcela = numeroParcela;
      comissaoTotalParcelas = parcelasReais;

      // 4. transaction() fará COMMIT automaticamente ao final do callback.
      // O logWebhookProcessed é feito DEPOIS pelo chamador (handlePaymentWebhook).
      // Isso garante que a entrada webhook_logs só existe SE e QUANDO o commit foi bem-sucedido.
      console.log(`[Asaas Webhook] ✅ PAGAMENTO CONFIRMADO:`, {
        pagamentoId,
        asaasPaymentId,
        lotesAtualizados: lotesResult.rowCount,
        valor,
        netValue: paymentData.netValue,
        formaPagamento: paymentData.billingType,
      });
    }); // fim transaction()
  } catch (error) {
    console.error('[Asaas Webhook] Erro ao processar pagamento:', error);
    throw error;
  }

  for (const loteId of lotesAtualizados) {
    try {
      await criarComissaoAutomatica({
        lote_id: loteId,
        entidade_id: comissaoEntidadeId,
        clinica_id: comissaoClinicaId,
        valor_total_lote: valorLote,
        valor_parcela_liquida: paymentData.netValue ?? paymentData.value,
        parcela_numero: comissaoNumeroParcela,
        total_parcelas: comissaoTotalParcelas,
        asaas_payment_id: paymentData.id ?? null,
      });
    } catch (errComissao) {
      console.error(
        `[Asaas Webhook] Erro ao gerar comissão automática para lote ${loteId}:`,
        errComissao
      );
    }

    // Email #2: lote disponível para o emissor gerar o laudo
    dispararEmailLotePago(loteId).catch((e) =>
      console.error('[EMAIL] dispararEmailLotePago (webhook) falhou:', e)
    );
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
    await dbQuery(`
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
