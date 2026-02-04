import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const GET = async (
  req: Request,
  { params }: { params: { loteId: string } }
) => {
  const user = await requireRole('emissor');
  if (!user) {
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
    const laudoQuery = await query(
      `
      SELECT
        l.id,
        l.lote_id
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.lote_id = $1 AND l.emissor_cpf = $2 AND l.status IN ('enviado','emitido')
    `,
      [loteId, user.cpf]
    );

    let laudo;

    if (laudoQuery.rows.length === 0) {
      // Não há registro no DB, mas pode haver arquivo local
      // Buscar informações do lote para verificar permissão
      const loteQuery = await query(
        `SELECT id, titulo, emissor_cpf FROM lotes_avaliacao WHERE id = $1`,
        [loteId]
      );

      if (loteQuery.rows.length === 0) {
        return NextResponse.json(
          { error: 'Lote não encontrado', success: false },
          { status: 404 }
        );
      }

      const loteInfo = loteQuery.rows[0];

      // Validar que o emissor tem permissão (ou se não há emissor definido ainda, permitir)
      if (loteInfo.emissor_cpf && loteInfo.emissor_cpf !== user.cpf) {
        return NextResponse.json(
          {
            error: 'Acesso negado: laudo pertence a outro emissor',
            success: false,
          },
          { status: 403 }
        );
      }

      // Usar dados do lote como fallback
      laudo = {
        id: loteInfo.id,
        lote_id: loteInfo.id,
      };
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

    // Using local and public storage only.

    // Se não foi encontrado localmente, instruir uso de geração client-side
    // (Puppeteer/Chromium não funciona confiávelmente na Vercel Free/Pro)
    console.log(
      `[INFO] PDF não encontrado localmente para laudo ${loteId}. Retornando instrução para geração client-side.`
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
