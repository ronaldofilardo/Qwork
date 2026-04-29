import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireRole(['admin', 'suporte']);

    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const loteResult = await query(
      `SELECT id, status_pagamento FROM lotes_avaliacao WHERE id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];
    if (lote.status_pagamento !== 'aguardando_cobranca') {
      return NextResponse.json(
        {
          error:
            'Só é possível cancelar cobrança de lotes com status "aguardando_cobranca"',
        },
        { status: 400 }
      );
    }

    await query(
      `UPDATE lotes_avaliacao
       SET status_pagamento = NULL,
           solicitacao_emissao_em = NULL,
           atualizado_em = NOW()
       WHERE id = $1`,
      [loteId]
    );

    const cpfMascarado = user.cpf
      ? user.cpf.replace(/(\d{3})\d{6}(\d{2})/, '$1******$2')
      : 'desconhecido';
    console.log(
      `[INFO] Usuário ${cpfMascarado} cancelou cobrança do lote ${loteId} — retornou para pré-emissão`
    );

    return NextResponse.json({ success: true, lote_id: loteId });
  } catch (error: unknown) {
    console.error('[ERRO] cancelar-cobranca:', error);
    const err = error as { message?: string; status?: number };
    return NextResponse.json(
      { error: err.message ?? 'Erro interno' },
      { status: err.status ?? 500 }
    );
  }
}
