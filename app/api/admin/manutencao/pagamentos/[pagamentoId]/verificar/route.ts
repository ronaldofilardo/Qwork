import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { asaasClient } from '@/lib/asaas/client';

const ASAAS_CONFIRMED_STATUSES = ['CONFIRMED', 'RECEIVED', 'RECEIVED_IN_CASH'];

export async function POST(
  _request: Request,
  { params }: { params: { pagamentoId: string } }
) {
  try {
    await requireRole('suporte', false);
    const pagamentoId = parseInt(params.pagamentoId);

    if (isNaN(pagamentoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT p.id, p.status, p.asaas_payment_id, p.valor,
              COALESCE(e.nome, em.nome) as nome
       FROM pagamentos p
       LEFT JOIN entidades e ON p.entidade_id = e.id
       LEFT JOIN empresas_clientes em ON p.empresa_id = em.id
       WHERE p.id = $1 AND p.tipo_cobranca = 'manutencao'`,
      [pagamentoId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento de manutenção não encontrado' },
        { status: 404 }
      );
    }

    const pagamento = result.rows[0];

    if (pagamento.status === 'pago') {
      return NextResponse.json({
        status: 'pago',
        synced: false,
        message: 'Pagamento já confirmado',
      });
    }

    if (!pagamento.asaas_payment_id) {
      return NextResponse.json({
        status: pagamento.status,
        synced: false,
        message: 'Nenhuma cobrança Asaas registrada para este pagamento',
      });
    }

    let asaasPayment: any;
    try {
      asaasPayment = await asaasClient.getPayment(pagamento.asaas_payment_id);
    } catch (err: any) {
      console.error('[ERRO] verificar manutencao - Asaas:', err);
      return NextResponse.json(
        { error: 'Erro ao consultar Asaas' },
        { status: 502 }
      );
    }

    if (!asaasPayment) {
      return NextResponse.json({
        status: pagamento.status,
        synced: false,
        message: 'Cobrança não encontrada no Asaas',
      });
    }

    const isPago = ASAAS_CONFIRMED_STATUSES.includes(asaasPayment.status);

    if (isPago) {
      await query(
        `UPDATE pagamentos
         SET status = 'pago',
             data_pagamento = NOW(),
             atualizado_em = NOW()
         WHERE id = $1`,
        [pagamentoId]
      );

      console.log(
        `[INFO] Pagamento manutenção ${pagamentoId} confirmado via verificação manual. Asaas status: ${asaasPayment.status}`
      );

      return NextResponse.json({
        status: 'pago',
        synced: true,
        message: 'Pagamento confirmado com sucesso',
      });
    }

    return NextResponse.json({
      status: pagamento.status,
      synced: false,
      message: `Pagamento ainda não confirmado no Asaas (status: ${asaasPayment.status})`,
    });
  } catch (error: any) {
    console.error('[ERRO] manutencao/pagamentos/verificar:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
