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
    const entidadeId = session.entidade_id;

    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e verificar se pertence à entidade
    // Aceita status='emitido' (PDF gerado localmente) OU 'enviado' (PDF no bucket)
    // Validação via lotes_avaliacao.entidade_id — consistente com GET /api/entidade/lotes
    // ISOLAMENTO: garante que lotes de clínicas nunca sejam acessados por entidades
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.status,
        l.arquivo_remoto_provider,
        l.arquivo_remoto_bucket,
        l.arquivo_remoto_key,
        l.arquivo_remoto_url
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1
        AND l.status IN ('emitido', 'enviado')
        AND l.arquivo_remoto_url IS NOT NULL
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

    // ÚNICA PRIORIDADE: Usar arquivo_remoto_key do banco (armazenamento no Backblaze)
    // Em produção, os PDFs estão SEMPRE no Backblaze, nunca no filesystem
    if (!laudo.arquivo_remoto_key) {
      console.warn(
        `[WARN] Laudo ${laudoId} est\u00e1 com status='${laudo.status}' mas SEM arquivo_remoto_key no banco`
      );
      return NextResponse.json(
        {
          error:
            'Arquivo do laudo n\u00e3o foi enviado ao bucket ainda. Aguarde o emissor fazer upload.',
          success: false,
          status: 'awaiting_upload',
        },
        { status: 404 }
      );
    }

    console.log(
      `[BACKBLAZE] Arquivo remoto encontrado no banco: ${laudo.arquivo_remoto_key}`
    );

    try {
      const { getPresignedUrl } =
        await import('@/lib/storage/backblaze-client');
      const presignedUrl = await getPresignedUrl(laudo.arquivo_remoto_key, 300); // 5 min
      console.log(
        `[BACKBLAZE] Presigned URL gerada com sucesso para: ${laudo.arquivo_remoto_key}`
      );

      // SOLU\u00c7\u00c3O ROBUSTA: Fazer proxy do arquivo (server-side download)
      // Isso funciona em qualquer ambiente e evita problemas de CORS/redirect
      console.log(`[BACKBLAZE] Fazendo download server-side do PDF...`);
      const pdfResponse = await fetch(presignedUrl);

      if (!pdfResponse.ok) {
        let errorBody = '';
        try { errorBody = await pdfResponse.text(); } catch { /* ignore */ }
        console.error(
          `[BACKBLAZE] Erro ao baixar do Backblaze: ${pdfResponse.status} ${pdfResponse.statusText} — ${errorBody.slice(0, 200)}`
        );
        return NextResponse.json(
          {
            error: 'Erro ao acessar arquivo no storage',
            success: false,
            detalhes: `${pdfResponse.status} ${pdfResponse.statusText}`,
          },
          { status: 500 }
        );
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      console.log(
        `[BACKBLAZE] PDF baixado com sucesso (${pdfBuffer.byteLength} bytes)`
      );

      // Retornar PDF diretamente ao cliente
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="laudo-${laudo.id}.pdf"`,
          'Content-Length': pdfBuffer.byteLength.toString(),
          'Cache-Control': 'private, max-age=0',
        },
      });
    } catch (backblazeError) {
      console.error('[DOWNLOAD] Erro ao processar arquivo:', backblazeError);
      return NextResponse.json(
        {
          error: 'Erro ao acessar arquivo do laudo',
          success: false,
          detalhes:
            backblazeError instanceof Error
              ? backblazeError.message
              : 'Erro desconhecido ao processar Backblaze',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro ao fazer download do laudo:', error);

    // Tratar erros de autenticação/autorização como 403
    if (
      error instanceof Error &&
      (error.message.includes('Não autorizado') ||
        error.message.includes('Acesso negado') ||
        error.message.includes('Unauthorized'))
    ) {
      return NextResponse.json(
        {
          error: 'Acesso negado',
          success: false,
        },
        { status: 403 }
      );
    }

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
