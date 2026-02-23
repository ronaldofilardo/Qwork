// app/api/pagamento/asaas/sincronizar/route.ts
// Sincronização ativa com Asaas: consulta o status diretamente na API Asaas e
// aciona a máquina de estados local sem depender de webhooks.
// Usado como fallback quando o webhook não chega (ngrok reiniciado, URL errada, etc.)
// Também bypassa a camada de idempotência quando o lote ainda está pendente.

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';
import {
  activateSubscription,
  logWebhookProcessed,
  isWebhookAlreadyProcessed,
} from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookEvent } from '@/lib/asaas/types';

// Status do Asaas que indicam pagamento confirmado
const ASAAS_CONFIRMED_STATUSES = [
  'CONFIRMED', // Pagamento confirmado (aguardando compensação) — cartão, PIX
  'RECEIVED', // Dinheiro efetivamente na conta — PIX/Boleto compensado
  'RECEIVED_IN_CASH', // Confirmado manualmente pelo operador
] as const;

type AsaasConfirmedStatus = (typeof ASAAS_CONFIRMED_STATUSES)[number];

function isConfirmedStatus(status: string): status is AsaasConfirmedStatus {
  return ASAAS_CONFIRMED_STATUSES.includes(status as AsaasConfirmedStatus);
}

function mapStatusToEvent(status: AsaasConfirmedStatus): AsaasWebhookEvent {
  if (status === 'RECEIVED' || status === 'RECEIVED_IN_CASH') {
    return 'PAYMENT_RECEIVED';
  }
  return 'PAYMENT_CONFIRMED';
}

