import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';
import { grupos } from '@/lib/questoes';
import { recalcularStatusLote } from '@/lib/lotes';
import { calcularResultados } from '@/lib/calculate';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { grupo, respostas } = await request.json();

    // Validar dados
    if (!grupo || !respostas || !Array.isArray(respostas)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    // Buscar avaliação em andamento ou criar nova se não existir
    let avaliacaoId: number;
    let loteId: number | null = null;
    const avaliacaoResult = await query(
      `SELECT id, lote_id FROM avaliacoes
       WHERE funcionario_cpf = $1 AND status IN ('iniciada', 'em_andamento')
       ORDER BY inicio DESC LIMIT 1`,
      [session.cpf]
    );

    if (avaliacaoResult.rows.length === 0) {
      // Criar nova avaliação
      const newAvaliacao = await query(
        `INSERT INTO avaliacoes (funcionario_cpf, status)
         VALUES ($1, 'em_andamento')
         RETURNING id, lote_id`,
        [session.cpf]
      );
      avaliacaoId = newAvaliacao.rows[0].id;
      loteId = newAvaliacao.rows[0].lote_id;
    } else {
      avaliacaoId = avaliacaoResult.rows[0].id;
      loteId = avaliacaoResult.rows[0].lote_id;
    }

    // Salvar respostas (upsert)
    for (const resposta of respostas) {
      await query(
        `INSERT INTO respostas (avaliacao_id, grupo, item, valor)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (avaliacao_id, grupo, item) 
         DO UPDATE SET valor = EXCLUDED.valor`,
        [avaliacaoId, resposta.grupo, resposta.item, resposta.valor]
      );
    }

    // Contar total de respostas únicas (grupo, item)
    const respostasCountResult = await query(
      `SELECT COUNT(DISTINCT (grupo, item)) as total 
       FROM respostas 
       WHERE avaliacao_id = $1`,
      [avaliacaoId]
    );

    const totalRespostas = parseInt(respostasCountResult.rows[0]?.total || '0');
    const totalPerguntasObrigatorias = grupos.reduce(
      (acc, g) => acc + g.itens.length,
      0
    );

    console.log(
      `[SAVE] Avaliação ${avaliacaoId}: ${totalRespostas}/${totalPerguntasObrigatorias} respostas`
    );

    // Verificar se completou todas as 37 respostas
    if (totalRespostas >= totalPerguntasObrigatorias) {
      console.log(
        `[SAVE] ✅ Avaliação ${avaliacaoId} COMPLETA! Marcando como concluída...`
      );

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
        respostasPorGrupo.get(r.grupo)!.push({ item: r.item, valor: r.valor });
      });

      // Criar mapa de tipos de grupos
      const gruposTipo = new Map(
        grupos.map((g) => [g.id, { dominio: g.dominio, tipo: g.tipo }])
      );

      // Calcular resultados
      const resultados = calcularResultados(respostasPorGrupo, gruposTipo);

      // Salvar resultados no banco
      for (const resultado of resultados) {
        await query(
          `INSERT INTO resultados (avaliacao_id, grupo, dominio, score, categoria)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (avaliacao_id, grupo)
           DO UPDATE SET score = EXCLUDED.score, categoria = EXCLUDED.categoria`,
          [
            avaliacaoId,
            resultado.grupo,
            resultado.dominio,
            resultado.score,
            resultado.categoria,
          ]
        );
      }

      // Marcar como concluída
      await queryWithContext(
        `UPDATE avaliacoes 
         SET status = 'concluida', envio = NOW(), atualizado_em = NOW() 
         WHERE id = $1`,
        [avaliacaoId]
      );

      // Atualizar índice do funcionário
      if (loteId) {
        const loteResult = await query(
          `SELECT numero_ordem, liberado_em FROM lotes_avaliacao WHERE id = $1`,
          [loteId]
        );

        if (loteResult.rows.length > 0) {
          const { numero_ordem } = loteResult.rows[0];
          await query(
            `UPDATE funcionarios 
             SET indice_avaliacao = $1, data_ultimo_lote = NOW() 
             WHERE cpf = $2`,
            [numero_ordem, session.cpf]
          );
        }

        // Recalcular status do lote e notificar liberador
        await recalcularStatusLote(loteId);
      }

      console.log(
        `[SAVE] ✅ Avaliação ${avaliacaoId} concluída e notificação enviada!`
      );

      return NextResponse.json({
        success: true,
        avaliacaoId,
        completed: true,
        message: 'Avaliação concluída com sucesso!',
      });
    }

    // Ainda não completou - apenas atualizar grupo_atual
    const grupoObj = grupos.find((g) => g.id === grupo);
    const totalItensGrupo = grupoObj ? grupoObj.itens.length : 0;
    const respostasNoGrupo = respostas.length;

    let grupoAtualParaSalvar = grupo;
    if (totalItensGrupo > 0 && respostasNoGrupo >= totalItensGrupo) {
      grupoAtualParaSalvar = grupo + 1;
    }

    await queryWithContext(
      'UPDATE avaliacoes SET grupo_atual = $1, status = $2, atualizado_em = NOW() WHERE id = $3',
      [grupoAtualParaSalvar, 'em_andamento', avaliacaoId]
    );

    return NextResponse.json({ success: true, avaliacaoId, completed: false });
  } catch (error) {
    console.error('Erro ao salvar avaliação:', error);
    return NextResponse.json({ error: 'Erro ao salvar' }, { status: 500 });
  }
}
