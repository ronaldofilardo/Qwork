// app/api/pagamento/asaas/sincronizar-lote/route.ts
//
// Reconciliação de pagamentos por lote.
//
// Problema resolvido:
//   Boletos são pagos horas/dias após a emissão, fora da janela de polling do
//   CheckoutAsaas.tsx. Se o webhook do Asaas não chegou (ngrok down, URL errada,
//   falha transitória), o lote fica indefinidamente em "aguardando_pagamento".
//
// Solução:
//   1. Ao carregar a página de detalhes do lote (status = aguardando_pagamento),
//      o frontend chama este endpoint automaticamente.
//   2. Um job de reconciliação (cron) chama este endpoint para todos os lotes pendentes.
//
// Lógica:
//   1. Buscar pagamentos PENDENTES/PAGO com asaas_payment_id ligados ao lote
//      (via dados_adicionais->>'lote_id' ou fallback por entidade/clínica).
//   2. Para cada pagamento, consultar o Asaas diretamente.
//   3. Se Asaas confirmar o pagamento E o externalReference bater com o lote:
//      → Chamar activateSubscription (atualiza pagamentos + lotes_avaliacao).
//      → Registrar log (idempotência).

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';
import {
  activateSubscription,
  logWebhookProcessed,
  isWebhookAlreadyProcessed,
} from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookEvent } from '@/lib/asaas/types';

const ASAAS_CONFIRMED_STATUSES = [
  'CONFIRMED',
  'RECEIVED',
  'RECEIVED_IN_CASH',
] as const;
type AsaasConfirmedStatus = (typeof ASAAS_CONFIRMED_STATUSES)[number];

function isConfirmedStatus(status: string): status is AsaasConfirmedStatus {
  return ASAAS_CONFIRMED_STATUSES.includes(status as AsaasConfirmedStatus);
}

function mapStatusToEvent(status: AsaasConfirmedStatus): AsaasWebhookEvent {
  return status === 'RECEIVED' || status === 'RECEIVED_IN_CASH'
    ? 'PAYMENT_RECEIVED'
    : 'PAYMENT_CONFIRMED';
}

