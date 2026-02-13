export const dynamic = 'force-dynamic';
import { NextResponse, NextRequest } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';

/**
 * GET /api/entidade/laudos
 * Retorna lista de laudos da entidade com paginação
 * Query params:
 * - page: número da página (padrão: 1)
 * - limit: itens por página (padrão: 20)
 * - busca: busca por código ou título
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const busca = searchParams.get('busca') || '';
    const offset = (page - 1) * limit;

    // Construir WHERE clause para busca
    // Usar join com funcionarios_entidades para validar que lote pertence à entidade
    let whereClause = 'WHERE fe_join.entidade_id = $1 AND fe_join.ativo = true';
    const params: any[] = [entidadeId];

    if (busca) {
      // Buscar por ID do lote (codigo e titulo foram removidos)
      whereClause += ` AND CAST(la.id AS TEXT) ILIKE $${params.length + 1}`;
      params.push(`%${busca}%`);
    }

    // Buscar laudos com paginação
    const laudos = await queryAsGestorEntidade(
      `
      SELECT
        l.id,
        l.lote_id,
        e.nome as entidade_nome,
        em.nome as emissor_nome,
        l.enviado_em,
        l.hash_pdf,
        l.status
      FROM laudos l
      JOIN lotes_avaliacao la ON la.id = l.lote_id
      INNER JOIN avaliacoes a ON a.lote_id = la.id
      INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      INNER JOIN funcionarios_entidades fe_join ON fe_join.funcionario_id = f.id
      LEFT JOIN entidades e ON e.id = fe_join.entidade_id
      LEFT JOIN usuarios em ON em.cpf = l.emissor_cpf
      ${whereClause}
      ORDER BY l.enviado_em DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `,
      [...params, limit, offset]
    );

    // Contar total de laudos
    const countResult = await queryAsGestorEntidade(
      `
      SELECT COUNT(DISTINCT l.id) as total
      FROM laudos l
      JOIN lotes_avaliacao la ON la.id = l.lote_id
      INNER JOIN avaliacoes a ON a.lote_id = la.id
      INNER JOIN funcionarios f ON a.funcionario_cpf = f.cpf
      INNER JOIN funcionarios_entidades fe_join ON fe_join.funcionario_id = f.id
      ${whereClause}
    `,
      params
    );

    const total = parseInt(String(countResult.rows[0]?.total || '0'));
    const totalPages = Math.ceil(total / limit);

    // Transformar os dados para incluir informações dos arquivos
    const laudosTransformados = laudos.rows.map((laudo: any) => ({
      id: laudo.id,
      lote_id: laudo.lote_id,
      status: laudo.status,
      data_emissao: laudo.enviado_em,
      arquivos: {
        relatorio_individual:
          laudo.status === 'emitido' ? 'disponivel' : undefined,
        relatorio_lote: laudo.status === 'emitido' ? 'disponivel' : undefined,
        relatorio_setor: laudo.status === 'emitido' ? 'disponivel' : undefined,
      },
    }));

    return NextResponse.json({
      success: true,
      laudos: laudosTransformados,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar laudos da entidade:', error);

    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro ao buscar laudos' },
      { status: 500 }
    );
  }
}
