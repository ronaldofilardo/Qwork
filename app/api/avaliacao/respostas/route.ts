import { NextResponse } from 'next/server';
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';
import { verificarEConcluirAvaliacao } from '@/lib/avaliacao-conclusao';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const body = await request.json();

    let respostas = [];
    let avaliacaoId = body.avaliacaoId;

    // Verificar se é um array ou objeto único
    if (Array.isArray(body.respostas)) {
      respostas = body.respostas;
    } else if (body.item !== undefined && body.valor !== undefined) {
      respostas = [body];
    }

    if (respostas.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Se não foi passado avaliacaoId, buscar avaliação atual (não inativada)
    if (!avaliacaoId) {
      const avaliacaoResult = await queryWithContext(
        `SELECT id, lote_id FROM avaliacoes
         WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento') AND status != 'inativada'
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

    // Salvar respostas
    for (const resposta of respostas) {
      await queryWithContext(
        `INSERT INTO respostas (avaliacao_id, item, valor, grupo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (avaliacao_id, grupo, item) DO UPDATE SET valor = EXCLUDED.valor, criado_em = NOW()`,
        [avaliacaoId, resposta.item, resposta.valor, resposta.grupo]
      );
    }

    // ✅ ATUALIZAR STATUS PARA 'EM_ANDAMENTO' SE AINDA ESTIVER 'INICIADA'
    // Fazer isso ANTES de verificar auto-conclusão para garantir que o status seja atualizado
    try {
      const statusRes = await queryWithContext(
        `SELECT status FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );
      const currentStatus = statusRes.rows[0]?.status;

      if (currentStatus === 'iniciada') {
        await queryWithContext(
          `UPDATE avaliacoes SET status = 'em_andamento', atualizado_em = NOW() WHERE id = $1 AND status = 'iniciada'`,
          [avaliacaoId]
        );
        console.log(
          `[RESPOSTAS] ✅ Atualizado status da avaliação ${avaliacaoId} para 'em_andamento'`
        );
      }
    } catch (statusErr: any) {
      // Log detalhado do erro para diagnóstico, mas NÃO bloquear o salvamento das respostas
      console.error(
        '[RESPOSTAS] ❌ Erro ao atualizar status para em_andamento:',
        {
          message: statusErr?.message,
          code: statusErr?.code,
          detail: statusErr?.detail,
          hint: statusErr?.hint,
          avaliacaoId,
          stack: statusErr?.stack,
        }
      );
      // Continuar execução - respostas já foram salvas
    }

    // ✅ VERIFICAR SE COMPLETOU 37 RESPOSTAS (AUTO-CONCLUSÃO)
    // Usando função consolidada para idempotência e consistência
    const resultadoConclusao = await verificarEConcluirAvaliacao(
      avaliacaoId,
      session.cpf
    );

    if (resultadoConclusao.concluida) {
      return NextResponse.json({
        success: true,
        completed: true,
        message:
          'Avaliação concluída com sucesso! Todas as 37 questões foram respondidas.',
      });
    }

    // Resposta padrão se não completou 37 respostas
    return NextResponse.json(
      {
        success: true,
        completed: false,
        totalRespostas: resultadoConclusao.totalRespostas,
        mensagem: resultadoConclusao.mensagem,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao salvar respostas:', error);
    if (error instanceof Error && error.message === 'Não autenticado') {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const grupo = searchParams.get('grupo');

    if (!grupo) {
      return NextResponse.json(
        { error: 'Grupo não informado' },
        { status: 400 }
      );
    }

    // Buscar avaliação atual (não inativada)
    const avaliacaoResult = await queryWithContext(
      `SELECT id FROM avaliacoes
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento') AND status != 'inativada'
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    );

    if (avaliacaoResult.rows.length === 0) {
      return NextResponse.json({ respostas: [], total: 0 }, { status: 200 });
    }

    const avaliacaoId = avaliacaoResult.rows[0].id;

    // Buscar respostas do grupo
    const respostasResult = await queryWithContext(
      `SELECT item, valor
       FROM respostas
       WHERE avaliacao_id = $1 AND grupo = $2
       ORDER BY item`,
      [avaliacaoId, parseInt(grupo)]
    );

    const respostas = Array.isArray(respostasResult?.rows)
      ? respostasResult.rows
      : [];
    return NextResponse.json(
      {
        respostas,
        total: respostas.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar respostas:', error);
    return NextResponse.json({ respostas: [], total: 0 }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
