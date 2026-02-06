export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';

export async function GET() {
  try {
    const session = await requireAuth();
    const avaliacaoResult = await query(
      `SELECT id, status, inicio, envio, grupo_atual FROM avaliacoes
       WHERE funcionario_cpf = $1 AND status != 'inativada'
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ status: 'nao_iniciada' }, { status: 200 });
    }

    const avaliacao = avaliacaoResult.rows[0];
    let respostas = [];
    let total = 0;
    try {
      const respostasResult = await query(
        'SELECT item, valor FROM respostas WHERE avaliacao_id = $1',
        [avaliacao.id]
      );
      respostas = Array.isArray(respostasResult?.rows)
        ? respostasResult.rows
        : [];
      total = respostas.length;
    } catch {
      respostas = [];
      total = 0;
    }

    if (avaliacao.status === 'concluido') {
      return NextResponse.json(
        {
          status: avaliacao.status,
          inicio: avaliacao.inicio,
          envio: avaliacao.envio,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: avaliacao.status,
        inicio: avaliacao.inicio,
        envio: avaliacao.envio,
        grupo_atual: avaliacao.grupo_atual,
        avaliacaoId: avaliacao.id,
        respostas,
        total,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar status da avaliação:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar status' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();
    const { status, avaliacaoId: bodyAvaliacaoId } = body;

    if (
      !status ||
      !['iniciada', 'em_andamento', 'concluido'].includes(status)
    ) {
      return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
    }

    let avaliacaoId: number;

    if (bodyAvaliacaoId) {
      avaliacaoId = bodyAvaliacaoId;
      // Verificar se pertence ao usuário e não está inativada
      const checkResult = await query(
        `SELECT id FROM avaliacoes WHERE id = $1 AND funcionario_cpf = $2 AND status != 'inativada'`,
        [avaliacaoId, session.cpf]
      );
      if (checkResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Avaliação não encontrada' },
          { status: 404 }
        );
      }
    } else {
      // Buscar avaliação mais recente do usuário (não inativada)
      const avaliacaoResult = await query(
        `SELECT id FROM avaliacoes
         WHERE funcionario_cpf = $1 AND status != 'inativada'
         ORDER BY inicio DESC LIMIT 1`,
        [session.cpf]
      );

      if (avaliacaoResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Avaliação não encontrada' },
          { status: 404 }
        );
      }

      avaliacaoId = avaliacaoResult.rows[0].id;
    }

    // Atualizar status
    await query(`UPDATE avaliacoes SET status = $1 WHERE id = $2`, [
      status,
      avaliacaoId,
    ]);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao atualizar status da avaliação:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar status' },
      { status: 500 }
    );
  }
}

