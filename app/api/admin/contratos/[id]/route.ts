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

    // Buscar contrato do contratante
    const contratoResult = await query(
      `SELECT c.*, p.nome as plano_nome, COALESCE(p.valor_por_funcionario, p.valor_base) as plano_preco
       FROM contratos c
       LEFT JOIN planos p ON c.plano_id = p.id
       WHERE c.contratante_id = $1
       ORDER BY c.criado_em DESC
       LIMIT 1`,
      [contratanteId]
    );

    if (contratoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado para este contratante' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      contrato: contratoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao buscar contrato:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar contrato' },
      { status: 500 }
    );
  }
}
