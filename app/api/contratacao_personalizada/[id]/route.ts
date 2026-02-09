import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const res = await query(
      `SELECT cp.id as contratacao_id,
              cp.entidade_id,
              c.nome as tomador_nome,
              cp.numero_funcionarios_estimado as numero_funcionarios,
              cp.valor_total_estimado as valor_total,
              cp.valor_por_funcionario,
              cp.status,
              cp.payment_link_expiracao
       FROM contratacao_personalizada cp
       JOIN entidades c ON c.id = cp.entidade_id
       WHERE cp.id = $1 LIMIT 1`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratação personalizada não encontrada' },
        { status: 404 }
      );
    }

    const cp = res.rows[0];

    // Validar expiração, se existir
    if (cp.payment_link_expiracao) {
      const exp = new Date(cp.payment_link_expiracao);
      if (exp < new Date()) {
        return NextResponse.json({ error: 'Link expirado' }, { status: 400 });
      }
    }

    // Validar status
    if (!['valor_definido', 'aguardando_pagamento'].includes(cp.status)) {
      return NextResponse.json(
        { error: `Status inválido para pagamento: ${cp.status}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valido: true,
      contratacao_id: cp.contratacao_id,
      entidade_id: cp.entidade_id,
      tomador_nome: cp.tomador_nome,
      numero_funcionarios: parseInt(cp.numero_funcionarios, 10),
      valor_total: parseFloat(cp.valor_total),
      valor_por_funcionario: parseFloat(cp.valor_por_funcionario || '0'),
      plano_tipo: 'personalizado',
      status: cp.status,
    });
  } catch (error) {
    console.error('Erro ao buscar contratacao_personalizada:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}
