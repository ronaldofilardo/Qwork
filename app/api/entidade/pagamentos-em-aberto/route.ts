export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

/**
 * GET /api/entidade/pagamentos-em-aberto
 * Retorna lotes com pagamento pendente (link disponibilizado) da entidade
 */
export async function GET() {
  try {
    const session = await requireEntity();

    const result = await queryAsGestorEntidade(
      `SELECT la.id as lote_id,
              la.status_pagamento,
              la.link_pagamento_token,
              la.link_disponibilizado_em,
              la.valor_por_funcionario,
              la.pagamento_metodo,
              COUNT(DISTINCT a.id) FILTER (WHERE a.status != 'rascunho') as num_avaliacoes,
              e.nome as entidade_nome
       FROM lotes_avaliacao la
       LEFT JOIN avaliacoes a ON a.lote_id = la.id
       LEFT JOIN entidades e ON e.id = la.entidade_id
       WHERE la.entidade_id = $1
         AND la.link_disponibilizado_em IS NOT NULL
         AND la.status_pagamento = 'aguardando_pagamento'
       GROUP BY la.id, e.nome
       ORDER BY la.link_disponibilizado_em DESC`,
      [session.entidade_id]
    );

    const pagamentos = result.rows.map((row) => ({
      lote_id: row.lote_id,
      status_pagamento: row.status_pagamento,
      token: row.link_pagamento_token,
      disponibilizado_em: row.link_disponibilizado_em,
      valor_por_funcionario: parseFloat(String(row.valor_por_funcionario || '0')),
      num_avaliacoes: parseInt(String(row.num_avaliacoes || '0'), 10),
      valor_total: parseFloat(String(row.valor_por_funcionario || '0')) * parseInt(String(row.num_avaliacoes || '0'), 10),
      metodo: row.pagamento_metodo,
      entidade_nome: row.entidade_nome,
    }));

    return NextResponse.json({ pagamentos });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Acesso restrito')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Erro ao buscar pagamentos em aberto (entidade):', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
