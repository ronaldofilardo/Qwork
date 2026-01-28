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

    const contratanteId = params.id;

    if (!contratanteId) {
      return NextResponse.json(
        { error: 'ID do contratante é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar pagamento do contratante
    const pagamentoResult = await query(
      `SELECT * FROM pagamentos
       WHERE contratante_id = $1
       ORDER BY criado_em DESC
       LIMIT 1`,
      [contratanteId]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado para este contratante' },
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
