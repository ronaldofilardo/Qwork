/**
 * Biblioteca para validação de lotes prontos para emissão de laudo
 * Centraliza a lógica de validação usada no backend para evitar discrepâncias com o frontend
 */

import { query } from '@/lib/db';

export interface ValidacaoLoteResult {
  pode_emitir_laudo: boolean;
  motivos_bloqueio: string[];
  detalhes: {
    total_avaliacoes: number;
    avaliacoes_concluidas: number;
    avaliacoes_inativadas: number;
    avaliacoes_ativas: number;
    taxa_conclusao: number;
    status_lote: string;
    indice_completo: boolean;
  };
}

/**
 * Valida se um lote está pronto para emissão de laudo
 *
 * Critérios obrigatórios:
 * 1. Status do lote deve ser 'concluido'
 * 2. Todas as avaliações ativas devem estar concluídas (não considera inativadas)
 * 3. Índice psicossocial deve estar completo (todas as respostas de grupos 1-8)
 *
 * @param loteId ID do lote a ser validado
 * @returns Promise<ValidacaoLoteResult> Resultado da validação com detalhes
 */
export async function validarLoteParaLaudo(
  loteId: number
): Promise<ValidacaoLoteResult> {
  const motivos: string[] = [];

  // 1. Buscar status e estatísticas do lote
  const loteResult = await query(
    `
    SELECT 
      l.id,
      l.status,
      COUNT(a.id) FILTER (WHERE a.status != 'rascunho') as total_avaliacoes,
      COUNT(a.id) FILTER (WHERE a.status = 'concluida') as avaliacoes_concluidas,
      COUNT(a.id) FILTER (WHERE a.status = 'inativada') as avaliacoes_inativadas,
      COUNT(a.id) FILTER (WHERE a.status IN ('iniciada', 'em_andamento', 'concluida')) as avaliacoes_ativas
    FROM lotes_avaliacao l
    LEFT JOIN avaliacoes a ON l.id = a.lote_id
    WHERE l.id = $1
    GROUP BY l.id, l.status
  `,
    [loteId]
  );

  if (!loteResult || loteResult.rows.length === 0) {
    return {
      pode_emitir_laudo: false,
      motivos_bloqueio: ['Lote não encontrado'],
      detalhes: {
        total_avaliacoes: 0,
        avaliacoes_concluidas: 0,
        avaliacoes_inativadas: 0,
        avaliacoes_ativas: 0,
        taxa_conclusao: 0,
        status_lote: 'desconhecido',
        indice_completo: false,
      },
    };
  }

  const lote = loteResult.rows[0];
  const totalAvaliacoes = parseInt(lote.total_avaliacoes) || 0;
  const avaliacoesConcluidas = parseInt(lote.avaliacoes_concluidas) || 0;
  const avaliacoesInativadas = parseInt(lote.avaliacoes_inativadas) || 0;
  const avaliacoesAtivas = parseInt(lote.avaliacoes_ativas) || 0;

  // 2. Validar status do lote
  if (lote.status !== 'concluido') {
    motivos.push(`Status do lote é '${lote.status}' (esperado: 'concluido')`);
  }

  // 3. Validar se há avaliações ativas
  if (avaliacoesAtivas === 0) {
    motivos.push('Lote não possui avaliações ativas');
  }

  // 4. Validar se todas as avaliações liberadas estão concluídas ou inativadas
  const avaliacoesLiberadas = avaliacoesConcluidas + avaliacoesInativadas;
  const avaliacoesPendentes = totalAvaliacoes - avaliacoesLiberadas;

  if (
    avaliacoesPendentes > 0 ||
    (avaliacoesAtivas > 0 && avaliacoesConcluidas === 0)
  ) {
    if (avaliacoesPendentes > 0) {
      motivos.push(
        `${avaliacoesPendentes} avaliação${avaliacoesPendentes > 1 ? 'ões' : ''} ainda não concluída${avaliacoesPendentes > 1 ? 's' : ''} ou inativada${avaliacoesPendentes > 1 ? 's' : ''}`
      );
    } else {
      const pendentes = avaliacoesAtivas - avaliacoesConcluidas;
      if (pendentes > 0) {
        motivos.push(
          `${pendentes} avaliação${pendentes > 1 ? 'ões' : ''} ativa${
            pendentes > 1 ? 's' : ''
          } ainda não concluída${pendentes > 1 ? 's' : ''}`
        );
      }
    }
  }

  // 5. Calcular taxa de conclusão
  const taxaConclusao =
    avaliacoesAtivas > 0 ? (avaliacoesConcluidas / avaliacoesAtivas) * 100 : 0;

  // 7. Verificar se índice está completo (grupos 1-8 do COPSOQ)
  // Cada grupo tem um conjunto de questões que devem estar respondidas
  let indiceCompleto = true;
  try {
    const indiceResult = await query(
      `
      SELECT 
        COUNT(DISTINCT (r.grupo, r.item)) as respostas_unicas,
        (
          -- Total esperado: grupos 1-8 do COPSOQ
          -- Cada grupo tem diferentes quantidades de itens
          SELECT COUNT(*)
          FROM generate_series(1, 8) g
          CROSS JOIN LATERAL (
            SELECT DISTINCT item 
            FROM respostas r2
            JOIN avaliacoes a2 ON r2.avaliacao_id = a2.id
            WHERE r2.grupo = g AND a2.status = 'concluida' AND a2.lote_id = $1
          ) items
        ) as total_questoes_necessarias
      FROM respostas r
      JOIN avaliacoes a ON r.avaliacao_id = a.id
      WHERE a.lote_id = $1
        AND a.status = 'concluida'
        AND r.grupo IN (1, 2, 3, 4, 5, 6, 7, 8)
    `,
      [loteId]
    );

    const respostasUnicas =
      parseInt(indiceResult.rows[0]?.respostas_unicas) || 0;
    const totalQuestoesNecessarias =
      parseInt(indiceResult.rows[0]?.total_questoes_necessarias) || 0;

    // Para índice completo, precisamos ter pelo menos uma resposta por questão
    // em pelo menos uma avaliação concluída
    indiceCompleto =
      totalQuestoesNecessarias > 0 &&
      respostasUnicas >= totalQuestoesNecessarias;

    if (!indiceCompleto) {
      motivos.push(
        `Índice psicossocial incompleto (${respostasUnicas}/${totalQuestoesNecessarias} questões respondidas)`
      );
    }
  } catch (error) {
    console.error('Erro ao verificar índice:', error);
    indiceCompleto = false;
    motivos.push('Erro ao verificar completude do índice psicossocial');
  }

  const podeEmitir = motivos.length === 0;

  return {
    pode_emitir_laudo: podeEmitir,
    motivos_bloqueio: motivos,
    detalhes: {
      total_avaliacoes: totalAvaliacoes,
      avaliacoes_concluidas: avaliacoesConcluidas,
      avaliacoes_inativadas: avaliacoesInativadas,
      avaliacoes_ativas: avaliacoesAtivas,
      taxa_conclusao: taxaConclusao,
      status_lote: lote.status,
      indice_completo: indiceCompleto,
    },
  };
}

/**
 * Valida múltiplos lotes de uma vez (útil para listagens)
 *
 * @param loteIds Array de IDs de lotes a serem validados
 * @returns Promise<Map<number, ValidacaoLoteResult>> Mapa de loteId -> ValidacaoLoteResult
 */
export async function validarLotesParaLaudo(
  loteIds: number[]
): Promise<Map<number, ValidacaoLoteResult>> {
  const resultados = new Map<number, ValidacaoLoteResult>();

  // Validar em paralelo para melhor performance
  await Promise.all(
    loteIds.map(async (loteId) => {
      const validacao = await validarLoteParaLaudo(loteId);
      resultados.set(loteId, validacao);
    })
  );

  return resultados;
}
