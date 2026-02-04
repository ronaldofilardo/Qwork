import { requireEntity } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

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
        la.contratante_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 
        AND l.status IN ('enviado', 'emitido')
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
    // Modificado: em vez de fazer stream do buffer, redirecionar para presigned URL quando remoto
    try {
      // Tentar local primeiro
      const fs = await import('fs/promises');
      const path = await import('path');
      const localPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudo.id}.pdf`
      );

      try {
        const buffer = await fs.readFile(localPath);
        const fileName = `laudo-${laudo.id}.pdf`;
        console.log(`[DOWNLOAD] Servindo laudo ${laudo.id} do storage local`);
        return new NextResponse(new Uint8Array(buffer), {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=\"${fileName}\"`,
          },
        });
      } catch {
        console.warn(
          `[DOWNLOAD] Arquivo local n\u00e3o encontrado para laudo ${laudo.id}, tentando Backblaze...`
        );
      }

      // Tentar Backblaze via metadata ou discovery
      const metaPath = path.join(
        process.cwd(),
        'storage',
        'laudos',
        `laudo-${laudo.id}.json`
      );

      let remoteKey: string | null = null;

      // Tentar ler metadata primeiro
      try {
        const metaRaw = await fs.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(metaRaw);
        if (meta.arquivo_remoto?.key) {
          remoteKey = meta.arquivo_remoto.key;
          console.log(
            `[DOWNLOAD] Chave remota encontrada nos metadados: ${remoteKey}`
          );
        }
      } catch {
        console.warn(
          `[DOWNLOAD] Metadados n\u00e3o encontrados para laudo ${laudo.id}, tentando discovery...`
        );
        // Discovery: buscar \u00faltimo arquivo no lote
        const { findLatestLaudoForLote } =
          await import('@/lib/storage/backblaze-client');
        remoteKey = await findLatestLaudoForLote(laudo.lote_id);
        if (remoteKey) {
          console.log(
            `[DOWNLOAD] Objeto remoto descoberto via helper: ${remoteKey}`
          );
        }
      }

      // Se encontramos chave remota, redirecionar para presigned URL
      if (remoteKey) {
        const { getPresignedUrl } =
          await import('@/lib/storage/backblaze-client');
        const presignedUrl = await getPresignedUrl(remoteKey, 900); // 15 min
        console.log(
          `[DOWNLOAD] Redirecionando para presigned URL (laudo ${laudo.id})`
        );
        return NextResponse.redirect(presignedUrl, 302);
      }

      // Se n\u00e3o encontramos em lugar nenhum
      console.error(
        `[DOWNLOAD] Laudo ${laudo.id} n\u00e3o encontrado em storage local nem Backblaze`
      );
      return NextResponse.json(
        {
          error: 'Arquivo PDF n\u00e3o dispon\u00edvel',
          success: false,
        },
        { status: 404 }
      );
    } catch (storageError) {
      console.error('[DOWNLOAD] Erro ao ler laudo do storage:', storageError);
      return NextResponse.json(
        {
          error: 'Arquivo PDF n\u00e3o dispon\u00edvel',
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
