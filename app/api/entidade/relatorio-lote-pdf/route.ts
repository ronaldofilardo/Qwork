import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';
import { gerarRelatorioLotePDF } from '@/lib/pdf/relatorio-lote';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/relatorio-lote-pdf?lote_id={loteId}
 * Gera relatório do lote com listagem de funcionários e conclusões para Entidade
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireEntity();
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');

    if (!loteId) {
      return NextResponse.json(
        { error: 'lote_id é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar dados do lote com hash do laudo e data de emissão
    const loteResult = await query(
      `
      SELECT 
        la.id,
        la.criado_em,
        l.hash_pdf,
        l.emitido_em,
        la.status
      FROM lotes_avaliacao la
      LEFT JOIN laudos l ON la.id = l.lote_id
      WHERE la.id = $1
    `,
      [loteId]
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado' },
        { status: 404 }
      );
    }

    const lote = loteResult.rows[0];

    // Buscar funcionários do lote com suas avaliações
    const funcionariosResult = await query(
      `
      SELECT DISTINCT
        f.nome,
        f.cpf,
        a.concluida_em,
        a.status
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
      WHERE a.lote_id = $1 
        AND a.status = 'concluida'
        AND f.ativo = true
        AND fe.entidade_id = $2
        AND fe.ativo = true
      ORDER BY f.nome
    `,
      [loteId, session.entidade_id]
    );

    // Gerar PDF
    const pdfBuffer = gerarRelatorioLotePDF({
      lote: {
        id: lote.id,
        criado_em: lote.criado_em,
        emitido_em: lote.emitido_em,
        hash_pdf: lote.hash_pdf,
        status: lote.status,
      },
      funcionarios: funcionariosResult.rows,
    });

    // Converter Buffer para Uint8Array para compatibilidade com NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-lote-${loteId}.pdf"`,
      },
    });
  } catch (error) {
    console.error('[entidade/relatorio-lote-pdf] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório do lote' },
      { status: 500 }
    );
  }
}
