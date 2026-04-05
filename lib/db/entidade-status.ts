/**
 * lib/db/entidade-status.ts
 *
 * Funções de gestão de status de entidades:
 * aprovar, ativar, rejeitar, solicitar reanálise.
 * Extraído de lib/db/entidade-helpers.ts.
 */

import { query } from './query';
import type { Session } from '../session';
import type { Entidade } from './entidade-crud';

const DEBUG_DB =
  !!process.env.DEBUG_DB ||
  process.env.NODE_ENV === 'test' ||
  !!process.env.JEST_WORKER_ID;

// ============================================================================
// GESTÃO DE STATUS
// ============================================================================

/**
 * Aprovar entidade
 */
export async function aprovarEntidade(
  id: number,
  aprovadoPorCpf: string,
  session?: Session
): Promise<Entidade> {
  const entidadeResult = await query<Entidade>(
    'SELECT * FROM entidades WHERE id = $1',
    [id],
    session
  );

  if (entidadeResult.rows.length === 0) {
    throw new Error('Entidade não encontrada');
  }

  const entidade = entidadeResult.rows[0];

  const result = await query<Entidade>(
    `UPDATE entidades
     SET status = 'aprovado',
         aprovado_em = CURRENT_TIMESTAMP,
         aprovado_por_cpf = $2
     WHERE id = $1
     RETURNING *`,
    [id, aprovadoPorCpf],
    session
  );

  const entidadeAprovada = result.rows[0];

  // Se for uma clínica, criar entrada na tabela clinicas
  if (entidade.tipo === 'clinica') {
    try {
      const clinicaResult = await query(
        `INSERT INTO clinicas (nome, cnpj, email, telefone, endereco, entidade_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (cnpj) DO UPDATE SET entidade_id = EXCLUDED.entidade_id, ativa = COALESCE(clinicas.ativa, true), atualizado_em = CURRENT_TIMESTAMP
         RETURNING id`,
        [
          entidade.nome,
          entidade.cnpj,
          entidade.email,
          entidade.telefone,
          entidade.endereco,
          entidade.id,
        ],
        session
      );

      if (clinicaResult.rows.length > 0) {
        console.log(
          `[APROVAR_ENTIDADE] Clínica criada com ID: ${clinicaResult.rows[0].id} para entidade ${entidade.id}`
        );
      }
    } catch (error) {
      console.error('[APROVAR_ENTIDADE] Erro ao criar clínica:', error);
    }
  }

  return entidadeAprovada;
}

/**
 * Ativar entidade após pagamento confirmado
 */
export async function ativarEntidade(
  id: number,
  session?: Session
): Promise<{ success: boolean; message: string; tomador?: Entidade }> {
  const checkResult = await query<{
    ativa: boolean;
  }>('SELECT ativa FROM entidades WHERE id = $1', [id], session);

  if (checkResult.rows.length === 0) {
    return { success: false, message: 'Entidade não encontrada' };
  }

  const { ativa } = checkResult.rows[0];

  if (DEBUG_DB) console.log(`[ativarEntidade] ID=${id}, ativa=${ativa}`);

  if (ativa) {
    return { success: false, message: 'Entidade já está ativo' };
  }

  // Verificar recibo
  const reciboCheck = await query(
    'SELECT id FROM recibos WHERE entidade_id = $1 AND cancelado = false LIMIT 1',
    [id],
    session
  );
  if (reciboCheck.rows.length === 0) {
    if (DEBUG_DB)
      console.warn(
        `[ativarEntidade] Nenhum recibo encontrado para entidade ${id}. Prosseguindo porque recibos são gerados sob demanda.`
      );
  }

  const result = await query<Entidade>(
    `UPDATE entidades
     SET ativa = true,
         status = CASE WHEN status <> 'aprovado' THEN 'aprovado' ELSE status END,
         aprovado_em = COALESCE(aprovado_em, CURRENT_TIMESTAMP),
         aprovado_por_cpf = COALESCE(aprovado_por_cpf, '00000000000')
     WHERE id = $1
     RETURNING *`,
    [id],
    session
  );

  if (result.rows.length === 0) {
    return { success: false, message: 'Falha ao ativar tomador' };
  }

  console.log(`[ativarEntidade] Entidade ativado: ${result.rows[0].nome}`);

  return {
    success: true,
    message: 'Entidade ativado com sucesso',
    tomador: result.rows[0],
  };
}

/**
 * Rejeitar entidade
 */
export async function rejeitarEntidade(
  id: number,
  motivo: string,
  session?: Session
): Promise<Entidade> {
  const result = await query<Entidade>(
    `UPDATE entidades 
     SET status = 'rejeitado', motivo_rejeicao = $2
     WHERE id = $1 
     RETURNING *`,
    [id, motivo],
    session
  );
  return result.rows[0];
}

/**
 * Solicitar reanálise
 */
export async function solicitarReanalise(
  id: number,
  observacoes: string,
  session?: Session
): Promise<Entidade> {
  const result = await query<Entidade>(
    `UPDATE entidades
     SET status = 'em_reanalise',
         observacoes_reanalise = $2,
         ativa = false,
         data_primeiro_pagamento = NULL
     WHERE id = $1
     RETURNING *`,
    [id, observacoes],
    session
  );
  return result.rows[0];
}
