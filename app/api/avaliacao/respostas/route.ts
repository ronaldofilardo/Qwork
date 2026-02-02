import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
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
         ON CONFLICT (avaliacao_id, grupo, item) DO UPDATE SET valor = EXCLUDED.valor`,
        [avaliacaoId, resposta.item, resposta.valor, resposta.grupo]
      );
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

    // Se completou 37 respostas, marcar como concluída automaticamente
    if (totalRespostas >= 37) {
      console.log(
        `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} COMPLETA! Marcando como concluída...`
      );

      try {
        // Buscar todas as respostas para calcular resultados
        const todasRespostasResult = await query(
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
          await query(
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

      // Marcar como concluída (SEMPRE executar, mesmo se houver erro nos resultados)
      await queryWithContext(
        `UPDATE avaliacoes 
         SET status = 'concluida', envio = NOW(), atualizado_em = NOW() 
         WHERE id = $1`,
        [avaliacaoId]
      );

      console.log(
        `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} marcada como concluída`
      );

      // Buscar lote_id
      const loteResult = await query(
        `SELECT la.id as lote_id, la.numero_ordem 
         FROM avaliacoes a
         JOIN lotes_avaliacao la ON a.lote_id = la.id
         WHERE a.id = $1`,
        [avaliacaoId]
      );

      if (loteResult.rows.length > 0) {
        const { lote_id, numero_ordem } = loteResult.rows[0];

        // Atualizar índice do funcionário
        await query(
          `UPDATE funcionarios 
           SET indice_avaliacao = $1, data_ultimo_lote = NOW() 
           WHERE cpf = $2`,
          [numero_ordem, session.cpf]
        );

        // Recalcular status do lote e notificar liberador
        await recalcularStatusLote(avaliacaoId);

        console.log(`[RESPOSTAS] ✅ Lote ${lote_id} recalculado`);
      }

      console.log(
        `[RESPOSTAS] ✅ Avaliação ${avaliacaoId} concluída e notificação enviada!`
      );

      return NextResponse.json({
        success: true,
        completed: true,
        message: 'Avaliação concluída com sucesso!',
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
