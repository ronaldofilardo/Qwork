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
    const contratanteId = session.contratante_id;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const busca = searchParams.get('busca') || '';
    const offset = (page - 1) * limit;

    // Construir WHERE clause para busca
    let whereClause = 'WHERE f.contratante_id = $1';
    const params: any[] = [contratanteId];

    if (busca) {
      whereClause += ` AND (la.codigo ILIKE $${params.length + 1} OR la.titulo ILIKE $${params.length + 1})`;
      params.push(`%${busca}%`);
    }

    // Buscar laudos com paginação
    const laudos = await queryAsGestorEntidade(
      `
      SELECT
        l.id,
        l.lote_id,
        c.nome as contratante_nome,
        e.nome as emissor_nome,
        l.enviado_em,
        l.hash_pdf,
        l.status
      FROM laudos l
      JOIN lotes_avaliacao la ON la.id = l.lote_id
      JOIN funcionarios f ON f.empresa_id = la.empresa_id OR f.contratante_id = $1
      LEFT JOIN contratantes c ON c.id = f.contratante_id
      LEFT JOIN funcionarios e ON e.cpf = l.emissor_cpf
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
      JOIN funcionarios f ON f.empresa_id = la.empresa_id OR f.contratante_id = $1
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
