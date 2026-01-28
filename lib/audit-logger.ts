/**
 * lib/audit-logger.ts
 * Sistema de auditoria para operações críticas
 *
 * Registra operações importantes no banco de dados para rastreabilidade
 */

import { query } from './db';

export interface AuditLogData {
  acao: string;
  recurso: string;
  recurso_id?: number | string;
  usuario_cpf?: string;
  ip?: string;
  detalhes?: any;
  session?: any;
}

/**
 * Registra uma operação de auditoria
 */
export async function logAudit(
  data: AuditLogData,
  session?: any
): Promise<void> {
  try {
    const detalhesJson = data.detalhes ? JSON.stringify(data.detalhes) : null;

    await query(
      `INSERT INTO auditoria (
        acao,
        recurso,
        recurso_id,
        usuario_cpf,
        ip_origem,
        detalhes,
        criado_em
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [
        data.acao,
        data.recurso,
        data.recurso_id || null,
        data.usuario_cpf || null,
        data.ip || null,
        detalhesJson,
      ],
      session
    );
  } catch (error) {
    console.error('Erro ao registrar auditoria:', error);
    // Não lançar erro para não interromper operações principais
  }
}

/**
 * Busca registros de auditoria por recurso
 */
export async function buscarAuditoriaPorRecurso(
  recurso: string,
  limite: number = 50,
  session?: any
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM auditoria
     WHERE recurso = $1
     ORDER BY criado_em DESC
     LIMIT $2`,
    [recurso, limite],
    session
  );

  return result.rows;
}

/**
 * Busca registros de auditoria por usuário
 */
export async function buscarAuditoriaPorUsuario(
  usuarioCpf: string,
  limite: number = 50,
  session?: any
): Promise<any[]> {
  const result = await query(
    `SELECT * FROM auditoria
     WHERE usuario_cpf = $1
     ORDER BY criado_em DESC
     LIMIT $2`,
    [usuarioCpf, limite],
    session
  );

  return result.rows;
}
