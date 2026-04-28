import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

const METODOS_VALIDOS = [
  'pix',
  'boleto',
  'credit_card',
  'cartao',
  'transferencia',
  'isento',
] as const;

export async function POST(
  request: Request,
  { params }: { params: { loteId: string } }
) {
  try {
    const user = await requireRole(['admin', 'suporte']);
    const loteId = parseInt(params.loteId);

    if (isNaN(loteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const body = await request.json();
    const { metodo_pagamento, num_parcelas } = body;

    if (!metodo_pagamento) {
      return NextResponse.json(
        { error: 'Método de pagamento é obrigatório' },
        { status: 400 }
      );
    }

    if (!METODOS_VALIDOS.includes(metodo_pagamento)) {
      return NextResponse.json(
        { error: `Método inválido. Use: ${METODOS_VALIDOS.join(', ')}` },
        { status: 400 }
      );
    }

    const parcelas = parseInt(num_parcelas ?? '1', 10);
    if (isNaN(parcelas) || parcelas < 1 || parcelas > 12) {
      return NextResponse.json(
        { error: 'Número de parcelas inválido (1–12)' },
        { status: 400 }
      );
    }

    const loteResult = await query(
      `SELECT la.id, la.status_pagamento, la.clinica_id, la.entidade_id,
              COALESCE(c.isento_pagamento, e.isento_pagamento, false) AS isento_pagamento
       FROM lotes_avaliacao la
       LEFT JOIN clinicas c ON c.id = la.clinica_id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       WHERE la.id = $1`,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    if (lote.isento_pagamento === true && metodo_pagamento !== 'isento') {
      return NextResponse.json(
        { error: 'Tomador é isento de pagamento. Use o método "isento".' },
        { status: 400 }
      );
    }

    if (lote.status_pagamento === 'pago') {
      return NextResponse.json(
        { error: 'Lote já está com pagamento confirmado' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE lotes_avaliacao
       SET status_pagamento    = 'pago',
           pagamento_metodo    = $1,
           pagamento_parcelas  = $2,
           pago_em             = NOW(),
           atualizado_em       = NOW()
       WHERE id = $3`,
      [metodo_pagamento, parcelas, loteId]
    );

    console.log(
      `[INFO] Pagamento confirmado manualmente: lote ${loteId} por ${user.perfil} ${user.cpf} — ${metodo_pagamento} ${parcelas}x`
    );

    return NextResponse.json({
      success: true,
      lote_id: loteId,
      message: 'Pagamento confirmado com sucesso',
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Erro interno';
    console.error('[ERRO] confirmar-pagamento:', error);
    if (msg === 'Sem permissão') {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
