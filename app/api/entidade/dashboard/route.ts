export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireEntity } from '@/lib/session';

/**
 * GET /api/entidade/dashboard
 * Retorna dados do dashboard para gestor de entidade
 * - Estatísticas de avaliações
 * - Distribuição de resultados
 * - Lista de funcionários
 */
export async function GET() {
  try {
    const session = await requireEntity();
    const contratanteId = session.contratante_id;

    // Buscar estatísticas gerais
    const stats = await query(
      `
      SELECT
        COUNT(DISTINCT CASE WHEN a.status != 'inativada' THEN a.id END) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as concluidas,
        COUNT(DISTINCT f.id) as total_funcionarios,
        COUNT(DISTINCT CASE WHEN f.ativo = true THEN f.id END) as funcionarios_ativos
      FROM funcionarios f
      LEFT JOIN avaliacoes a ON a.funcionario_cpf = f.cpf
      WHERE f.contratante_id = $1
    `,
      [contratanteId]
    );

    // Buscar resultados por grupo
    const resultados = await query(
      `
      SELECT
        r.grupo,
        r.dominio,
        ROUND(AVG(r.score), 2) as media_score,
        COUNT(DISTINCT r.avaliacao_id) as total_avaliacoes,
        COUNT(DISTINCT CASE WHEN r.categoria = 'baixo' THEN r.avaliacao_id END) as baixo,
        COUNT(DISTINCT CASE WHEN r.categoria = 'médio' THEN r.avaliacao_id END) as medio,
        COUNT(DISTINCT CASE WHEN r.categoria = 'alto' THEN r.avaliacao_id END) as alto
      FROM resultados r
      JOIN avaliacoes a ON a.id = r.avaliacao_id
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      WHERE f.contratante_id = $1 AND a.status = 'concluida'
      GROUP BY r.grupo, r.dominio
      ORDER BY r.grupo
    `,
      [contratanteId]
    );

    // Distribuição por categoria
    const distribuicao = await query(
      `
      SELECT
        r.categoria,
        COUNT(DISTINCT r.avaliacao_id) as total
      FROM resultados r
      JOIN avaliacoes a ON a.id = r.avaliacao_id
      JOIN funcionarios f ON f.cpf = a.funcionario_cpf
      WHERE f.contratante_id = $1 AND a.status = 'concluida'
      GROUP BY r.categoria
      ORDER BY 
        CASE r.categoria
          WHEN 'baixo' THEN 1
          WHEN 'médio' THEN 2
          WHEN 'alto' THEN 3
        END
    `,
      [contratanteId]
    );

    return NextResponse.json({
      success: true,
      stats: stats.rows[0] || {
        total_avaliacoes: 0,
        concluidas: 0,
        total_funcionarios: 0,
        funcionarios_ativos: 0,
      },
      resultados: resultados.rows,
      distribuicao: distribuicao.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar dados' },
      { status: 500 }
    );
  }
}
