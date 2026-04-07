import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/acesso-gestor
 *
 * Retorna logs de acessos de gestores de entidades (perfil = 'gestor')
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        sl.id,
        sl.cpf,
        sl.empresa_id,
        sl.login_timestamp,
        sl.logout_timestamp,
        (sl.logout_timestamp - sl.login_timestamp) AS session_duration,
        sl.ip_address,
        sl.user_agent,
        ent.nome AS empresa_nome,
        ent.cnpj AS empresa_cnpj
      FROM session_logs sl
      LEFT JOIN entidades ent ON ent.id = sl.empresa_id
      WHERE sl.perfil = 'gestor'
      ORDER BY sl.login_timestamp DESC
      LIMIT 1000
    `);

    return NextResponse.json({
      success: true,
      acessos: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar acessos gestor:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
