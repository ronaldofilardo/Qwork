import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clinicas/stats
 *
 * Retorna estatísticas para cada clínica:
 * - Quantidade de empresas clientes
 * - Total de Ciclos de Coletas Avaliativas liberados
 * - Total de avaliações liberadas (soma de todas as empresas da clínica)
 */
export async function GET() {
  try {
    const session = await requireRole('admin')

    // Query que busca estatísticas completas por clínica
    const result = await query(`
      SELECT
        c.id as clinica_id,
        c.nome as clinica_nome,
        c.cnpj,
        c.ativa,
        -- Quantidade de empresas clientes
        COUNT(DISTINCT ec.id) as total_empresas,
        -- Quantidade de lotes liberados
        COUNT(DISTINCT l.id) as total_lotes,
        -- Total de avaliações liberadas
        COUNT(DISTINCT a.id) as total_avaliacoes,
        -- Avaliações concluídas
        COUNT(DISTINCT CASE WHEN a.status = 'concluida' THEN a.id END) as avaliacoes_concluidas,
        -- Avaliações em andamento
        COUNT(DISTINCT CASE WHEN a.status IN ('iniciada', 'em_andamento') THEN a.id END) as avaliacoes_em_andamento
      FROM clinicas c
      LEFT JOIN empresas_clientes ec ON c.id = ec.clinica_id
      LEFT JOIN lotes_avaliacao l ON c.id = l.clinica_id
      LEFT JOIN avaliacoes a ON l.id = a.lote_id
      GROUP BY c.id, c.nome, c.cnpj, c.ativa
      ORDER BY c.nome
    `, [], session)

    return NextResponse.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Erro ao buscar estatísticas das clínicas:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor'
      },
      { status: 500 }
    )
  }
}


