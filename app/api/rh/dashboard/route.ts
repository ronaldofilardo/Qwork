export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireClinica } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const empresaId = searchParams.get('empresa_id');

    // Garantir que o RH tem clínica válida (aplica fallback por contratante_id)
    let session;
    try {
      session = await requireClinica();
    } catch (err: any) {
      console.error('requireClinica error:', err);
      return NextResponse.json(
        {
          error: err?.message || 'Clínica não identificada na sessão',
          hint: 'Verifique se a clínica vinculada ao contratante foi criada e está ativa.',
        },
        { status: 403 }
      );
    }

    const clinicaId = session.clinica_id;

    // Adicionar filtro opcional por empresa
    const empresaFilter = empresaId ? 'AND ec.id = $2' : '';
    const params = empresaId ? [clinicaId, empresaId] : [clinicaId];

    // Buscar estatísticas gerais da clínica
    const statsQuery = await query(
      `
      SELECT
        COUNT(DISTINCT ec.id) as total_empresas,
        COUNT(DISTINCT f.id) as total_funcionarios,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'inativada') as total_avaliacoes,
        COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'concluida') as concluidas,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN f.id END) as funcionarios_avaliados
      FROM clinicas c
      LEFT JOIN empresas_clientes ec ON c.id = ec.clinica_id ${empresaFilter.replace('ec.id = $2', 'ec.id = $2 AND ec.clinica_id = c.id')}
      LEFT JOIN funcionarios f ON ec.id = f.empresa_id AND f.ativo = true
      LEFT JOIN avaliacoes a ON f.cpf = a.funcionario_cpf
      WHERE c.id = $1
    `,
      params
    );

    // Buscar resultados por grupo
    const resultadosQuery = await query(
      `
      SELECT
        r.grupo,
        r.dominio,
        ROUND(AVG(r.score), 2)::text as media_score,
        COUNT(DISTINCT r.avaliacao_id) as total,
        COUNT(DISTINCT CASE WHEN r.categoria = 'baixo' THEN r.avaliacao_id END) as baixo,
        COUNT(DISTINCT CASE WHEN r.categoria = 'médio' THEN r.avaliacao_id END) as medio,
        COUNT(DISTINCT CASE WHEN r.categoria = 'alto' THEN r.avaliacao_id END) as alto,
        CASE
          WHEN AVG(r.score) < 50 THEN 'baixo'
          WHEN AVG(r.score) < 75 THEN 'médio'
          ELSE 'alto'
        END as categoria
      FROM resultados r
      JOIN avaliacoes a ON a.id = r.avaliacao_id
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      JOIN empresas_clientes ec ON ec.id = f.empresa_id
      WHERE ec.clinica_id = $1 AND a.status = 'concluida' ${empresaId ? 'AND ec.id = $2' : ''}
      GROUP BY r.grupo, r.dominio
      ORDER BY r.grupo
    `,
      params
    );

    // Distribuição por categoria
    const distribuicaoQuery = await query(
      `
      SELECT
        r.categoria,
        COUNT(DISTINCT r.avaliacao_id) as total
      FROM resultados r
      JOIN avaliacoes a ON a.id = r.avaliacao_id
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      JOIN empresas_clientes ec ON ec.id = f.empresa_id
      WHERE ec.clinica_id = $1 AND a.status = 'concluida' ${empresaId ? 'AND ec.id = $2' : ''}
      GROUP BY r.categoria
      ORDER BY 
        CASE r.categoria
          WHEN 'baixo' THEN 1
          WHEN 'médio' THEN 2
          WHEN 'alto' THEN 3
        END
    `,
      params
    );

    const row = statsQuery.rows[0] || {};

    const flattenedStats = {
      total_empresas: parseInt(row.total_empresas) || 0,
      total_funcionarios: parseInt(row.total_funcionarios) || 0,
      total_avaliacoes: parseInt(row.total_avaliacoes) || 0,
      avaliacoes_concluidas: parseInt(row.concluidas) || 0,
      funcionarios_avaliados: parseInt(row.funcionarios_avaliados) || 0,
    };

    // Retornamos os valores em formato "flat" para serem usados diretamente pelo frontend
    // e também mantemos `stats` (compatibilidade) para codepaths que esperam esse formato.
    return NextResponse.json({
      ...flattenedStats,
      stats: flattenedStats,
      resultados: resultadosQuery.rows,
      distribuicao: distribuicaoQuery.rows,
    });
  } catch (error: any) {
    console.error('Erro ao buscar dados RH:', error);

    if (error instanceof Error && error.message.includes('Clínica')) {
      return NextResponse.json(
        { error: error.message, hint: 'Verifique o cadastro da clínica' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
