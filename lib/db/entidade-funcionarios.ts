/**
 * lib/db/entidade-funcionarios.ts
 *
 * Funções de vínculo funcionário-entidade e utilitários multi-tenant.
 * Extraído de lib/db/entidade-helpers.ts.
 */

import { query } from './query';
import type { QueryResult } from './query';
import type { Session } from '../session';
import type { TipoEntidade, Entidade } from './entidade-crud';

// ============================================================================
// TIPOS
// ============================================================================

export interface EntidadeFuncionario {
  id: number;
  funcionario_id: number;
  entidade_id: number;
  tipo_tomador: TipoEntidade;
  vinculo_ativo: boolean;
  data_inicio: Date;
  data_fim?: Date;
  criado_em: Date;
  atualizado_em: Date;
}

// ============================================================================
// VÍNCULO FUNCIONÁRIO-ENTIDADE
// ============================================================================

/**
 * Criar vínculo polimórfico entre funcionário e tomador
 */
export async function vincularFuncionarioEntidade(
  funcionarioId: number,
  entidadeId: number,
  tipoEntidade: TipoEntidade,
  session?: Session
): Promise<EntidadeFuncionario> {
  const result = await query<EntidadeFuncionario>(
    `INSERT INTO funcionarios_entidades (funcionario_id, entidade_id, tipo_tomador, vinculo_ativo)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (funcionario_id, entidade_id) 
     DO UPDATE SET vinculo_ativo = true, atualizado_em = CURRENT_TIMESTAMP
     RETURNING *`,
    [funcionarioId, entidadeId, tipoEntidade],
    session
  );
  return result.rows[0];
}

/**
 * Buscar entidade de um funcionário
 */
export async function getEntidadeDeFuncionario(
  funcionarioId: number,
  session?: Session
): Promise<Entidade | null> {
  const result = await query<Entidade>(
    `SELECT c.* FROM entidades c
     INNER JOIN funcionarios_entidades cf ON cf.entidade_id = c.id
     WHERE cf.funcionario_id = $1 AND cf.vinculo_ativo = true AND c.ativa = true
     ORDER BY cf.criado_em DESC
     LIMIT 1`,
    [funcionarioId],
    session
  );
  return result.rows[0] || null;
}

/**
 * Buscar funcionários de um tomador
 */
export async function getFuncionariosDeEntidade(
  entidadeId: number,
  apenasAtivos: boolean = true,
  session?: Session
) {
  const queryText = apenasAtivos
    ? `SELECT f.* FROM funcionarios f
       INNER JOIN funcionarios_entidades cf ON cf.funcionario_id = f.id
       WHERE cf.entidade_id = $1 AND cf.vinculo_ativo = true AND f.ativo = true`
    : `SELECT f.* FROM funcionarios f
       INNER JOIN funcionarios_entidades cf ON cf.funcionario_id = f.id
       WHERE cf.entidade_id = $1`;

  const result = await query(queryText, [entidadeId], session);
  return result.rows;
}

// ============================================================================
// UTILITÁRIOS MULTI-TENANT
// ============================================================================

/**
 * Helper seguro para queries multi-tenant
 */
export async function queryMultiTenant<T = unknown>(
  text: string,
  params: unknown[],
  tenantFilter: { clinica_id?: number; entidade_id?: number },
  session?: Session
): Promise<QueryResult<T>> {
  if (!tenantFilter.clinica_id && !tenantFilter.entidade_id) {
    throw new Error(
      'ERRO DE SEGURANÇA: queryMultiTenant requer clinica_id ou entidade_id'
    );
  }

  let filteredQuery = text;
  const filteredParams = [...params];

  if (tenantFilter.clinica_id) {
    const hasWhere = /WHERE/i.test(filteredQuery);
    filteredQuery += hasWhere
      ? ` AND clinica_id = $${filteredParams.length + 1}`
      : ` WHERE clinica_id = $${filteredParams.length + 1}`;
    filteredParams.push(tenantFilter.clinica_id);
  }

  if (tenantFilter.entidade_id) {
    const hasWhere = /WHERE/i.test(filteredQuery);
    filteredQuery += hasWhere
      ? ` AND entidade_id = $${filteredParams.length + 1}`
      : ` WHERE entidade_id = $${filteredParams.length + 1}`;
    filteredParams.push(tenantFilter.entidade_id);
  }

  return query<T>(filteredQuery, filteredParams, session);
}

/**
 * Contar funcionários ativos para um contrato de plano
 */
export async function contarFuncionariosAtivos(
  contratoId: number,
  session?: Session
): Promise<number> {
  const result = await query<{ total: number }>(
    `SELECT COUNT(DISTINCT f.cpf) as total
     FROM contratos_planos cp
     LEFT JOIN funcionarios_entidades fe ON (
       cp.tipo_tomador = 'entidade' AND fe.entidade_id = cp.entidade_id AND fe.ativo = true
     )
     LEFT JOIN funcionarios_clinicas fc ON (
       cp.tipo_tomador = 'clinica' AND fc.clinica_id = cp.clinica_id AND fc.ativo = true
     )
     LEFT JOIN funcionarios f ON (
       (fe.funcionario_id = f.id OR fc.funcionario_id = f.id) AND f.status = 'ativo'
     )
     WHERE cp.id = $1`,
    [contratoId],
    session
  );

  return result.rows[0]?.total || 0;
}
