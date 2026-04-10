import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { randomUUID } from 'crypto';

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
      `SELECT p.id, p.status, p.valor, p.tipo_cobranca,
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
      return NextResponse.json(
        { error: 'Pagamento já confirmado' },
        { status: 400 }
      );
    }

    const token = randomUUID();

    await query(
      `UPDATE pagamentos
       SET link_pagamento_token = $1,
           link_pagamento_enviado_em = NOW(),
           status = 'aguardando_pagamento',
           atualizado_em = NOW()
       WHERE id = $2`,
      [token, pagamentoId]
    );

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const linkPagamento = `${baseUrl}/pagamento/manutencao/${token}`;

    return NextResponse.json({
      success: true,
      pagamento_id: pagamentoId,
      token,
      link_pagamento: linkPagamento,
      valor: parseFloat(pagamento.valor),
      nome: pagamento.nome,
    });
  } catch (error: any) {
    console.error('[ERRO] manutencao/pagamentos/gerar-link:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
