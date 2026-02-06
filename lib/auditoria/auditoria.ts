/**
 * Sistema de Auditoria
 * Registra e consulta logs de auditoria
 */

import { query } from '../db';
import crypto from 'crypto';

export type EntidadeTipo =
  | 'contratante'
  | 'contrato'
  | 'pagamento'
  | 'recibo'
  | 'plano'
  | 'funcionario'
  | 'usuario'
  | 'login';

export type AcaoTipo =
  | 'criar'
  | 'atualizar'
  | 'deletar'
  | 'aprovar'
  | 'rejeitar'
  | 'ativar'
  | 'desativar'
  | 'aceitar_contrato'
  | 'confirmar_pagamento'
  | 'gerar_recibo'
  | 'liberar_login'
  | 'bloquear_login'
  | 'login_sucesso'
  | 'login_falha'
  | 'logout';

export interface AuditoriaInput {
  entidade_tipo: EntidadeTipo;
  entidade_id?: number | null;
  acao: AcaoTipo;
  status_anterior?: string;
  status_novo?: string;
  usuario_cpf?: string;
  usuario_perfil?: string;
  ip_address?: string;
  user_agent?: string;
  dados_alterados?: Record<string, any>;
  metadados?: Record<string, any>;
}

export interface AuditoriaRecord extends AuditoriaInput {
  id: number;
  hash_operacao: string;
  criado_em: string;
}

/**
 * Gera hash SHA-256 para verificação de integridade
 */
function gerarHashAuditoria(input: AuditoriaInput): string {
  const stringConcatenada = [
    input.entidade_tipo,
    input.entidade_id,
    input.acao,
    JSON.stringify(input.dados_alterados || {}),
    new Date().toISOString(),
  ].join('|');

  return crypto.createHash('sha256').update(stringConcatenada).digest('hex');
}

/**
 * Registra uma ação na auditoria
 */
export async function registrarAuditoria(
  input: AuditoriaInput
): Promise<AuditoriaRecord> {
  const hash = gerarHashAuditoria(input);

  const result = await query<AuditoriaRecord>(
    `
    INSERT INTO auditoria (
      entidade_tipo,
      entidade_id,
      acao,
      status_anterior,
      status_novo,
      usuario_cpf,
      usuario_perfil,
      ip_address,
      user_agent,
      dados_alterados,
      metadados,
      hash_operacao
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `,
    [
      input.entidade_tipo,
      input.entidade_id,
      input.acao,
      input.status_anterior || null,
      input.status_novo || null,
      input.usuario_cpf || null,
      input.usuario_perfil || null,
      input.ip_address || null,
      input.user_agent || null,
      input.dados_alterados ? JSON.stringify(input.dados_alterados) : null,
      input.metadados ? JSON.stringify(input.metadados) : null,
      hash,
    ]
  );

  return result.rows[0];
}

/**
 * Consulta auditoria de uma entidade específica
 */
export async function consultarAuditoriaPorEntidade(
  entidade_tipo: EntidadeTipo,
  entidade_id: number,
  limite: number = 50
): Promise<AuditoriaRecord[]> {
  const result = await query<AuditoriaRecord>(
    `
    SELECT * FROM auditoria
    WHERE entidade_tipo = $1 AND entidade_id = $2
    ORDER BY criado_em DESC
    LIMIT $3
  `,
    [entidade_tipo, entidade_id, limite]
  );

  return result.rows;
}

/**
 * Consulta auditoria por usuário
 */
export async function consultarAuditoriaPorUsuario(
  usuario_cpf: string,
  limite: number = 50
): Promise<AuditoriaRecord[]> {
  const result = await query<AuditoriaRecord>(
    `
    SELECT * FROM auditoria
    WHERE usuario_cpf = $1
    ORDER BY criado_em DESC
    LIMIT $2
  `,
    [usuario_cpf, limite]
  );

  return result.rows;
}

/**
 * Consulta auditoria por tipo de ação
 */
