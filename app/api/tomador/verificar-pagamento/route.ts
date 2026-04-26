import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { rateLimitAsync, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tomador/verificar-pagamento?tomador_id=X
 *
 * Verifica o status de pagamento de um tomador (entidade/clínica)
 * Retorna informações sobre pagamentos pendentes e links de retry
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimitAsync(request, RATE_LIMIT_CONFIGS.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = request.nextUrl;
    const tomadorId = searchParams.get('tomador_id');

    if (!tomadorId) {
      return NextResponse.json(
        { error: 'tomador_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar dados do tomador e pagamentos
    const result = await query(
      `SELECT 
        COALESCE(ct.id, cl.id) as id,
        COALESCE(ct.nome, cl.nome) as nome,
        COALESCE(ct.cnpj, cl.cnpj) as cnpj,
        COALESCE(ct.email, cl.email) as email,
        COALESCE(ct.status, cl.status) as status,
        COALESCE(ct.ativa, cl.ativa) as ativa,
        cont.id as contrato_id,
        cont.status as contrato_status,
        cont.valor_total as contrato_valor,
        cont.numero_funcionarios,
        p.id as pagamento_id,
        p.status as pagamento_status,
        p.data_pagamento,
        p.metodo as pagamento_metodo,
        p.numero_parcelas,
        p.valor as pagamento_valor
      FROM (
        SELECT $1::bigint AS tomador_id, 'entidade' as tipo
        UNION ALL
        SELECT $1::bigint AS tomador_id, 'clinica' as tipo
      ) AS source
      LEFT JOIN entidades ct ON ct.id = source.tomador_id AND source.tipo = 'entidade'
      LEFT JOIN clinicas cl ON cl.id = source.tomador_id AND source.tipo = 'clinica'
      LEFT JOIN contratos cont ON (
        cont.tomador_id = source.tomador_id
        OR cont.entidade_id = source.tomador_id
      )
      LEFT JOIN pagamentos p ON (
        (source.tipo = 'entidade' AND p.entidade_id = source.tomador_id) OR
        (source.tipo = 'clinica' AND p.clinica_id = source.tomador_id)
      )
      WHERE ct.id = $1 OR cl.id = $1
      ORDER BY p.data_pagamento DESC
      LIMIT 1`,
      [tomadorId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const data = result.rows[0];

    const hasContratoAtivo =
      data.contrato_status === 'aprovado' ||
      data.contrato_status === 'payment_paid';
    const statusTomador = data.status;

    // Sem coluna pagamento_confirmado — verificar pagamento pelo status do tomador e contrato
    const needsPayment =
      statusTomador === 'pendente_pagamento' ||
      statusTomador === 'pagamento_pendente' ||
      statusTomador === 'aguardando_pagamento';

    // Gerar link de pagamento se necessário
    let paymentLink = null;
    if (needsPayment && data.contrato_id) {
      paymentLink = `/pagamento/simulador?tomador_id=${tomadorId}&contrato_id=${data.contrato_id}&retry=true`;
    }

    return NextResponse.json({
      success: true,
      tomador: {
        id: data.id,
        nome: data.nome,
        status: statusTomador,
        ativa: data.ativa,
      },
      contrato: data.contrato_id
        ? {
            id: data.contrato_id,
            status: data.contrato_status,
            valor_total: data.contrato_valor,
            numero_funcionarios: data.numero_funcionarios,
          }
        : null,
      pagamento: data.pagamento_id
        ? {
            id: data.pagamento_id,
            status: data.pagamento_status,
            data: data.data_pagamento,
            metodo: data.pagamento_metodo,
            numero_parcelas: data.numero_parcelas,
            valor: data.pagamento_valor,
          }
        : null,
      needs_payment: needsPayment,
      payment_link: paymentLink,
      access_granted: hasContratoAtivo,
      message: needsPayment
        ? 'Pagamento pendente. Complete o pagamento para ter acesso ao sistema.'
        : 'Acesso liberado.',
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar pagamento' },
      { status: 500 }
    );
  }
}