/**
 * POST /api/pagamento/asaas/sincronizar-lote
 *
 * Body: { lote_id: number }
 *
 * Response:
 *   {
 *     status_pagamento: 'pago' | 'aguardando_pagamento' | 'aguardando_cobranca',
 *     synced: boolean,
 *     message: string
 *   }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lote_id } = body;

    if (!lote_id) {
      return NextResponse.json(
        { error: 'lote_id é obrigatório' },
        { status: 400 }
      );
    }

    const loteIdNum = Number(lote_id);
    if (!Number.isFinite(loteIdNum) || loteIdNum <= 0) {
      return NextResponse.json(
        { error: 'lote_id deve ser um número inteiro positivo' },
        { status: 400 }
      );
    }

    // 1. Buscar o lote para obter entidade/clínica e status_pagamento atual
    const loteResult = await query(
      `SELECT id, entidade_id, clinica_id, status_pagamento
       FROM lotes_avaliacao
       WHERE id = $1`,
      [loteIdNum]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Se o lote já está pago, nada a fazer
    if (lote.status_pagamento === 'pago') {
      return NextResponse.json({
        status_pagamento: 'pago',
        synced: false,
        message: 'Lote já está pago',
      });
    }

    // Se o lote nem tem cobrança ainda (aguardando_cobranca), idem
    if (lote.status_pagamento === 'aguardando_cobranca') {
      return NextResponse.json({
        status_pagamento: 'aguardando_cobranca',
        synced: false,
        message: 'Lote ainda não possui cobrança registrada',
      });
    }

    console.log(
      `[SINCRONIZAR-LOTE] Verificando pagamentos para Lote #${loteIdNum}`,
      {
        entidade_id: lote.entidade_id,
        clinica_id: lote.clinica_id,
        status_pagamento: lote.status_pagamento,
      }
    );

    // 2. Buscar pagamentos candidatos:
    //    Estratégia primária: dados_adicionais->>'lote_id' (para pagamentos novos)
    //    Estratégia fallback:  entidade_id / clinica_id (para pagamentos sem lote_id gravado)
    const pagamentosResult = await query(
      `SELECT
         id,
         asaas_payment_id,
         status,
         metodo,
         dados_adicionais
       FROM pagamentos
       WHERE asaas_payment_id IS NOT NULL
         AND status IN ('pendente', 'pago')
         AND (
           -- Estratégia 1: lote_id gravado diretamente no JSONB
           (dados_adicionais->>'lote_id')::int = $1
           OR
           -- Estratégia 2: fallback por vínculo entidade/clínica
           (
             ($2::int IS NOT NULL AND entidade_id = $2)
             OR
             ($3::int IS NOT NULL AND clinica_id = $3)
           )
         )
       ORDER BY criado_em DESC
       LIMIT 20`,
      [loteIdNum, lote.entidade_id ?? null, lote.clinica_id ?? null]
    );

    if (pagamentosResult.rows.length === 0) {
      console.log(
        `[SINCRONIZAR-LOTE] Nenhum pagamento candidato encontrado para Lote #${loteIdNum}`
      );
      return NextResponse.json({
        status_pagamento: lote.status_pagamento,
        synced: false,
        message: 'Nenhum pagamento com ID Asaas encontrado para este lote',
      });
    }

    console.log(
      `[SINCRONIZAR-LOTE] ${pagamentosResult.rows.length} pagamento(s) candidato(s) encontrado(s)`
    );

    // 3. Para cada pagamento candidato, consultar Asaas e verificar externalReference
    for (const pag of pagamentosResult.rows) {
      let asaasPayment: any;

      try {
        asaasPayment = await asaasClient.getPayment(pag.asaas_payment_id);
      } catch (err: any) {
        console.warn(
          `[SINCRONIZAR-LOTE] Erro ao consultar Asaas para ${pag.asaas_payment_id}:`,
          err.message
        );
        continue;
      }

      // Asaas pode retornar null/undefined para IDs inválidos
      if (!asaasPayment) {
        console.warn(
          `[SINCRONIZAR-LOTE] Asaas retornou resposta vazia para ${pag.asaas_payment_id} — ignorando`
        );
        continue;
      }

      // Verificar se o externalReference bate com ESTE lote
      const extRef: string | undefined = asaasPayment.externalReference;
      if (!extRef) {
        console.log(
          `[SINCRONIZAR-LOTE] Pagamento ${pag.asaas_payment_id} sem externalReference — ignorando`
        );
        continue;
      }

      const loteMatch = extRef.match(/^lote_(\d+)_pagamento_\d+$/);
      if (!loteMatch) {
        console.log(
          `[SINCRONIZAR-LOTE] externalReference "${extRef}" não é de lote — ignorando`
        );
        continue;
      }

      const extLoteId = parseInt(loteMatch[1], 10);
      if (extLoteId !== loteIdNum) {
        console.log(
          `[SINCRONIZAR-LOTE] externalReference aponta para Lote #${extLoteId}, não #${loteIdNum} — ignorando`
        );
        continue;
      }

      // O externalReference bate. Agora verificar status no Asaas.
      if (!isConfirmedStatus(asaasPayment.status)) {
        console.log(
          `[SINCRONIZAR-LOTE] Pagamento ${pag.asaas_payment_id} ainda não confirmado no Asaas (status: ${asaasPayment.status})`
        );
        continue;
      }

      // ✅ Pagamento confirmado no Asaas para ESTE lote
      const event = mapStatusToEvent(
        asaasPayment.status as AsaasConfirmedStatus
      );

      console.log(
        `[SINCRONIZAR-LOTE] ✅ Pagamento ${pag.asaas_payment_id} confirmado no Asaas (${asaasPayment.status}) para Lote #${loteIdNum} — ativando...`
      );

      // Verificar idempotência: se já processado E lote ainda pendente → falha parcial → forçar
      const alreadyLogged = await isWebhookAlreadyProcessed(
        pag.asaas_payment_id,
        event
      );

      if (alreadyLogged && pag.status === 'pago') {
        // Verificar se o lote ainda está pendente (situação de falha parcial anterior)
        const loteAtualResult = await query(
          `SELECT status_pagamento FROM lotes_avaliacao WHERE id = $1`,
          [loteIdNum]
        );
        const statusAtual = loteAtualResult.rows[0]?.status_pagamento;

        if (statusAtual === 'pago') {
          // Tudo já atualizado — nada a fazer
          return NextResponse.json({
            status_pagamento: 'pago',
            synced: false,
            message: 'Pagamento e lote já confirmados anteriormente',
          });
        }

        console.log(
          `[SINCRONIZAR-LOTE] ⚠️ Falha parcial detectada: webhook já logado mas lote ainda "${statusAtual}" — forçando re-ativação`
        );
      }

      // Montar payload no formato esperado por activateSubscription
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

      // Executar ativação (atualiza pagamentos + lotes_avaliacao)
      await activateSubscription(pag.asaas_payment_id, paymentPayload, event);

      // Registrar idempotência após o COMMIT
      await logWebhookProcessed(pag.asaas_payment_id, event, paymentPayload);

      console.log(
        `[SINCRONIZAR-LOTE] ✅ Lote #${loteIdNum} atualizado para "pago" via reconciliação`
      );

      return NextResponse.json({
        status_pagamento: 'pago',
        synced: true,
        asaas_payment_id: pag.asaas_payment_id,
        asaas_status: asaasPayment.status,
        message: 'Pagamento sincronizado e lote atualizado com sucesso',
      });
    }

    // Nenhum pagamento confirmado encontrado para este lote
    console.log(
      `[SINCRONIZAR-LOTE] Nenhum pagamento confirmado encontrado para Lote #${loteIdNum}`
    );

    return NextResponse.json({
      status_pagamento: lote.status_pagamento,
      synced: false,
      message: 'Pagamento ainda não confirmado no Asaas',
    });
  } catch (error: any) {
    console.error('[SINCRONIZAR-LOTE] Erro inesperado:', error);
    return NextResponse.json(
      {
        error: `Erro ao sincronizar lote: ${error.message}`,
        synced: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pagamento/asaas/sincronizar-lote?lote_id=X
 * Interface GET para facilitar chamadas de cron/health check.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lote_id = searchParams.get('lote_id');

  if (!lote_id) {
    return NextResponse.json(
      { error: 'lote_id é obrigatório' },
      { status: 400 }
    );
  }

  // Delega para o POST
  return POST(
    new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lote_id: parseInt(lote_id, 10) }),
    })
  );
}