export async function consultarAuditoriaPorAcao(
  acao: AcaoTipo,
  data_inicio?: Date,
  data_fim?: Date,
  limite: number = 100
): Promise<AuditoriaRecord[]> {
  let sql = `
    SELECT * FROM auditoria
    WHERE acao = $1
  `;

  const params: any[] = [acao];
  let paramIndex = 2;

  if (data_inicio) {
    sql += ` AND criado_em >= $${paramIndex}`;
    params.push(data_inicio);
    paramIndex++;
  }

  if (data_fim) {
    sql += ` AND criado_em <= $${paramIndex}`;
    params.push(data_fim);
    paramIndex++;
  }

  sql += ` ORDER BY criado_em DESC LIMIT $${paramIndex}`;
  params.push(limite);

  const result = await query<AuditoriaRecord>(sql, params);
  return result.rows;
}

/**
 * Verifica integridade de um registro de auditoria
 */
export async function verificarIntegridadeAuditoria(
  auditoria_id: number
): Promise<{ valido: boolean; hash_esperado?: string; hash_atual?: string }> {
  const result = await query<AuditoriaRecord>(
    `SELECT * FROM auditoria WHERE id = $1`,
    [auditoria_id]
  );

  if (result.rows.length === 0) {
    return { valido: false };
  }

  const registro = result.rows[0];
  const hashCalculado = gerarHashAuditoria(registro);

  return {
    valido: hashCalculado === registro.hash_operacao,
    hash_esperado: hashCalculado,
    hash_atual: registro.hash_operacao,
  };
}

/**
 * Obtém estatísticas de auditoria
 */
export async function obterEstatisticasAuditoria(
  data_inicio?: Date,
  data_fim?: Date
): Promise<{
  total_registros: number;
  por_entidade: Record<EntidadeTipo, number>;
  por_acao: Record<AcaoTipo, number>;
  usuarios_mais_ativos: Array<{ usuario_cpf: string; total: number }>;
}> {
  let filtroData = '';
  const params: any[] = [];

  if (data_inicio || data_fim) {
    let paramIndex = 1;
    const condicoes: string[] = [];

    if (data_inicio) {
      condicoes.push(`criado_em >= $${paramIndex}`);
      params.push(data_inicio);
      paramIndex++;
    }

    if (data_fim) {
      condicoes.push(`criado_em <= $${paramIndex}`);
      params.push(data_fim);
    }

    if (condicoes.length > 0) {
      filtroData = `WHERE ${condicoes.join(' AND ')}`;
    }
  }

  // Total de registros
  const totalResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM auditoria ${filtroData}`,
    params
  );
  const total = parseInt(totalResult.rows[0].count);

  // Por entidade
  const entidadeResult = await query<{
    entidade_tipo: EntidadeTipo;
    count: string;
  }>(
    `
    SELECT entidade_tipo, COUNT(*) as count
    FROM auditoria ${filtroData}
    GROUP BY entidade_tipo
  `,
    params
  );
  const por_entidade = Object.fromEntries(
    entidadeResult.rows.map((r) => [r.entidade_tipo, parseInt(r.count)])
  ) as Record<EntidadeTipo, number>;

  // Por ação
  const acaoResult = await query<{ acao: AcaoTipo; count: string }>(
    `
    SELECT acao, COUNT(*) as count
    FROM auditoria ${filtroData}
    GROUP BY acao
  `,
    params
  );
  const por_acao = Object.fromEntries(
    acaoResult.rows.map((r) => [r.acao, parseInt(r.count)])
  ) as Record<AcaoTipo, number>;

  // Usuários mais ativos
  const usuariosResult = await query<{ usuario_cpf: string; total: string }>(
    `
    SELECT usuario_cpf, COUNT(*) as total
    FROM auditoria
    ${filtroData}
    ${filtroData ? 'AND' : 'WHERE'} usuario_cpf IS NOT NULL
    GROUP BY usuario_cpf
    ORDER BY total DESC
    LIMIT 10
  `,
    params
  );
  const usuarios_mais_ativos = usuariosResult.rows.map((r) => ({
    usuario_cpf: r.usuario_cpf,
    total: parseInt(r.total),
  }));

  return {
    total_registros: total,
    por_entidade,
    por_acao,
    usuarios_mais_ativos,
  };
}

/**
 * Helper para capturar IP e User-Agent de uma Request
 */
export function extrairContextoRequisicao(request: Request): {
  ip_address?: string;
  user_agent?: string;
} {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip_address = forwarded?.split(',')[0].trim() || 'unknown';
  const user_agent = request.headers.get('user-agent') || 'unknown';

  return { ip_address, user_agent };
}
