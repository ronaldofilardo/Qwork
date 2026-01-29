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
        l.lote_id,
        la.codigo,
        la.titulo
      FROM laudos l
      JOIN lotes_avaliacao la ON l.lote_id = la.id
      WHERE l.lote_id = $1 AND l.emissor_cpf = $2 AND l.status IN ('enviado','emitido')
    `,
      [loteId, user.cpf]
    );

    if (laudoQuery.rows.length === 0) {
      return NextResponse.json(
        { error: 'Laudo não encontrado ou acesso negado', success: false },
        { status: 404 }
      );
    }

    const laudo = laudoQuery.rows[0];

    // Tentar múltiplas chaves (id, codigo, lote)
    const fs = await import('fs/promises');
    const path = await import('path');

    const names = new Set<string>();
    names.add(`laudo-${laudo.id}.pdf`);
    if (laudo.codigo) names.add(`laudo-${laudo.codigo}.pdf`);
    if (laudo.lote_id) names.add(`laudo-${laudo.lote_id}.pdf`);

    // 1) tentar storage/local
    for (const name of names) {
      try {
        const p = path.join(process.cwd(), 'storage', 'laudos', name);
        const fileBuffer = await fs.readFile(p);
        const fileName = `laudo-${laudo.codigo ?? laudo.id}.pdf`;
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

    // Se não foi encontrado localmente, tentar gerar o PDF on-demand via rota de PDF
    try {
      const { GET: gerarPDF } = await import('../pdf/route');
      console.log(
        `[DEBUG] Arquivo não encontrado localmente para laudo ${loteId}; acionando geração on-demand via /pdf`
      );
      return await gerarPDF(req, { params: { loteId: String(loteId) } });
    } catch (err) {
      console.warn(
        `[WARN] Falha ao gerar PDF on-demand para laudo ${loteId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    // Not found
    return NextResponse.json(
      { error: 'Arquivo do laudo não encontrado', success: false },
      { status: 404 }
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
