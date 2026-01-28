import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/acessos-funcionarios
 *
 * Retorna logs de acessos de funcionários com CPF anonimizado
 */
export async function GET() {
  try {
    await requireRole('admin');

    const result = await query(`
      SELECT * FROM vw_auditoria_acessos_funcionarios
      ORDER BY login_timestamp DESC
      LIMIT 1000
    `);

    return NextResponse.json({
      success: true,
      acessos: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar acessos de funcionários:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
