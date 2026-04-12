import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/operacionais
 *
 * Retorna acessos de perfis operacionais:
 * suporte, comercial, representante, vendedor
 */
export async function GET() {
  try {
    await requireRole('admin', false);

    const result = await query(`
      SELECT
        sl.id,
        sl.cpf,
        sl.perfil,
        sl.login_timestamp,
        sl.logout_timestamp,
        sl.ip_address,
        CASE
          WHEN sl.perfil = 'representante' THEN r.nome
          ELSE f.nome
        END AS nome,
        CASE
          WHEN sl.perfil = 'representante' THEN r.cnpj
          ELSE NULL
        END AS cnpj
      FROM session_logs sl
      LEFT JOIN funcionarios f
        ON f.cpf = sl.cpf::bpchar
        AND sl.perfil IN ('suporte', 'comercial', 'vendedor')
      LEFT JOIN representantes r
        ON r.cpf = sl.cpf
        AND sl.perfil = 'representante'
      WHERE sl.perfil IN ('suporte', 'comercial', 'representante', 'vendedor')
      ORDER BY sl.login_timestamp DESC
      LIMIT 4000
    `);

    return NextResponse.json({
      success: true,
      operacionais: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de operacionais:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
