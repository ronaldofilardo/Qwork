import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { transactionWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';
import { recalcularStatusLote } from '@/lib/lotes';
import { calcularResultados } from '@/lib/calculate';
import { grupos } from '@/lib/questoes';

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
      const avaliacaoResult = await query(
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
      await query(
        `INSERT INTO respostas (avaliacao_id, item, valor, grupo)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (avaliacao_id, grupo, item) DO UPDATE SET valor = EXCLUDED.valor, criado_em = NOW()`,
        [avaliacaoId, resposta.item, resposta.valor, resposta.grupo]
      );
    }

    // ✅ ATUALIZAR STATUS PARA 'EM_ANDAMENTO' SE AINDA ESTIVER 'INICIADA'
    // Fazer isso ANTES de verificar auto-conclusão para garantir que o status seja atualizado
    try {
      const statusRes = await query(
        `SELECT status FROM avaliacoes WHERE id = $1`,
        [avaliacaoId]
      );
      const currentStatus = statusRes.rows[0]?.status;

      if (currentStatus === 'iniciada') {
        // Atualizar status diretamente (sem transactionWithContext que pode causar problemas com RLS)
        try {
          await query(
            `UPDATE avaliacoes SET status = 'em_andamento', atualizado_em = NOW() WHERE id = $1 AND status = 'iniciada'`,
            [avaliacaoId]
          );
          console.log(
            `[RESPOSTAS] ✅ Atualizado status da avaliação ${avaliacaoId} para 'em_andamento'`
          );
        } catch {
          // Se falhar, tentar com contexto de segurança
          console.warn(
            `[RESPOSTAS] ⚠️ Primeira tentativa falhou, usando transactionWithContext...`
          );
          await transactionWithContext(async (queryTx) => {
            await queryTx(
              `UPDATE avaliacoes SET status = 'em_andamento', atualizado_em = NOW() WHERE id = $1 AND status = 'iniciada'`,
              [avaliacaoId]
            );
          });
          console.log(
            `[RESPOSTAS] ✅ Status atualizado com transactionWithContext`
          );
        }
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
    const countResult = await query(
      `SELECT COUNT(DISTINCT (grupo, item)) as total
       FROM respostas
       WHERE avaliacao_id = $1`,
      [avaliacaoId]
    );

    const totalRespostas = parseInt(countResult.rows[0]?.total || '0');
    console.log(
      `[RESPOSTAS] Avaliação ${avaliacaoId} tem ${totalRespostas} respostas únicas`
    );

    // Verificar status atual da avaliação antes de tentar concluir
    const statusCheckResult = await query(
      `SELECT status FROM avaliacoes WHERE id = $1`,
      [avaliacaoId]
    );
    const statusAtual = statusCheckResult.rows[0]?.status;

    // Se completou 37 respostas E não está inativada, marcar como concluída automaticamente
    if (
      totalRespostas >= 37 &&
      statusAtual !== 'inativada' &&
      statusAtual !== 'concluido'
    ) {
      console.log(
        `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} COMPLETA (${totalRespostas}/37 respostas)! Status: ${statusAtual} → concluido`
      );

      // ✅ Envolver TODA a lógica de conclusão em transactionWithContext
      await transactionWithContext(async (queryTx) => {
        try {
          // Buscar todas as respostas para calcular resultados
          const todasRespostasResult = await queryTx(
            `SELECT DISTINCT ON (r.grupo, r.item) r.grupo, r.item, r.valor
             FROM respostas r
             WHERE r.avaliacao_id = $1
             ORDER BY r.grupo, r.item, r.id DESC`,
            [avaliacaoId]
          );

          // Organizar respostas por grupo
          const respostasPorGrupo = new Map<
            number,
            Array<{ item: string; valor: number }>
          >();
          todasRespostasResult.rows.forEach((r: any) => {
            if (!respostasPorGrupo.has(r.grupo)) {
              respostasPorGrupo.set(r.grupo, []);
            }
            respostasPorGrupo
              .get(r.grupo)!
              .push({ item: r.item, valor: r.valor });
          });

          // Criar mapa de tipos de grupos (incluindo dominio e tipo)
          const gruposTipo = new Map(
            grupos.map((g) => [g.id, { dominio: g.dominio, tipo: g.tipo }])
          );

          // Calcular resultados
          const todosResultados = calcularResultados(
            respostasPorGrupo,
            gruposTipo
          );

          // Salvar resultados no banco
          for (const resultado of todosResultados) {
            await queryTx(
              `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (avaliacao_id, grupo) DO UPDATE SET score = EXCLUDED.score, categoria = EXCLUDED.categoria`,
              [
                avaliacaoId,
                resultado.grupo,
                resultado.dominio,
                resultado.score,
                resultado.categoria,
              ]
            );
          }

          console.log(`[RESPOSTAS] ✅ Resultados calculados e salvos`);
        } catch (resultError) {
          console.error(
            `[RESPOSTAS] ⚠️ Erro ao calcular resultados, mas continuando conclusão:`,
            resultError
          );
          // Não bloquear a conclusão da avaliação por erro no cálculo
        }

        // Marcar como concluído (SEMPRE executar, mesmo se houver erro nos resultados)
        await queryTx(
          `UPDATE avaliacoes 
           SET status = 'concluido', envio = NOW(), atualizado_em = NOW() 
           WHERE id = $1`,
          [avaliacaoId]
        );

        console.log(
          `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} marcada como concluída com sucesso`
        );

        // Buscar lote_id e atualizar funcionário
        const loteResult = await queryTx(
          `SELECT la.id as lote_id, la.numero_ordem 
           FROM avaliacoes a
           JOIN lotes_avaliacao la ON a.lote_id = la.id
           WHERE a.id = $1`,
          [avaliacaoId]
        );

        if (loteResult.rows.length > 0) {
          const { lote_id, numero_ordem } = loteResult.rows[0];

          // Atualizar índice do funcionário
          await queryTx(
            `UPDATE funcionarios 
             SET indice_avaliacao = $1, data_ultimo_lote = NOW() 
             WHERE cpf = $2`,
            [numero_ordem, session.cpf]
          );

          console.log(
            `[RESPOSTAS] ✅ Funcionário atualizado | Lote ${String(lote_id)} será recalculado automaticamente`
          );
        }

        console.log(
          `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} marcada como concluída dentro da transação`
        );
      });

      // Chamar recalcularStatusLote APÓS a transação de conclusão
      const loteResult = await query(
        `SELECT la.id as lote_id
         FROM avaliacoes a
         JOIN lotes_avaliacao la ON a.lote_id = la.id
         WHERE a.id = $1`,
        [avaliacaoId]
      );

      if (loteResult.rows.length > 0) {
        const { lote_id } = loteResult.rows[0];
        await recalcularStatusLote(avaliacaoId);
        console.log(`[RESPOSTAS] ✅ Lote ${lote_id} recalculado`);
      }

      console.log(
        `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} concluída automaticamente - 37/37 respostas recebidas`
      );

      return NextResponse.json({
        success: true,
        completed: true,
        message:
          'Avaliação concluída com sucesso! Todas as 37 questões foram respondidas.',
      });
    } else if (totalRespostas >= 37 && statusAtual === 'concluido') {
      console.log(
        `[RESPOSTAS] ℹ️ Avaliação ${avaliacaoId} já está concluída (${totalRespostas}/37 respostas)`
      );
      return NextResponse.json({
        success: true,
        completed: true,
        message: 'Avaliação já foi concluída anteriormente.',
      });
    } else if (totalRespostas >= 37 && statusAtual === 'inativada') {
      console.log(
        `[RESPOSTAS] ⚠️ Avaliação ${avaliacaoId} está inativada e não pode ser concluída (${totalRespostas}/37 respostas)`
      );
      return NextResponse.json({
        success: true,
        completed: false,
        message: 'Avaliação inativada - não pode ser concluída.',
      });
    }

    return NextResponse.json(
      { success: true, completed: false },
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
    const avaliacaoResult = await query(
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
    const respostasResult = await query(
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
