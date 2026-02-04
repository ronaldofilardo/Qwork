import { query } from '@/lib/db';
import type { FuncionarioComAvaliacao, LoteInfo } from '@/lib/types/database';

/**
 * Busca funcionários que participam de um lote específico
 * Inclui dados da avaliação (status, datas de início e conclusão)
 *
 * @param loteId - ID do lote de avaliações
 * @param empresaId - ID da empresa (para validação)
 * @param clinicaId - ID da clínica (para validação de permissões)
 * @returns Array de funcionários com dados de avaliação
 */
export async function getFuncionariosPorLote(
  loteId: number,
  empresaId: number,
  clinicaId: number,
  limit?: number,
  offset?: number
): Promise<FuncionarioComAvaliacao[]> {
  let sql = `
    SELECT 
      cpf,
      nome,
      setor,
      funcao,
      matricula,
      turno,
      escala,
      avaliacao_id,
      status_avaliacao,
      data_conclusao,
      data_inicio
    FROM vw_funcionarios_por_lote
    WHERE lote_id = $1 
      AND empresa_id = $2 
      AND clinica_id = $3
    ORDER BY nome ASC
  `;

  const params: unknown[] = [loteId, empresaId, clinicaId];

  if (limit !== undefined && offset !== undefined) {
    sql += ` LIMIT $4 OFFSET $5`;
    params.push(limit, offset);
  }

  const result = await query(sql, params);

  return result.rows as FuncionarioComAvaliacao[];
}

/**
 * Busca informações detalhadas de um lote específico
 *
 * @param loteId - ID do lote
 * @param empresaId - ID da empresa (para validação)
 * @param clinicaId - ID da clínica (para validação de permissões)
 * @returns Informações do lote ou null se não encontrado
 */
export async function getLoteInfo(
  loteId: number,
  empresaId: number,
  clinicaId: number
): Promise<LoteInfo | null> {
  const result = await query(
    `
    SELECT 
      la.id,
      la.descricao,
      la.tipo,
      la.status,
      la.liberado_em,
      la.liberado_por,
      f.nome as liberado_por_nome,
      la.empresa_id,
      ec.nome as empresa_nome,
      l.id as laudo_id,
      l.status as laudo_status,
      l.emitido_em as laudo_emitido_em,
      l.enviado_em as laudo_enviado_em,
      la.hash_pdf as hash_pdf,
      CASE WHEN fe.id IS NOT NULL THEN true ELSE false END as emissao_solicitada,
      fe.solicitado_em as emissao_solicitado_em,
      CASE WHEN l.id IS NOT NULL AND l.status != 'rascunho' THEN true ELSE false END as tem_laudo
    FROM lotes_avaliacao la
    LEFT JOIN funcionarios f ON la.liberado_por = f.cpf
    JOIN empresas_clientes ec ON la.empresa_id = ec.id
    LEFT JOIN laudos l ON l.lote_id = la.id
    LEFT JOIN v_fila_emissao fe ON fe.lote_id = la.id
    WHERE la.id = $1 
      AND la.empresa_id = $2
      AND la.status != 'cancelado'
      AND ec.clinica_id = $3
  `,
    [loteId, empresaId, clinicaId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0] as LoteInfo;
}

/**
 * Busca estatísticas de um lote específico
 *
 * @param loteId - ID do lote
 * @returns Estatísticas do lote (total, concluídas, inativadas)
 */
export async function getLoteEstatisticas(loteId: number) {
  const result = await query(
    `
    SELECT
      COUNT(a.id) as total_avaliacoes,
      COUNT(CASE WHEN a.status = 'concluida' THEN 1 END) as avaliacoes_concluidas,
      COUNT(CASE WHEN a.status = 'inativada' THEN 1 END) as avaliacoes_inativadas,
      COUNT(CASE WHEN a.status = 'iniciada' OR a.status = 'em_andamento' THEN 1 END) as avaliacoes_pendentes
    FROM avaliacoes a
    WHERE a.lote_id = $1
  `,
    [loteId]
  );

  return result.rows[0];
}
