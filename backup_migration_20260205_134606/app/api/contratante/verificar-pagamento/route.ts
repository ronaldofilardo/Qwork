import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/contratante/verificar-pagamento?contratante_id=X
 *
 * Verifica o status de pagamento de um contratante
 * Retorna informações sobre pagamentos pendentes e links de retry
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contratanteId = searchParams.get('contratante_id');

    if (!contratanteId) {
      return NextResponse.json(
        { error: 'contratante_id é obrigatório' },
        { status: 400 }
      );
    }

    // Verificar dados do contratante e pagamentos
    const result = await query(
      `SELECT 
        c.id,
        c.nome,
        c.cnpj,
        c.email,
        c.status,
        c.ativa,
        c.pagamento_confirmado,
        c.contrato_aceito,
        cont.id as contrato_id,
        cont.status as contrato_status,
        cont.valor_total as contrato_valor,
        cont.numero_funcionarios,
        cont.plano_id,
        pl.nome as plano_nome,
        pl.tipo as plano_tipo,
        pl.preco as plano_preco,
        p.id as pagamento_id,
        p.status as pagamento_status,
        p.data_pagamento,
        p.metodo as pagamento_metodo,
        p.numero_parcelas,
        p.valor as pagamento_valor
      FROM contratantes c
      LEFT JOIN contratos cont ON cont.contratante_id = c.id
      LEFT JOIN planos pl ON pl.id = cont.plano_id
      LEFT JOIN pagamentos p ON p.contratante_id = c.id
      WHERE c.id = $1
      ORDER BY p.data_pagamento DESC
      LIMIT 1`,
      [contratanteId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    const data = result.rows[0];

    // Verificar se tem pagamento confirmado
    const hasPagamento = data.pagamento_confirmado === true;
    const hasContratoAtivo =
      data.contrato_status === 'aprovado' ||
      data.contrato_status === 'payment_paid';
    const statusContratante = data.status;

    // Determinar se precisa de pagamento
    const needsPayment =
      !hasPagamento ||
      statusContratante === 'pendente_pagamento' ||
      statusContratante === 'pagamento_pendente';

    // Gerar link de pagamento se necessário
    let paymentLink = null;
    if (needsPayment && data.contrato_id) {
      paymentLink = `/pagamento/simulador?contratante_id=${contratanteId}&contrato_id=${data.contrato_id}&retry=true`;
    }

    return NextResponse.json({
      success: true,
      contratante: {
        id: data.id,
        nome: data.nome,
        cnpj: data.cnpj,
        email: data.email,
        status: statusContratante,
        ativa: data.ativa,
        pagamento_confirmado: hasPagamento,
        contrato_aceito: data.contrato_aceito,
      },
      contrato: data.contrato_id
        ? {
            id: data.contrato_id,
            status: data.contrato_status,
            valor_total: data.contrato_valor,
            numero_funcionarios: data.numero_funcionarios,
            plano: {
              id: data.plano_id,
              nome: data.plano_nome,
              tipo: data.plano_tipo,
              preco: data.plano_preco,
            },
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
      access_granted: hasPagamento && hasContratoAtivo,
      message: needsPayment
        ? 'Pagamento pendente. Complete o pagamento para ter acesso ao sistema.'
        : 'Pagamento confirmado. Acesso liberado.',
    });
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao verificar pagamento',
      },
      { status: 500 }
    );
  }
}
