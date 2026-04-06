import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/laudos/[laudoId]/verify-hash
 * Retorna o hash SHA-256 armazenado no banco para o laudo solicitado.
 * Não lê arquivos locais nem recalcula hash — opera exclusivamente via DB.
 * O cliente pode comparar com o hash calculado localmente para verificar integridade.
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

    // Buscar laudo via lotes_avaliacao.entidade_id — consistente com /api/entidade/lotes
    // ISOLAMENTO: garante que lotes de clínicas nunca sejam acessados por entidades
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.hash_pdf,
        l.status,
        l.emitido_em
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1
        AND l.status IN ('emitido', 'enviado')
        AND la.entidade_id = $2
        AND la.clinica_id IS NULL
        AND la.empresa_id IS NULL
      LIMIT 1
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
          error:
            'Hash do laudo não disponível (laudo pode estar em processamento)',
          success: false,
        },
        { status: 404 }
      );
    }

    console.log(`[VERIFY] Hash armazenado para laudo ${laudo.id}: ${hashArmazenado}`);

    return NextResponse.json({
      success: true,
      hash_armazenado: hashArmazenado,
      laudo_id: laudo.id,
      lote_id: laudo.lote_id,
      emitido_em: laudo.emitido_em,
      status: laudo.status,
    });
  } catch (error: unknown) {
    console.error('[VERIFY] Erro ao verificar hash do laudo:', error);

    if (
      error instanceof Error &&
      (error.message.includes('Não autorizado') ||
        error.message.includes('Acesso negado') ||
        error.message.includes('Unauthorized'))
    ) {
      return NextResponse.json(
        { error: 'Acesso negado', success: false },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro interno do servidor',
        success: false,
      },
      { status: 500 }
    );
  }
};
