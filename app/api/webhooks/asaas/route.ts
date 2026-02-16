// app/api/webhooks/asaas/route.ts
// Endpoint de webhook para receber notificações do Asaas Payment Gateway

import { NextRequest, NextResponse } from 'next/server';
import {
  validateWebhookSignature,
  handlePaymentWebhook,
} from '@/lib/asaas/webhook-handler';
import type { AsaasWebhookPayload } from '@/lib/asaas/types';

/**
 * Rate limiting simples (em memória)
 * Em produção, use Redis ou similar
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // máximo de requests
const RATE_WINDOW = 60 * 1000; // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetAt) {
    requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * POST /api/webhooks/asaas
 * Recebe notificações de eventos de pagamento do Asaas
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Obter IP do cliente
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    // 2. Verificar rate limiting
    if (!checkRateLimit(ip)) {
      console.warn(`[Asaas Webhook] Rate limit excedido para IP: ${ip}`);
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 3. Validar assinatura do webhook (segurança)
    if (!validateWebhookSignature(request)) {
      console.error(
        '[Asaas Webhook] Assinatura inválida. Possível tentativa de fraude.'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Parse do payload JSON
    let payload: AsaasWebhookPayload;
    try {
      payload = await request.json();
    } catch (error) {
      console.error('[Asaas Webhook] Erro ao fazer parse do JSON:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // 5. Validar estrutura básica do payload
    if (!payload.event || !payload.payment || !payload.payment.id) {
      console.error('[Asaas Webhook] Payload inválido:', payload);
      return NextResponse.json(
        { error: 'Invalid payload structure' },
        { status: 400 }
      );
    }

    console.log(`[Asaas Webhook] Recebido de ${ip}:`, {
      event: payload.event,
      paymentId: payload.payment.id,
      status: payload.payment.status,
      billingType: payload.payment.billingType,
      value: payload.payment.value,
    });

    // Debug: Log do payload completo para diagnosticar
    console.log(
      '[Asaas Webhook] Payload completo:',
      JSON.stringify(payload, null, 2)
    );

    // 6. Processar o webhook de forma assíncrona
    // Importante: Respondemos RAPIDAMENTE (< 30s) para não causar timeout no Asaas
    // O processamento real acontece em background

    // Para desenvolvimento, processamos de forma síncrona para facilitar debug
    // Em produção, considere usar fila (Bull, BullMQ, SQS, etc)
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
      // Modo dev: processa de forma síncrona (mais fácil de debugar)
      console.log(
        '[Asaas Webhook] Processando webhook de forma SÍNCRONA (development)'
      );
      try {
        await handlePaymentWebhook(payload);
        console.log('[Asaas Webhook] ✅ Webhook processado com sucesso');
      } catch (error: any) {
        console.error('[Asaas Webhook] ❌ Erro ao processar webhook:', error);
      }
    } else {
      // Modo produção: processa de forma assíncrona (não bloqueia resposta)
      console.log(
        '[Asaas Webhook] Processando webhook de forma ASSÍNCRONA (production)'
      );
      handlePaymentWebhook(payload).catch((error) => {
        console.error(
          '[Asaas Webhook] Erro no processamento assíncrono:',
          error
        );
        // Em produção, você deve registrar este erro em um sistema de monitoramento
        // Ex: Sentry, Datadog, CloudWatch, etc.
      });
    }

    const duration = Date.now() - startTime;
    console.log(`[Asaas Webhook] Resposta enviada em ${duration}ms`);

    // 7. Responder sempre com sucesso (200) para evitar retries desnecessários
    // Mesmo que haja erro no processamento, o Asaas não precisa reenviar
    return NextResponse.json(
      {
        received: true,
        event: payload.event,
        paymentId: payload.payment.id,
        processedIn: `${duration}ms`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Asaas Webhook] Erro não tratado:', error);

    // Mesmo com erro, retornamos 200 para evitar retry loops infinitos
    // O erro foi logado e pode ser investigado manualmente
    return NextResponse.json(
      {
        received: true,
        error: 'Internal processing error (logged)',
      },
      { status: 200 }
    );
  }
}

/**
 * GET /api/webhooks/asaas
 * Endpoint de health check (não usado pelo Asaas, apenas para testes)
 */
export function GET() {
  return NextResponse.json({
    service: 'Asaas Webhook Handler',
    status: 'online',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    webhookSecretConfigured: !!process.env.ASAAS_WEBHOOK_SECRET,
  });
}

/**
 * Configuração do runtime do Next.js
 * nodejs: permite uso de bibliotecas Node.js completas (pg, etc)
 */
export const runtime = 'nodejs';

/**
 * Desabilitar cache desta rota (webhooks devem ser sempre processados)
 */
export const dynamic = 'force-dynamic';
