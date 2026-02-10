import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/laudos/[laudoId]/verify-hash
 * Retorna o hash armazenado do laudo (já foi calculado e validado quando emitido)
 * Não recalcula hash do arquivo - isso foi feito no momento da emissão
 */
export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e verificar se pertence à entidade
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.hash_pdf,
        l.status,
        l.emitido_em,
        la.entidade_id,
        la.clinica_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 
        AND l.status IN ('enviado', 'emitido')
        AND la.entidade_id = $2
    `,
      [laudoId, entidadeId]
    );

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado ou acesso negado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];
    const hashArmazenado = laudo.hash_pdf;

    if (!hashArmazenado) {
      return NextResponse.json(
        {
          error: 'Hash do laudo não disponível (laudo pode estar em processamento)',
          success: false,
        },
        { status: 404 }
      );
    }

    // Retornar hash armazenado (já foi calculado e validado quando o laudo foi emitido)
    console.log(`[VERIFY] Retornando hash armazenado para laudo ${laudo.id}`);

    return NextResponse.json({
      success: true,
      hash_armazenado: hashArmazenado,
      laudo_id: laudo.id,
      lote_id: laudo.lote_id,
      emitido_em: laudo.emitido_em,
      status: laudo.status,
    });
  } catch (error: any) {
    console.error('Erro ao buscar hash do laudo:', error);
    return NextResponse.json(
      {
        error: error.message || 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
};
      },
      { status: 500 }
    );
  }
};
