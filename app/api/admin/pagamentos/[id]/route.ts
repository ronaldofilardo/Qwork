import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession();

    if (!session || session.perfil !== 'admin') {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores.' },
        { status: 403 }
      );
    }

    const entidadeId = params.id;

    if (!entidadeId) {
      return NextResponse.json(
        { error: 'ID da entidade é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pagamento da entidade
    const pagamentoResult = await query(
      `SELECT * FROM pagamentos
       WHERE entidade_id = $1
       ORDER BY criado_em DESC
       LIMIT 1`,
      [entidadeId]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado para esta entidade' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pagamento: pagamentoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pagamento' },
      { status: 500 }
    );
  }
}
