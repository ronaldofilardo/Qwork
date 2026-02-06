import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// Esta rota usa `request.url` (searchParams) e deve ser sempre dinâmica no runtime.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagamentoId = searchParams.get('id');

    if (!pagamentoId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    const pagamentoResult = await query(
      `SELECT p.*, e.nome as entidade_nome, e.pagamento_confirmado
       FROM pagamentos p
       JOIN entidades e ON p.entidade_id = e.id
       WHERE p.id = $1`,
      [pagamentoId]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pagamento: pagamentoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar pagamento' },
      { status: 500 }
    );
  }
}