/**
 * POST /api/pagamento/asaas/sincronizar
 *
 * Consulta o Asaas diretamente e aciona activateSubscription se necessário.
 * Contorna idempotência: se webhook_logs já tem entrada MAS o lote ainda está
 * aguardando_pagamento, força re-processamento (situação de falha parcial anterior).
 *
 * Body: { pagamento_id: number }
 *
 * Response:
 *   { status: 'pago' | 'pendente' | 'erro', asaas_status: string, synced: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagamento_id } = body;

    if (!pagamento_id) {
      return NextResponse.json(
        { error: 'pagamento_id é obrigatório' },
        { status: 400 }
      );
    }

    const pagamentoIdNum = Number(pagamento_id);
    if (!Number.isFinite(pagamentoIdNum) || pagamentoIdNum <= 0) {
      return NextResponse.json(
        { error: 'pagamento_id deve ser um número inteiro positivo' },
        { status: 400 }
      );
    }

    // 1. Buscar o pagamento local (simples — o lote será resolvido via externalReference do Asaas)
    const pagamentoResult = await query(
      `SELECT
         p.id,
         p.status            AS pagamento_status,
         p.asaas_payment_id,
         p.entidade_id,
         p.clinica_id
       FROM pagamentos p
       WHERE p.id = $1`,
      [pagamento_id]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const row = pagamentoResult.rows[0];
    const pagamentoStatus: string = row.pagamento_status;

    if (!row.asaas_payment_id) {
      return NextResponse.json({
        status: pagamentoStatus,
        asaas_status: null,
        synced: false,
        message: 'Pagamento ainda não tem ID Asaas (cobrança não criada)',
      });
    }

    // 2. Se já está pago localmente, verificar se o lote também foi atualizado
    // (pode haver falha parcial: pagamento=pago mas lote=aguardando_pagamento)
    if (pagamentoStatus === 'pago') {
      // Verificar o lote via externalReference do Asaas
      // O activateSubscription irá buscar o lote pelo externalReference e tentar atualizar
      // Se o lote já está pago, ele simplesmente não encontrará lote pendente e não fará nada
      console.log(
        `[SINCRONIZAR] Pagamento ${pagamento_id} já está pago localmente — verificando estado do lote...`
      );
    }

    console.log(
      `[SINCRONIZAR] Consultando Asaas para pagamento local ${pagamento_id}, asaas_id=${row.asaas_payment_id}`
    );

    // 3. Consultar Asaas API diretamente
    let asaasPayment: any;
    try {
      asaasPayment = await asaasClient.getPayment(row.asaas_payment_id);
    } catch (asaasErr: any) {
      console.error('[SINCRONIZAR] Erro ao consultar Asaas:', asaasErr.message);
      return NextResponse.json(
        {
          error: `Erro ao consultar Asaas: ${asaasErr.message}`,
          status: pagamentoStatus,
          synced: false,
        },
        { status: 502 }
      );
    }

    console.log(
      `[SINCRONIZAR] Status no Asaas: ${asaasPayment.status} | Status local pagamento: ${pagamentoStatus}`
    );

    // 4. Asaas ainda não confirmou
    if (!isConfirmedStatus(asaasPayment.status)) {
      return NextResponse.json({
        status: pagamentoStatus,
        asaas_status: asaasPayment.status,
        synced: false,
        message: `Aguardando confirmação no Asaas (status atual: ${asaasPayment.status})`,
      });
    }

    // 5. Asaas confirmou — verificar se é um caso de falha parcial anterior
    const event = mapStatusToEvent(asaasPayment.status as AsaasConfirmedStatus);
    const alreadyLogged = await isWebhookAlreadyProcessed(
      row.asaas_payment_id,
      event
    );

    // Se webhook já foi processado E pagamento já está pago localmente:
    // Verificar se o lote ainda está pendente (falha parcial anterior)
    if (alreadyLogged && pagamentoStatus === 'pago') {
      // Buscar lote pelo externalReference do Asaas para verificar se precisa reprocessar
      const extRef: string | undefined = asaasPayment.externalReference;
      const loteMatch = extRef?.match(/^lote_(\d+)_pagamento_\d+$/);
      if (loteMatch) {
        const loteIdLocal = parseInt(loteMatch[1], 10);
        const loteCheck = await query(
          `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
          [loteIdLocal]
        );
        const lotePendente =
          loteCheck.rows.length > 0 &&
          ['aguardando_cobranca', 'aguardando_pagamento'].includes(
            loteCheck.rows[0].status_pagamento
          );
        if (!lotePendente) {
          // Lote já está pago — nada a fazer
          return NextResponse.json({
            status: 'pago',
            asaas_status: asaasPayment.status,
            synced: false,
            message:
              'Pagamento e lote já confirmados (webhook processado anteriormente)',
          });
        }
        console.log(
          `[SINCRONIZAR] ⚠️ Lote ${loteIdLocal} ainda está ${loteCheck.rows[0].status_pagamento} — forçando re-ativação`
        );
      } else {
        // Sem lote_id no externalReference e já pago: considera sincronizado
        return NextResponse.json({
          status: 'pago',
          asaas_status: asaasPayment.status,
          synced: false,
          message: 'Pagamento já estava sincronizado',
        });
      }
    }

    // 6. Chamar activateSubscription DIRETAMENTE (sem passar pela camada de
    //    idempotência do handlePaymentWebhook) para garantir que o lote seja atualizado.
    //    Isso resolve o caso onde webhook_logs tem entrada mas o lote não foi atualizado
    //    (falha parcial / race condition).
    console.log(
      `[SINCRONIZAR] ✅ Asaas confirma pagamento! Chamando activateSubscription diretamente (bypass idempotência)...`
    );

    const paymentPayload = {
      object: 'payment' as const,
      id: asaasPayment.id,
      dateCreated: asaasPayment.dateCreated,
      customer: asaasPayment.customer,
      dueDate: asaasPayment.dueDate,
      value: asaasPayment.value,
      netValue: asaasPayment.netValue,
      billingType: asaasPayment.billingType,
      status: asaasPayment.status,
      deleted: asaasPayment.deleted ?? false,
      anticipated: asaasPayment.anticipated ?? false,
      anticipable: asaasPayment.anticipable ?? false,
      postalService: asaasPayment.postalService ?? false,
      externalReference: asaasPayment.externalReference,
      description: asaasPayment.description,
      confirmedDate: asaasPayment.confirmedDate,
      paymentDate: asaasPayment.paymentDate,
      invoiceUrl: asaasPayment.invoiceUrl,
      bankSlipUrl: asaasPayment.bankSlipUrl,
      creditCard: asaasPayment.creditCard,
    };

    await activateSubscription(row.asaas_payment_id, paymentPayload, event);

    // 7. Registrar idempotência DEPOIS do commit (garante atomicidade)
    await logWebhookProcessed(row.asaas_payment_id, event, paymentPayload);

    console.log(
      `[SINCRONIZAR] ✅ Sincronização concluída para pagamento ${pagamento_id}`
    );

    return NextResponse.json({
      status: 'pago',
      asaas_status: asaasPayment.status,
      synced: true,
      message: 'Pagamento sincronizado e confirmado com sucesso',
    });
  } catch (error: any) {
    console.error('[SINCRONIZAR] Erro inesperado:', error);
    return NextResponse.json(
      {
        error: `Erro ao sincronizar pagamento: ${error.message}`,
        synced: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pagamento/asaas/sincronizar?pagamento_id=X
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pagamento_id =
    searchParams.get('pagamento_id') || searchParams.get('id');

  if (!pagamento_id) {
    return NextResponse.json(
      { error: 'pagamento_id é obrigatório' },
      { status: 400 }
    );
  }

  const fakeRequest = new Request(request.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pagamento_id: Number(pagamento_id) }),
  });

  return POST(new NextRequest(fakeRequest));
}
