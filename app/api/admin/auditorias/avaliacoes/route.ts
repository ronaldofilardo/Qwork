import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/auditorias/avaliacoes
 *
 * Retorna auditoria de avaliações com todas as informações
 */
export async function GET() {
  try {
    await requireRole('admin');

    const result = await query(`
      SELECT * FROM vw_auditoria_avaliacoes
      ORDER BY criado_em DESC
      LIMIT 2000
    `);

    return NextResponse.json({
      success: true,
      avaliacoes: result.rows,
    });
  } catch (error) {
    console.error('Erro ao buscar auditoria de avaliações:', error);

    if (error instanceof Error && error.message === 'Sem permissão') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
