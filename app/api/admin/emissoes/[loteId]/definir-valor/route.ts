import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireRole('admin');
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { valor_por_funcionario } = body;

    if (!valor_por_funcionario || valor_por_funcionario <= 0) {
      return NextResponse.json(
        { error: 'Valor deve ser maior que zero' },
        { status: 400 }
      );
    }

    const loteCheck = await query(
      `SELECT id, status, status_pagamento FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );

    if (loteCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteCheck.rows[0];

    if (lote.status !== 'concluido') {
      return NextResponse.json(
        { error: 'Lote deve estar concluído' },
        { status: 400 }
      );
    }

    if (lote.status_pagamento !== 'aguardando_cobranca') {
      return NextResponse.json(
        { error: 'Valor já foi definido' },
        { status: 400 }
      );
    }

    const updateResult = await query(
      `UPDATE lotes_avaliacao
       SET valor_por_funcionario = $1, atualizado_em = NOW()
       WHERE id = $2
       RETURNING id, valor_por_funcionario`,
      [valor_por_funcionario, loteId]
    );

    console.log(
      `[INFO] Admin ${user.cpf} definiu R$ ${valor_por_funcionario} para lote ${loteId}`
    );

    return NextResponse.json({
      success: true,
      lote_id: loteId,
      valor_por_funcionario: updateResult.rows[0].valor_por_funcionario,
    });
  } catch (error: any) {
    console.error('[ERRO] definir-valor:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao definir valor' },
      { status: error.status || 500 }
    );
  }
}
