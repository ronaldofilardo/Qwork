/**
 * GET /api/tomador/contrato-pdf
 * Gera e retorna o contrato aceito pelo tomador (entidade ou clínica) em PDF.
 * Aceita perfis: 'gestor' (entidade) e 'rh' (clínica).
 */
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/session';
import { buscarDadosTomador, gerarPdfContrato, TipoTomador } from '@/lib/tomador/gerar-contrato-pdf';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireRole(['gestor', 'rh']);

    let tomadorId: number | null = null;
    let tipo: TipoTomador = 'entidade';

    if (session.perfil === 'gestor') {
      if (!session.entidade_id) {
        return NextResponse.json({ error: 'Entidade não identificada na sessão' }, { status: 403 });
      }
      tomadorId = session.entidade_id;
      tipo = 'entidade';
    } else {
      // rh
      const clinicaId = session.clinica_id;
      const entidadeId = session.entidade_id;
      if (!clinicaId && !entidadeId) {
        return NextResponse.json({ error: 'Clínica não identificada na sessão' }, { status: 403 });
      }
      if (clinicaId) {
        tomadorId = clinicaId;
        tipo = 'clinica';
      } else {
        tomadorId = entidadeId!;
        tipo = 'entidade';
      }
    }

    if (!tomadorId) {
      return NextResponse.json({ error: 'Tomador não identificado' }, { status: 403 });
    }

    const dados = await buscarDadosTomador(tomadorId, tipo);
    if (!dados) {
      return NextResponse.json({ error: 'Contrato aceito não encontrado' }, { status: 404 });
    }

    const pdfBuffer = gerarPdfContrato(dados.tomadorData, dados.contrato);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="contrato-qwork.pdf"',
      },
    });
  } catch (error: unknown) {
    const e = error as Error;
    if (
      e.message === 'Nao autenticado' ||
      e.message === 'Sem permissao' ||
      e.message.startsWith('Acesso restrito')
    ) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }
    console.error('[GET /api/tomador/contrato-pdf]', e);
    return NextResponse.json({ error: 'Erro ao gerar contrato PDF' }, { status: 500 });
  }
}
