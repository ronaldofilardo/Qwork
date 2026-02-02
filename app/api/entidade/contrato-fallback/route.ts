import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { queryAsGestorEntidade } from '@/lib/db-gestor';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'gestor_entidade') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contratanteId = session.contratante_id;
    if (!contratanteId) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 400 }
      );
    }

    // Detectar dinamicamente quais colunas de preço existem na tabela `planos`
    const planColsRes = await queryAsGestorEntidade(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'planos' AND column_name IN ('preco','valor_por_funcionario','valor_base','valor_fixo_anual')`
    );
    const availablePlanCols = planColsRes.rows.map((r: any) => r.column_name);

    const planSelect: string[] = [
      'p.nome as plano_nome',
      'p.tipo as plano_tipo',
    ];
    if (availablePlanCols.includes('preco'))
      planSelect.push('p.preco as plano_preco');
    if (availablePlanCols.includes('valor_por_funcionario'))
      planSelect.push('p.valor_por_funcionario as plano_valor_por_funcionario');
    if (availablePlanCols.includes('valor_base'))
      planSelect.push('p.valor_base as plano_valor_base');
    if (availablePlanCols.includes('valor_fixo_anual'))
      planSelect.push('p.valor_fixo_anual as plano_valor_fixo_anual');

    const contratoPlanoQuery = `
      SELECT
        cp.id,
        cp.plano_id,
        ${planSelect.join(',\n        ')},
        cp.valor_pago as valor_total,
        COALESCE(cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual) as numero_funcionarios,
        cp.created_at as criado_em
      FROM contratos_planos cp
      LEFT JOIN planos p ON cp.plano_id = p.id
      WHERE cp.contratante_id = $1
      ORDER BY cp.created_at DESC
      LIMIT 1
    `;

    const res = await queryAsGestorEntidade(contratoPlanoQuery, [
      contratanteId,
    ]);
    if (res.rows.length === 0) {
      return NextResponse.json(null);
    }

    const row = res.rows[0];

    // Determinar vigência com base no último pagamento confirmado (se houver)
    let vigencia_inicio: string | null = null;
    let vigencia_fim: string | null = null;
    try {
      const pagamentoRes = await queryAsGestorEntidade(
        `SELECT data_pagamento FROM pagamentos WHERE contratante_id = $1 AND status = 'pago' AND data_pagamento IS NOT NULL ORDER BY data_pagamento DESC LIMIT 1`,
        [contratanteId]
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
      plano_id: row.plano_id,
      plano_nome: row.plano_nome,
      plano_tipo: row.plano_tipo,
      plano_preco_unitario: (() => {
        const v =
          row.plano_valor_por_funcionario ||
          row.plano_preco ||
          row.plano_valor_base ||
          row.plano_valor_fixo_anual;
        return v == null ? null : parseFloat(String(v));
      })(),
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
