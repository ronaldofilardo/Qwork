import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/acesso-vendedor
 *
 * Retorna logs de acessos de vendedores (perfil = 'vendedor')
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
        f.nome
      FROM session_logs sl
      LEFT JOIN funcionarios f ON f.cpf = sl.cpf::bpchar
      WHERE sl.perfil = 'vendedor'
      ORDER BY sl.login_timestamp DESC
      LIMIT 1000
    `);

    return NextResponse.json({
      success: true,
      acessos: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar acessos vendedor:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
