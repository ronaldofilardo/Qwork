import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/acesso-representante
 *
 * Retorna logs de acessos de representantes (perfil = 'representante').
 * JOIN com representantes por cpf (PF) ou cpf_responsavel_pj (PJ).
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        sl.id,
        sl.cpf,
        sl.login_timestamp,
        sl.logout_timestamp,
        sl.session_duration,
        sl.ip_address,
        sl.user_agent,
        COALESCE(r.nome, sl.cpf) AS representante_nome
      FROM session_logs sl
      LEFT JOIN representantes r
        ON r.cpf = sl.cpf::bpchar
        OR r.cpf_responsavel_pj = sl.cpf::bpchar
      WHERE sl.perfil = 'representante'
      ORDER BY sl.login_timestamp DESC
      LIMIT 1000
    `);

    return NextResponse.json({
      success: true,
      acessos: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar acessos representante:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
