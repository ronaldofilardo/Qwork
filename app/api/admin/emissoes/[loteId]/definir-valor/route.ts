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

    console.log(`[ADMIN] Definir valor - Lote ${loteId}:`, {
      status: lote.status,
      status_pagamento: lote.status_pagamento,
    });

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

    // Verificar se laudo já foi emitido (não deveria acontecer, mas verificar mesmo assim)
    const laudoCheck = await query(
      `SELECT id, status, hash_pdf, emitido_em FROM laudos WHERE lote_id = $1`,
      [loteId]
    );

    if (laudoCheck.rows.length > 0) {
      const laudo = laudoCheck.rows[0];
      console.log(`[ADMIN] Laudo existente encontrado:`, {
        laudo_id: laudo.id,
        status: laudo.status,
        tem_hash: !!laudo.hash_pdf,
        emitido_em: laudo.emitido_em,
      });

      if (laudo.status === 'emitido' || laudo.status === 'enviado') {
        return NextResponse.json(
          { error: 'Laudo já foi emitido para este lote' },
          { status: 400 }
        );
      }

      // Se tem laudo em rascunho mas sem emissor/hash, avisar mas permitir
      if (laudo.status === 'rascunho' && !laudo.hash_pdf) {
        console.warn(
          `[WARN] Lote ${loteId} tem laudo rascunho órfão (será recriado quando emissor gerar)`
        );
      }
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
