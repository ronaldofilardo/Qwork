import { getSession, requireRHWithEmpresaAccess } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { laudoId: string } }
) => {
  const session = await Promise.resolve(getSession());
  if (!session || (session.perfil !== 'rh' && session.perfil !== 'emissor')) {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }
  const user = session;

  try {
    const laudoId = parseInt(params.laudoId);
    if (isNaN(laudoId)) {
      return NextResponse.json(
        { error: 'ID do laudo inválido', success: false },
        { status: 400 }
      );
    }

    // Buscar laudo e validar que está enviado ou emitido
    // Incluir metadados do arquivo remoto (Backblaze)
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.status,
        l.hash_pdf,
        l.arquivo_remoto_provider,
        l.arquivo_remoto_bucket,
        l.arquivo_remoto_key,
        l.arquivo_remoto_url,
        la.clinica_id,
        la.empresa_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.id = $1 AND l.status IN ('enviado', 'emitido')
    `,
      [laudoId]
    );

    if (laudoQuery.rows.length === 0) {
      console.warn(
        `[WARN] Laudo ${laudoId} não encontrado (ou não está 'enviado')`
      );
      return NextResponse.json(
        { error: 'Laudo não encontrado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];
    console.log(
      `[DEBUG] Laudo encontrado: id=${laudo.id}, lote_id=${laudo.lote_id}, status=${laudo.status}`
    );

    // Verificar se o usuário tem acesso ao laudo
    // Emissor e RH (com acesso à empresa) podem acessar
    if (user.perfil === 'emissor') {
      // Emissor pode acessar conforme RLS/roles
    } else if (user.perfil === 'rh') {
      try {
        await requireRHWithEmpresaAccess(Number(laudo.empresa_id));
      } catch {
        console.warn(
          `[WARN] Acesso negado ao laudo ${laudoId} para RH ${user.cpf}`
        );
        return NextResponse.json(
          {
            error: 'Você não tem permissão para acessar este laudo',
            success: false,
          },
          { status: 403 }
        );
      }
    } else {
      // Outros perfis não têm acesso aqui (admin NÃO tem acesso operacional)
      return NextResponse.json(
        { error: 'Acesso negado ao laudo', success: false },
        { status: 403 }
      );
    }

    // ÚNICA PRIORIDADE: Usar arquivo_remoto_key do banco (armazenamento no Backblaze)
    // Em produção, os PDFs estão SEMPRE no Backblaze, nunca no filesystem
    if (!laudo.arquivo_remoto_key) {
      console.warn(
        `[WARN] Laudo ${laudoId} está com status='emitido' mas SEM arquivo_remoto_key no banco`
      );
      return NextResponse.json(
        {
          error:
            'Arquivo do laudo não foi enviado ao bucket ainda. Aguarde o emissor fazer upload.',
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
      const { getPresignedUrl } = await import('@/lib/storage/backblaze-client');
      const presignedUrl = await getPresignedUrl(laudo.arquivo_remoto_key, 300); // 5 min
      console.log(
        `[BACKBLAZE] Presigned URL gerada com sucesso para: ${laudo.arquivo_remoto_key}`
      );

      // SOLUÇÃO ROBUSTA: Fazer proxy do arquivo (server-side download)
      // Isso funciona em qualquer ambiente e evita problemas de CORS/redirect
      console.log(`[BACKBLAZE] Fazendo download server-side do PDF...`);
      const pdfResponse = await fetch(presignedUrl);
      
      if (!pdfResponse.ok) {
        console.error(`[BACKBLAZE] Erro ao baixar do Backblaze: ${pdfResponse.status} ${pdfResponse.statusText}`);
        return NextResponse.json(
          { error: 'Erro ao acessar arquivo no storage', success: false },
          { status: 500 }
        );
      }

      const pdfBuffer = await pdfResponse.arrayBuffer();
      console.log(`[BACKBLAZE] PDF baixado com sucesso (${pdfBuffer.byteLength} bytes)`);

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
      console.error(
        '[BACKBLAZE] Erro ao processar arquivo:',
        backblazeError
      );
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
