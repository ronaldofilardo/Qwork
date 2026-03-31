/**
 * GET /api/comercial/representantes/[id]/vendedores
 * Lista vendedores da equipe de um representante específico.
 * Acesso: perfil 'comercial' ou 'admin' — somente leitura.
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    await requireRole(['comercial', 'admin', 'suporte'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    // Verificar que o representante existe
    const repCheck = await query(
      `SELECT id, nome FROM representantes WHERE id = $1 LIMIT 1`,
      [representanteId]
    );
    if (repCheck.rows.length === 0) {
      return NextResponse.json(
        { error: 'Representante não encontrado' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const offset = (page - 1) * limit;

    const countResult = await query<{ total: string }>(
      `SELECT COUNT(*) AS total
       FROM hierarquia_comercial hc
       WHERE hc.representante_id = $1 AND hc.ativo = true`,
      [representanteId]
    );
    const total = parseInt(countResult.rows[0]?.total ?? '0', 10);

    const rows = await query(
      `SELECT
         hc.id               AS vinculo_id,
         hc.criado_em        AS vinculado_em,
         hc.percentual_override,
         u.id                AS vendedor_id,
         u.nome              AS nome,
         u.email             AS email,
         u.cpf               AS cpf,
         vp.codigo           AS codigo_vendedor,
         COUNT(DISTINCT lr.id) FILTER (
           WHERE lr.status NOT IN ('expirado', 'convertido')
         )                   AS leads_ativos,
         COUNT(DISTINCT vc.id) FILTER (
           WHERE vc.status = 'ativo'
         )                   AS vinculos_ativos
       FROM hierarquia_comercial hc
       JOIN usuarios u ON u.id = hc.vendedor_id
       LEFT JOIN vendedores_perfil vp ON vp.usuario_id = u.id
       LEFT JOIN leads_representante lr ON lr.vendedor_id = u.id
       LEFT JOIN vinculos_comissao vc ON vc.lead_id IN (
         SELECT id FROM leads_representante WHERE vendedor_id = u.id
       )
       WHERE hc.representante_id = $1 AND hc.ativo = true
       GROUP BY hc.id, u.id, vp.codigo
       ORDER BY u.nome
       LIMIT $2 OFFSET $3`,
      [representanteId, limit, offset]
    );

    return NextResponse.json({
      representante: repCheck.rows[0],
      vendedores: rows.rows,
      total,
      page,
      limit,
    });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado') {
      return NextResponse.json({ error: e.message }, { status: 401 });
    }
    console.error('[GET /api/comercial/representantes/[id]/vendedores]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
