import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/gestores
 *
 * Retorna acessos unificados de gestores (entidades) e RH (clínicas)
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        sl.id,
        sl.cpf,
        'gestor'::text AS tipo,
        sl.login_timestamp,
        sl.logout_timestamp,
        sl.ip_address,
        ent.nome   AS empresa_nome,
        ent.cnpj   AS empresa_cnpj,
        ent.id     AS entidade_id,
        NULL::integer AS clinica_id,
        NULL::text    AS clinica_nome
      FROM session_logs sl
      LEFT JOIN entidades ent ON ent.id = sl.empresa_id
      WHERE sl.perfil = 'gestor'

      UNION ALL

      SELECT
        sl.id,
        sl.cpf,
        'rh'::text AS tipo,
        sl.login_timestamp,
        sl.logout_timestamp,
        sl.ip_address,
        NULL::text    AS empresa_nome,
        NULL::text    AS empresa_cnpj,
        NULL::integer AS entidade_id,
        c.id          AS clinica_id,
        c.nome        AS clinica_nome
      FROM session_logs sl
      LEFT JOIN clinicas c ON c.id = sl.clinica_id
      WHERE sl.perfil = 'rh'

      ORDER BY login_timestamp DESC
      LIMIT 2000
    `);

    return NextResponse.json({
      success: true,
      gestores: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de gestores:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
