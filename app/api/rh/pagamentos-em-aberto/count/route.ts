export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { queryAsGestorRH } from '@/lib/db-gestor';

/**
 * GET /api/rh/pagamentos-em-aberto/count
 * Retorna a quantidade de pagamentos pendentes (link disponibilizado) da clínica
 */
export async function GET() {
  try {
    const session = await requireAuth();

    if (session.perfil !== 'rh') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    if (!session.clinica_id) {
      return NextResponse.json(
        { error: 'Clínica não identificada' },
        { status: 403 }
      );
    }

    const result = await queryAsGestorRH<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM lotes_avaliacao
       WHERE clinica_id = $1
         AND link_disponibilizado_em IS NOT NULL
         AND status_pagamento = 'aguardando_pagamento'`,
      [session.clinica_id]
    );

    const count = parseInt(result.rows[0]?.count || '0', 10);

    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Acesso negado')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao contar pagamentos em aberto (rh):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
