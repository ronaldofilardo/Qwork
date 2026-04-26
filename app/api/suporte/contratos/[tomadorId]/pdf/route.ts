/**
 * GET /api/suporte/contratos/[tomadorId]/pdf
 * Gera o PDF do contrato de um tomador específico para o perfil suporte.
 * Query param obrigatório: ?tipo=clinica|entidade
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import {
  buscarDadosTomador,
  gerarPdfContrato,
  TipoTomador,
} from '@/lib/tomador/gerar-contrato-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { tomadorId: string } }
) {
  try {
    await requireRole(['suporte', 'admin'], false);

    const tomadorId = parseInt(params.tomadorId);
    if (isNaN(tomadorId)) {
      return NextResponse.json(
        { error: 'ID do tomador inválido' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tipoParam = searchParams.get('tipo');
    if (tipoParam !== 'clinica' && tipoParam !== 'entidade') {
      return NextResponse.json(
        { error: 'Parâmetro tipo inválido (use clinica ou entidade)' },
        { status: 400 }
      );
    }
    const tipo = tipoParam as TipoTomador;

    const dados = await buscarDadosTomador(tomadorId, tipo);
    if (!dados) {
      return NextResponse.json(
        { error: 'Contrato aceito não encontrado' },
        { status: 404 }
      );
    }

    const pdfBuffer = gerarPdfContrato(dados.tomadorData, dados.contrato);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="contrato-${tomadorId}.pdf"`,
      },
    });
  } catch (error: unknown) {
    const e = error as Error;
    if (
      e.message === 'Não autenticado' ||
      e.message === 'Sem permissão' ||
      e.message.startsWith('Acesso restrito')
    ) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    console.error('[GET /api/suporte/contratos/[tomadorId]/pdf]', e);
    return NextResponse.json(
      { error: 'Erro ao gerar contrato PDF' },
      { status: 500 }
    );
  }
}
