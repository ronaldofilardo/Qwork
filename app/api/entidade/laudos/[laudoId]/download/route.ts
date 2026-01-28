import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { lerLaudo } from '@/lib/storage/laudo-storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/laudos/[laudoId]/download
 * Download de laudo para entidades
 */
export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  try {
    const session = await requireEntity();
    const contratanteId = session.contratante_id;

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
        la.codigo,
        la.titulo,
        la.contratante_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 
        AND l.status = 'enviado'
        AND la.contratante_id = $2
    `,
      [laudoId, contratanteId]
    );

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado ou acesso negado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];

    // Usar storage manager que tenta local primeiro, depois Backblaze
    try {
      const fileBuffer = await lerLaudo(laudo.id);
      const fileName = `laudo-${laudo.codigo ?? laudo.id}.pdf`;

      return new NextResponse(new Uint8Array(fileBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    } catch (storageError) {
      console.error('[DOWNLOAD] Erro ao ler laudo do storage:', storageError);
      return NextResponse.json(
        {
          error: 'Arquivo PDF não disponível',
          success: false,
          detalhes:
            storageError instanceof Error
              ? storageError.message
              : 'Erro ao ler arquivo',
        },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Erro ao fazer download do laudo:', error);
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        success: false,
        detalhes: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
};
