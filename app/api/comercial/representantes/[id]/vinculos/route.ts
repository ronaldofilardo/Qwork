/**
 * GET /api/comercial/representantes/[id]/vinculos
 *
 * Lista vínculos de comissão do representante com dados da entidade
 * e do vendedor responsável pelo lead de origem.
 * Acesso: comercial, admin, suporte
 */
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const session = await requireRole(['comercial', 'admin', 'suporte'], false);

    const representanteId = parseInt(params.id, 10);
    if (isNaN(representanteId))
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

    // Ownership check: comercial só acessa representantes atribuídos a ele
    if (session.perfil === 'comercial') {
      const owned = await query<{ id: number }>(
        `SELECT 1 AS id FROM representantes WHERE id = $1 AND gestor_comercial_cpf = $2 LIMIT 1`,
        [representanteId, session.cpf]
      );
      if (owned.rows.length === 0) {
        return NextResponse.json(
          { error: 'Representante não encontrado' },
          { status: 404 }
        );
      }
    }

    const rows = await query(
      `SELECT
         vc.id,
         vc.status,
         vc.data_inicio,
         vc.data_expiracao,
         vc.criado_em,
         vc.encerrado_em,
         e.nome         AS entidade_nome,
         e.cnpj         AS entidade_cnpj,
         u.nome         AS vendedor_nome,
         u.id           AS vendedor_id
       FROM vinculos_comissao vc
       JOIN entidades e ON e.id = vc.entidade_id
       LEFT JOIN leads_representante lr ON lr.id = vc.lead_id
       LEFT JOIN usuarios u ON u.id = lr.vendedor_id
       WHERE vc.representante_id = $1
       ORDER BY vc.criado_em DESC
       LIMIT 100`,
      [representanteId]
    );

    return NextResponse.json({ vinculos: rows.rows });
  } catch (err: unknown) {
    const e = err as Error;
    if (e.message === 'Sem permissão' || e.message === 'Não autenticado')
      return NextResponse.json({ error: e.message }, { status: 401 });
    console.error('[GET /api/comercial/representantes/[id]/vinculos]', e);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
