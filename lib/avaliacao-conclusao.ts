/**
 * Módulo para gerenciamento de conclusão automática de avaliações
 * Consolida lógica de auto-conclusão ao atingir 37 respostas
 */

import { queryWithContext, transactionWithContext } from './db-security';
import { calcularResultados } from './calculate';
import { recalcularStatusLote } from './lotes';
import { grupos } from './questoes';

interface AutoConclusaoResult {
  concluida: boolean;
  avaliacaoId: number;
  totalRespostas: number;
  loteId?: number;
  mensagem: string;
}

/**
 * Verifica e executa auto-conclusão de avaliação ao atingir 37 respostas
 *
 * @param avaliacaoId - ID da avaliação a verificar
 * @param funcionarioCpf - CPF do funcionário (para atualizar índice)
 * @returns Resultado da operação com status de conclusão
 *
 * Esta função é IDEMPOTENTE: pode ser chamada múltiplas vezes com segurança
 */
export async function verificarEConcluirAvaliacao(
  avaliacaoId: number,
  funcionarioCpf: string
): Promise<AutoConclusaoResult> {
  // ✅ VERIFICAR SE COMPLETOU 37 RESPOSTAS
  // Usar queryWithContext para garantir que o contexto RLS seja respeitado
  // e que a contagem seja feita com o acesso correto ao usuário
  const countResult = await queryWithContext(
    `SELECT COUNT(DISTINCT (grupo, item)) as total
     FROM respostas
     WHERE avaliacao_id = $1`,
    [avaliacaoId]
  );

  const totalRespostas = parseInt((countResult.rows[0]?.total as string) || '0');
  console.log(
    `[AUTO-CONCLUSÃO] Avaliação ${avaliacaoId} tem ${totalRespostas} respostas únicas`
  );

  // Se não completou 37 respostas, retornar sem fazer nada
  if (totalRespostas < 37) {
    return {
      concluida: false,
      avaliacaoId,
      totalRespostas,
      mensagem: `Avaliação incompleta (${totalRespostas}/37 respostas)`,
    };
  }

  // Verificar status atual da avaliação antes de tentar concluir
  // Usar queryWithContext para garantir contexto RLS correto
  const statusCheckResult = await queryWithContext(
    `SELECT status FROM avaliacoes WHERE id = $1`,
    [avaliacaoId]
  );
  const statusAtual = (statusCheckResult.rows[0]?.status as string | undefined) || '';

  // Se já está concluída ou inativada, não fazer nada (IDEMPOTÊNCIA)
  if (statusAtual === 'concluida') {
    console.log(
      `[AUTO-CONCLUSÃO] ⚠️ Avaliação ${avaliacaoId} já está concluída (idempotente)`
    );
    return {
      concluida: true,
      avaliacaoId,
      totalRespostas,
      mensagem: 'Avaliação já estava concluída',
    };
  }

  if (statusAtual === 'inativada') {
    console.log(
      `[AUTO-CONCLUSÃO] ⚠️ Avaliação ${avaliacaoId} está inativada - não será concluída`
    );
    return {
      concluida: false,
      avaliacaoId,
      totalRespostas,
      mensagem: 'Avaliação inativada - não pode ser concluída',
    };
  }

  // ✅ INICIAR PROCESSO DE CONCLUSÃO
  console.log(
    `[AUTO-CONCLUSAO] Avaliacao ${avaliacaoId} COMPLETA (${totalRespostas}/37 respostas)! Status: ${statusAtual || 'iniciada'} -> concluida`
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
        respostasPorGrupo.get(r.grupo)!.push({ item: r.item, valor: r.valor });
      });

      // Criar mapa de tipos de grupos (incluindo dominio e tipo)
      const gruposTipo = new Map<
        number,
        { dominio: string; tipo: 'positiva' | 'negativa' }
      >(grupos.map((g) => [g.id, { dominio: g.dominio, tipo: g.tipo }]));

      // Calcular resultados
      const todosResultados = calcularResultados(respostasPorGrupo, gruposTipo);

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

      console.log(`[AUTO-CONCLUSÃO] ✅ Resultados calculados e salvos`);
    } catch (resultError) {
      console.error(
        `[AUTO-CONCLUSÃO] ⚠️ Erro ao calcular resultados, mas continuando conclusão:`,
        resultError
      );
      // Não bloquear a conclusão da avaliação por erro no cálculo
    }

    // Marcar como concluído (SEMPRE executar, mesmo se houver erro nos resultados)
    await queryTx(
      `UPDATE avaliacoes 
       SET status = 'concluida', envio = NOW(), atualizado_em = NOW() 
       WHERE id = $1`,
      [avaliacaoId]
    );

    console.log(
      `[AUTO-CONCLUSÃO] ✅ Avaliação ${avaliacaoId} marcada como concluída com sucesso`
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
        [numero_ordem, funcionarioCpf]
      );

      console.log(
        `[AUTO-CONCLUSÃO] ✅ Funcionário atualizado | Lote ${String(lote_id)} será recalculado automaticamente`
      );
    }

    console.log(
      `[AUTO-CONCLUSÃO] ✅ Avaliação ${avaliacaoId} marcada como concluída dentro da transação`
    );
  });

  // Chamar recalcularStatusLote APÓS a transação de conclusão
  // Usar queryWithContext para manter contexto RLS consistente
  const loteResult = await queryWithContext(
    `SELECT la.id as lote_id
     FROM avaliacoes a
     JOIN lotes_avaliacao la ON a.lote_id = la.id
     WHERE a.id = $1`,
    [avaliacaoId]
  );

  let loteId: number | undefined;
  if (loteResult.rows.length > 0) {
    loteId = loteResult.rows[0].lote_id as number;
    await recalcularStatusLote(avaliacaoId);
    console.log(`[AUTO-CONCLUSÃO] ✅ Lote ${loteId} recalculado`);
  }

  console.log(
    `[AUTO-CONCLUSÃO] ✅ Avaliação ${avaliacaoId} concluída automaticamente - 37/37 respostas recebidas`
  );

  return {
    concluida: true,
    avaliacaoId,
    totalRespostas,
    loteId,
    mensagem: 'Avaliação concluída automaticamente com sucesso',
  };
}
