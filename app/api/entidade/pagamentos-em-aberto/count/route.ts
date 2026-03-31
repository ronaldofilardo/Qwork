export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

/**
 * GET /api/entidade/pagamentos-em-aberto/count
 * Retorna a quantidade de pagamentos pendentes (link disponibilizado) da entidade
 */
export async function GET() {
  try {
    const session = await requireEntity();

    const result = await queryAsGestorEntidade<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM lotes_avaliacao
       WHERE entidade_id = $1
         AND link_disponibilizado_em IS NOT NULL
         AND status_pagamento = 'aguardando_pagamento'`,
      [session.entidade_id]
    );

    const count = parseInt(result.rows[0]?.count || '0', 10);

    return NextResponse.json({ count });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao contar pagamentos em aberto (entidade):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
