import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { gerarRelatorioIndividualPDF } from '@/lib/pdf/relatorio-individual';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rh/relatorio-individual-pdf?lote_id={loteId}&cpf={cpf}
 * Gera relatório individual em PDF para usuário RH
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireRole(['rh']);
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');
    const cpf = searchParams.get('cpf');

    if (!loteId || !cpf) {
      return NextResponse.json(
        { error: 'lote_id e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados da avaliação
    const avaliacaoResult = await query(
      `
      SELECT 
        a.id,
        a.funcionario_cpf,
        a.envio as concluida_em,
        f.nome,
        f.cpf,
        f.matricula,
        f.funcao,
        f.nivel_cargo,
        f.setor,
        e.nome as empresa_nome
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN funcionarios_clinicas fc ON fc.funcionario_id = f.id
      JOIN empresas_clientes e ON fc.empresa_id = e.id
      WHERE a.lote_id = $1 
        AND f.cpf = $2
        AND a.status = 'concluida'
        AND f.ativo = true
        AND fc.clinica_id = $3
        AND fc.ativo = true
    `,
      [loteId, cpf, session.clinica_id],
      session
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Avaliação não encontrada para o CPF informado' },
        { status: 404 }
      );
    }

    const avaliacao = avaliacaoResult.rows[0];

    // Buscar respostas agrupadas por grupo
    const respostasResult = await query(
      `
      SELECT 
        grupo,
        AVG(valor)::numeric as valor
      FROM respostas
      WHERE avaliacao_id = $1
      GROUP BY grupo
      ORDER BY grupo
    `,
      [avaliacao.id],
      session
    );

    // Gerar PDF usando helper compartilhado
    const pdfBuffer = gerarRelatorioIndividualPDF({
      avaliacao,
      respostas: respostasResult.rows,
    });

    // Converter Buffer para Uint8Array para compatibilidade com NextResponse
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="relatorio-individual-${avaliacao.nome.replace(/\s+/g, '-')}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('[relatorio-individual-pdf] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
