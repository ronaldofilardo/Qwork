import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * PATCH /api/admin/cobranca/parcela/atualizar-status
 *
 * Atualiza o status de uma parcela específica
 * Body:
 * - pagamento_id: ID do pagamento
 * - parcela_numero: Número da parcela
 * - novo_status: 'pago' | 'pendente' | 'cancelado'
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { pagamento_id, parcela_numero, novo_status } = body;

    // Validações
    if (!pagamento_id || !parcela_numero || !novo_status) {
      return NextResponse.json(
        {
          error:
            'Campos obrigatórios: pagamento_id, parcela_numero, novo_status',
        },
        { status: 400 }
      );
    }

    if (!['pago', 'pendente', 'cancelado'].includes(novo_status)) {
      return NextResponse.json(
        { error: "Status deve ser 'pago', 'pendente' ou 'cancelado'" },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // Query 7: Atualizar status de parcela pelo número
      const updateResult = await query(
        `UPDATE pagamentos p
         SET detalhes_parcelas = (
           SELECT jsonb_agg(
             CASE 
               WHEN elem->>'numero' = $2
               THEN jsonb_set(elem, '{status}', to_jsonb($3::text))
               ELSE elem
             END
           )
           FROM jsonb_array_elements(p.detalhes_parcelas) as elem
         )
         WHERE p.id = $1
         RETURNING id, detalhes_parcelas`,
        [pagamento_id, parcela_numero.toString(), novo_status]
      );

      if (updateResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Pagamento não encontrado' },
          { status: 404 }
        );
      }

      // Se marcou como pago, atualizar também no recibo
      if (novo_status === 'pago') {
        await query(
          `UPDATE recibos r
           SET detalhes_parcelas = (
             SELECT jsonb_agg(
               CASE 
                 WHEN elem->>'numero' = $2
                 THEN jsonb_set(elem, '{status}', to_jsonb('pago'::text))
                 ELSE elem
               END
             )
             FROM jsonb_array_elements(r.detalhes_parcelas) as elem
           )
           WHERE r.pagamento_id = $1`,
          [pagamento_id, parcela_numero.toString()]
        );
      }

      await query('COMMIT');

      console.info(
        JSON.stringify({
          event: 'parcela_status_updated',
          pagamento_id,
          parcela_numero,
          novo_status,
        })
      );

      return NextResponse.json({
        success: true,
        message: `Status da parcela ${parcela_numero} atualizado para '${novo_status}'`,
        detalhes_parcelas: updateResult.rows[0].detalhes_parcelas,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Erro ao atualizar status da parcela:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao atualizar status da parcela',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cobranca/parcela/historico?contratante_id=X
 *
 * Retorna histórico de pagamentos de um contratante
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const contratanteId = searchParams.get('contratante_id');

    if (!contratanteId) {
      return NextResponse.json(
        { error: 'contratante_id é obrigatório' },
        { status: 400 }
      );
    }

    // Query 9: Histórico de pagamentos
    const result = await query(
      `SELECT 
        p.id as pagamento_id,
        p.data_pagamento,
        p.valor as valor_total,
        p.metodo,
        p.numero_parcelas,
        p.numero_funcionarios,
        p.valor_por_funcionario,
        pl.nome as plano,
        ct.status as status_contrato,
        r.vigencia_inicio,
        r.vigencia_fim,
        r.numero_recibo,
        p.detalhes_parcelas
      FROM pagamentos p
      INNER JOIN contratos ct ON ct.id = p.contrato_id
      INNER JOIN planos pl ON pl.id = ct.plano_id
      LEFT JOIN recibos r ON r.pagamento_id = p.id
      WHERE p.contratante_id = $1
      ORDER BY p.data_pagamento DESC`,
      [contratanteId]
    );

    return NextResponse.json({
      success: true,
      historico: result.rows.map((row) => ({
        ...row,
        valor_total: parseFloat(row.valor_total),
        valor_por_funcionario: parseFloat(row.valor_por_funcionario),
      })),
    });
  } catch (error) {
    console.error('Erro ao buscar histórico de pagamentos:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro ao buscar histórico de pagamentos',
      },
      { status: 500 }
    );
  }
}
