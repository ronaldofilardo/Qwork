import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const body = await request.json();
    const { valor_total } = body;

    if (!valor_total || valor_total <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    const result = await query(
      `SELECT id FROM lotes_avaliacao WHERE link_pagamento_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 404 });
    }

    const simulacao = calcularParcelas(valor_total);

    return NextResponse.json({ simulacao });
  } catch (error: any) {
    console.error('[ERRO] simular pagamento:', error);
    return NextResponse.json({ error: 'Erro ao simular' }, { status: 500 });
  }
}
