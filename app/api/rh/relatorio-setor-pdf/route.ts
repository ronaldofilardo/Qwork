import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gerarRelatorioSetorPDF } from '@/lib/pdf/relatorio-setor';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/relatorio-setor-pdf?lote_id={loteId}&empresa_id={empresaId}&setor={setor}
 * Gera relatório por setor em PDF para usuário RH.
 * Considera apenas funcionários com avaliação concluída.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['rh']);
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');
    const empresaId = searchParams.get('empresa_id');
    const setor = searchParams.get('setor');

    if (!loteId || !empresaId || !setor) {
      return NextResponse.json(
        { error: 'lote_id, empresa_id e setor são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar que o lote pertence à clínica e à empresa
    const loteResult = await query(
      `
      SELECT la.id, e.nome as empresa_nome
      FROM lotes_avaliacao la
      JOIN empresas_clientes e ON e.id = la.empresa_id
      WHERE la.id = $1
        AND la.empresa_id = $2
        AND la.clinica_id = $3
    `,
      [loteId, empresaId, session.clinica_id],
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
      JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
        AND fc.empresa_id = $2
        AND fc.clinica_id = $3
        AND fc.ativo = true
      WHERE a.lote_id = $1
        AND f.setor = $4
        AND a.status IN ('concluida', 'concluido')
        AND f.ativo = true
    `,
      [loteId, empresaId, session.clinica_id, setor],
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
      JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
        AND fc.empresa_id = $2
        AND fc.clinica_id = $3
        AND fc.ativo = true
      WHERE a.lote_id = $1
        AND f.setor = $4
        AND a.status IN ('concluida', 'concluido')
        AND f.ativo = true
      GROUP BY r.grupo
      ORDER BY r.grupo
    `,
      [loteId, empresaId, session.clinica_id, setor],
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
    console.error('[rh/relatorio-setor-pdf] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
