import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const GET = async (request: Request) => {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const url = new URL(request.url);
    const avaliacaoIdParam = url.searchParams.get('avaliacaoId');

    let avaliacaoId: number;

    if (avaliacaoIdParam) {
      avaliacaoId = parseInt(avaliacaoIdParam);
      // Verificar se a avaliação pertence ao usuário e não está inativada
      const checkRes = await query(
        `SELECT id FROM avaliacoes WHERE id = $1 AND funcionario_cpf = $2 AND status != 'inativada'`,
        [avaliacaoId, user.cpf]
      );
      if (!checkRes.rowCount) {
        return NextResponse.json({ respostas: [], total: 0 }, { status: 200 });
      }
    } else {
      // Busca a avaliação atual (iniciada ou em andamento, não inativada)
      const avaliacaoRes = await query(
        `SELECT id FROM avaliacoes
         WHERE funcionario_cpf = $1
         AND status IN ('iniciada', 'em_andamento')
         AND status != 'inativada'
         ORDER BY inicio DESC
         LIMIT 1`,
        [user.cpf]
      );

      if (!avaliacaoRes.rowCount) {
        return NextResponse.json({ respostas: [], total: 0 }, { status: 200 });
      }

      avaliacaoId = avaliacaoRes.rows[0].id;
    }

    // 2. Busca TODAS as respostas dessa avaliação
    const respostasRes = await query(
      `SELECT item, valor 
       FROM respostas 
       WHERE avaliacao_id = $1 
       ORDER BY criado_em ASC`,
      [avaliacaoId]
    );

    console.log(
      '[DEBUG /api/avaliacao/respostas-all] avaliacaoId:',
      avaliacaoId
    );
    console.log(
      '[DEBUG /api/avaliacao/respostas-all] respostas encontradas:',
      respostasRes.rows.length
    );

    return NextResponse.json(
      {
        avaliacaoId,
        respostas: respostasRes.rows,
        total: respostasRes.rows.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro em respostas-all:', error);
    return NextResponse.json(
      { error: 'Erro interno', respostas: [], total: 0 },
      { status: 500 }
    );
  }
};
