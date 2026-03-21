import { NextResponse } from 'next/server';
import { requireEntity } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await requireEntity();
    const entidadeId = session.entidade_id;

    // Buscar contrato plano mais recente da entidade
    const contratoPlanoQuery = `
      SELECT
        cp.id,
        cp.valor_pago as valor_total,
        COALESCE(cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual) as numero_funcionarios,
        cp.created_at as criado_em
      FROM contratos_planos cp
      WHERE cp.entidade_id = $1
      ORDER BY cp.created_at DESC
      LIMIT 1
    `;

    const res = await queryAsGestorEntidade(contratoPlanoQuery, [entidadeId]);
    if (res.rows.length === 0) {
      return NextResponse.json(null);
    }

    const row = res.rows[0];

    // Determinar vigência com base no último pagamento confirmado (se houver)
    let vigencia_inicio: string | null = null;
    let vigencia_fim: string | null = null;
    try {
      const pagamentoRes = await queryAsGestorEntidade(
        `SELECT data_pagamento FROM pagamentos WHERE tomador_id = $1 AND status = 'pago' AND data_pagamento IS NOT NULL ORDER BY data_pagamento DESC LIMIT 1`,
        [entidadeId]
      );
      if (pagamentoRes.rows.length > 0) {
        vigencia_inicio = String(pagamentoRes.rows[0].data_pagamento);
        const d = new Date(vigencia_inicio);
        const fim = new Date(d);
        fim.setDate(fim.getDate() + 364);
        vigencia_fim = fim.toISOString();
      } else if (row.criado_em) {
        vigencia_inicio = String(row.criado_em);
        const d = new Date(vigencia_inicio);
        const fim = new Date(d);
        fim.setDate(fim.getDate() + 364);
        vigencia_fim = fim.toISOString();
      }
    } catch (err) {
      console.error(
        '[API contrato-fallback] Erro ao determinar vigência:',
        err
      );
    }

    const contrato = {
      id: row.id,
      valor_total: row.valor_total ? parseFloat(String(row.valor_total)) : null,
      numero_funcionarios: row.numero_funcionarios
        ? parseInt(String(row.numero_funcionarios), 10)
        : null,
      criado_em: row.criado_em,
      status: 'ativo',
      origem: 'contratos_planos',
      vigencia_inicio,
      vigencia_fim,
    };

    return NextResponse.json(contrato);
  } catch (error) {
    console.error('[API contrato-fallback] Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
