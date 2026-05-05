import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  let user;
  try {
    user = await requireRole('emissor');
  } catch {
    return NextResponse.json(
      { error: 'Acesso negado', success: false },
      { status: 403 }
    );
  }

  try {
    const loteId = parseInt(params.loteId);
    if (isNaN(loteId)) {
      return NextResponse.json(
        { error: 'ID do lote inválido', success: false },
        { status: 400 }
      );
    }

    // Verificar se o laudo existe e pertence ao emissor
    // ✅ EMISSOR: Permite download de laudos gerados ou emitidos/enviados
    // Inclui status ZapSign (pdf_gerado, aguardando_assinatura) para permitir
    // download pré-assinatura quando necessário
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id,
        l.status,
        l.arquivo_remoto_key
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.lote_id = $1 
        AND l.emissor_cpf = $2 
        AND l.status IN ('pdf_gerado', 'aguardando_assinatura', 'assinado_processando', 'emitido', 'enviado')
    `,
      [loteId, user.cpf],
      user
    );

    let laudo;

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado', success: false },
        { status: 404 }
      );
    } else {
      laudo = laudoQuery.rows[0];
    }

    // Tentar múltiplas chaves (id, codigo, lote)
    const fs = await import('fs/promises');
    const path = await import('path');

    const names = new Set<string>();
    names.add(`laudo-${laudo.id}.pdf`);
    if (laudo.lote_id) names.add(`laudo-${laudo.lote_id}.pdf`);

    // 1) tentar storage/local
    for (const name of names) {
      try {
        const p = path.join(process.cwd(), 'storage', 'laudos', name);
        const fileBuffer = await fs.readFile(p);
        const fileName = `laudo-${laudo.id}.pdf`;
        console.log(`[INFO] Servindo arquivo local de laudo: ${p}`);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${fileName}"`,
          },
        });
      } catch {
        // continuar tentando
      }
    }

    // 2) Laudo assinado via ZapSign — arquivo final (com página de evidências) está no Backblaze
    if (
      laudo.arquivo_remoto_key &&
      ['emitido', 'enviado', 'assinado_processando'].includes(laudo.status)
    ) {
      console.log(
        `[INFO] Servindo laudo assinado do Backblaze: ${laudo.arquivo_remoto_key}`
      );
      const { getPresignedUrl } = await import(
        '@/lib/storage/backblaze-client'
      );
      const presignedUrl = await getPresignedUrl(laudo.arquivo_remoto_key, 300);
      const pdfResponse = await fetch(presignedUrl);
      if (!pdfResponse.ok) {
        console.error(
          `[ERROR] Falha ao baixar PDF assinado do Backblaze: ${pdfResponse.status}`
        );
        return NextResponse.json(
          { error: 'Falha ao baixar PDF assinado', success: false },
          { status: 502 }
        );
      }
      const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="laudo-${laudo.id}.pdf"`,
        },
      });
    }

    // 3) Fallback: instruir geração client-side para laudos sem arquivo remoto (pdf_gerado, aguardando_assinatura)
    console.log(
      `[INFO] PDF não encontrado para laudo ${loteId}. Retornando instrução para geração client-side.`
    );
    return NextResponse.json(
      {
        success: false,
        useClientSide: true,
        error: 'PDF não disponível no servidor. Use geração no navegador.',
        message:
          'Por favor, use o botão "Visualizar Laudo" e depois "Baixar PDF" para gerar o PDF no seu navegador.',
        htmlEndpoint: `/api/emissor/laudos/${loteId}/html`,
        loteId: loteId,
      },
      { status: 200 }
    );
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
