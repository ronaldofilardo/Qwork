import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireRole('suporte', false);
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

    if (lote.status_pagamento !== 'aguardando_pagamento') {
      return NextResponse.json(
        {
          error:
            'Só é possível deletar o link de lotes com status "aguardando_pagamento"',
        },
        { status: 400 }
      );
    }

    await query(
      `UPDATE lotes_avaliacao
       SET link_pagamento_token      = NULL,
           link_pagamento_enviado_em = NULL,
           link_disponibilizado_em   = NULL,
           status_pagamento          = 'aguardando_cobranca',
           atualizado_em             = NOW()
       WHERE id = $1`,
      [loteId]
    );

    console.log(
      `[INFO] Suporte ${user.cpf} deletou link do lote ${loteId} — retornou para aguardando_cobranca`
    );

    return NextResponse.json({ success: true, lote_id: loteId });
  } catch (error: any) {
    console.error('[ERRO] deletar-link:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.status || 500 }
    );
  }
}
