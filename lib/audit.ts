import { query } from './db';
import { getSession } from './session';
import { sanitizeUserAgent, isValidIP } from './request-utils';

/**
 * Interface para registro de auditoria
 */
export interface AuditLogEntry {
  resource: string; // Nome da tabela ou recurso (era 'tabela')
  action:
    | 'INSERT'
    | 'UPDATE'
    | 'DELETE'
    | 'SELECT'
    | 'GENERATE_PAYMENT_LINK'
    | 'VALIDATE_TOKEN'
    | 'CORRECT_INCONSISTENCY'
    | 'ACTIVATE'
    | 'DEACTIVATE'
    | 'PAYMENT_CONFIRMED'
    | 'CONTRACT_GENERATED'; // Tipo de operação (era 'operacao')
  resourceId: string | number; // ID do registro afetado (era 'registroId')
  oldData?: unknown; // Dados anteriores (era 'dadosAnteriores')
  newData?: unknown; // Dados novos (era 'dadosNovos')
  ipAddress?: string | null;
  userAgent?: string | null;
  details?: string; // Detalhes adicionais
}

/**
 * Registra uma operação no audit log
 * Deve ser chamado em operações críticas (mudanças de status, criação/exclusão de usuários, etc.)
 */
export async function logAudit(
  entry: AuditLogEntry,
  session?: unknown
): Promise<void> {
  try {
    // getSession() can be synchronous in production, but tests mock it as async
    // (mockResolvedValue). Await to support both cases.
    const currentSession = session || (await (getSession() as any));

    if (!currentSession) {
      console.warn('[AUDIT] Tentativa de log sem sessão ativa');
      return;
    }

    // Sanitizar e validar IP
    let validatedIp: string | null = null;
    if (entry.ipAddress && isValidIP(entry.ipAddress)) {
      validatedIp = entry.ipAddress;
    }

    // Sanitizar User-Agent
    const sanitizedUserAgent = sanitizeUserAgent(entry.userAgent || null);

    await query(
      `INSERT INTO audit_logs
       (user_cpf, user_perfil, action, resource, resource_id,
        old_data, new_data, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        currentSession.cpf,
        currentSession.perfil,
        entry.action,
        entry.resource,
        entry.resourceId.toString(),
        entry.oldData ? JSON.stringify(entry.oldData) : null,
        entry.newData ? JSON.stringify(entry.newData) : null,
        validatedIp,
        sanitizedUserAgent,
        entry.details || null,
      ],
      currentSession
    );

    const ipInfo = validatedIp ? ` de IP ${validatedIp}` : '';
    console.log(
      `[AUDIT] ${entry.action} em ${entry.resource} por ${currentSession.cpf} (${currentSession.perfil})${ipInfo}`
    );
  } catch (error) {
    console.error('[AUDIT] Erro ao registrar log de auditoria:', error);
    // Não lançar erro para não interromper operação principal
  }
}

/**
 * Busca logs de auditoria com filtros opcionais
 */
export async function getAuditLogs(filters?: {
  resource?: string;
  usuarioCpf?: string;
  dataInicio?: Date;
  dataFim?: Date;
  limit?: number;
  offset?: number;
}): Promise<unknown[]> {
  try {
    let queryText = `
      SELECT 
        al.id,
        al.resource,
        al.action,
        al.resource_id,
        al.user_cpf,
        al.user_perfil,
        f.nome as usuario_nome,
        al.old_data,
        al.new_data,
        al.ip_address,
        al.user_agent,
        al.details,
        al.created_at
      FROM audit_logs al
      LEFT JOIN funcionarios f ON al.user_cpf = f.cpf
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramCount = 1;

    if (filters?.resource) {
      queryText += ` AND al.resource = $${paramCount}`;
      params.push(filters.resource);
      paramCount++;
    }

    if (filters?.usuarioCpf) {
      queryText += ` AND al.user_cpf = $${paramCount}`;
      params.push(filters.usuarioCpf);
      paramCount++;
    }

    if (filters?.dataInicio) {
      queryText += ` AND al.criado_em >= $${paramCount}`;
      params.push(filters.dataInicio);
      paramCount++;
    }

    if (filters?.dataFim) {
      queryText += ` AND al.criado_em <= $${paramCount}`;
      params.push(filters.dataFim);
      paramCount++;
    }

    queryText += ` ORDER BY al.criado_em DESC`;

    if (filters?.limit) {
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
      paramCount++;
    }

    if (filters?.offset) {
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(queryText, params);
    return result.rows;
  } catch (error) {
    console.error('[AUDIT] Erro ao buscar logs:', error);
    return [];
  }
}

/**
 * Extrai IP e User-Agent do Request
 */
export function extractRequestInfo(request: Request): {
  ipAddress?: string;
  userAgent?: string;
} {
  const headers = request.headers;

  return {
    ipAddress:
      headers.get('x-forwarded-for') || headers.get('x-real-ip') || undefined,
    userAgent: headers.get('user-agent') || undefined,
  };
}
