import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';
import { gerarRelatorioSetorPDF } from '@/lib/pdf/relatorio-setor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/relatorio-setor-pdf?lote_id={loteId}&setor={setor}
 * Gera relatório por setor em PDF para usuário Entidade.
 * Considera apenas funcionários com avaliação concluída.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireEntity();
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');
    const setor = searchParams.get('setor');

    if (!loteId || !setor) {
      return NextResponse.json(
        { error: 'lote_id e setor são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar que o lote pertence à entidade
    const loteResult = await query(
      `
      SELECT la.id, t.nome as empresa_nome
      FROM lotes_avaliacao la
      JOIN tomadores t ON t.id = la.entidade_id
      WHERE la.id = $1
        AND la.entidade_id = $2
    `,
      [loteId, session.entidade_id],
      session
    );

    if (loteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Lote não encontrado ou sem permissão de acesso' },
        { status: 404 }
      );
    }

    const { empresa_nome } = loteResult.rows[0];

    // Contar funcionários do setor com avaliação concluída
    const countResult = await query(
      `
      SELECT COUNT(DISTINCT a.id)::int AS total
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.lote_id = $1
        AND f.setor = $2
        AND a.status IN ('concluida', 'concluido')
        AND f.ativo = true
        AND la.entidade_id = $3
    `,
      [loteId, setor, session.entidade_id],
      session
    );

    const total_funcionarios: number = countResult.rows[0]?.total ?? 0;

    if (total_funcionarios === 0) {
      return NextResponse.json(
        {
          error: `Nenhum funcionário do setor "${setor}" com avaliação concluída neste ciclo`,
        },
        { status: 404 }
      );
    }

    // Médias por grupo — agrega todas as respostas do setor no ciclo
    const respostasResult = await query(
      `
      SELECT
        r.grupo,
        AVG(r.valor)::numeric AS valor
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.lote_id = $1
        AND f.setor = $2
        AND a.status IN ('concluida', 'concluido')
        AND f.ativo = true
        AND la.entidade_id = $3
      GROUP BY r.grupo
      ORDER BY r.grupo
    `,
      [loteId, setor, session.entidade_id],
      session
    );

    const pdfBuffer = gerarRelatorioSetorPDF({
      setor,
      empresa_nome,
      lote_id: Number(loteId),
      total_funcionarios,
      respostas: respostasResult.rows,
    });

    const pdfUint8Array = new Uint8Array(pdfBuffer);
    const nomeArquivo = `relatorio-setor-${setor.replace(/\s+/g, '-')}-lote${loteId}.pdf`;

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${nomeArquivo}"`,
      },
    });
  } catch (error: any) {
    console.error('[entidade/relatorio-setor-pdf] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
