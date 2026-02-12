import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';
import { gerarRelatorioIndividualPDF } from '@/lib/pdf/relatorio-individual';

export const dynamic = 'force-dynamic';

/**
 * GET /api/entidade/relatorio-individual-pdf?lote_id={loteId}&cpf={cpf}
 * Gera relatório individual em PDF para usuário Entidade
 */
export async function GET(req: NextRequest) {
  try {
    const session = await requireEntity();
    const { searchParams } = new URL(req.url);
    const loteId = searchParams.get('lote_id');
    const cpf = searchParams.get('cpf');

    if (!loteId || !cpf) {
      return NextResponse.json(
        { error: 'lote_id e cpf são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar dados da avaliação - entidade só acessa lotes da sua entidade
    const avaliacaoResult = await query(
      `
      SELECT 
        a.id,
        a.funcionario_cpf,
        a.concluida_em,
        f.nome,
        f.cpf,
        f.matricula,
        f.funcao,
        f.nivel_cargo,
        f.setor,
        e.nome as empresa_nome
      FROM avaliacoes a
      JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      JOIN funcionarios_entidades fe ON fe.funcionario_id = f.id
      JOIN entidades e ON fe.entidade_id = e.id
      JOIN lotes_avaliacao la ON a.lote_id = la.id
      WHERE a.lote_id = $1 
        AND f.cpf = $2
        AND a.status = 'concluida'
        AND f.ativo = true
        AND fe.entidade_id = $3
        AND fe.ativo = true
        AND la.entidade_id = $3
    `,
      [loteId, cpf, session.entidade_id]
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json(
        {
          error:
            'Avaliação não encontrada para o CPF informado ou você não tem acesso',
        },
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
      [avaliacao.id]
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
    console.error('[entidade/relatorio-individual-pdf] Erro:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
