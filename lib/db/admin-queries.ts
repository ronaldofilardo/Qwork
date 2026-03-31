/**
 * lib/db/admin-queries.ts
 *
 * Funções administrativas extraídas de lib/db.ts
 * Contém: ensureAdminPassword, getNotificacoesFinanceiras,
 *          marcarNotificacaoComoLida, getContratosPlanos
 */

import bcrypt from 'bcryptjs';
import { query } from './query';
import { isProduction } from './connection';
import type { Session } from '../session';

// Valor conhecido do hash para o usuário admin (senha 123456) — usado para garantir consistência em dev/test
const KNOWN_ADMIN_CPF = '00000000000';
const KNOWN_ADMIN_HASH =
  '$2a$10$1FmG9Rn0QJ9T78GbvS/Yf.AfR9tp9qTxBznhUWLwBhsP8BChtmSVW';

/**
 * Garante que o usuário admin exista e possua um hash bcrypt válido (apenas em dev/test).
 * Não deve rodar em produção para evitar alterações de credenciais reais.
 */
export async function ensureAdminPassword(): Promise<void> {
  try {
    if (isProduction) return; // Não mexer em produção

    // Buscar usuário admin se existir
    const existsRes = await query(
      'SELECT cpf, senha_hash FROM funcionarios WHERE cpf = $1 LIMIT 1',
      [KNOWN_ADMIN_CPF]
    );

    if (existsRes.rows.length === 0) {
      // Inserir usuário admin com hash conhecido
      await query(
        `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo) VALUES ($1, $2, $3, $4, 'admin', true) ON CONFLICT (cpf) DO UPDATE SET senha_hash = EXCLUDED.senha_hash`,
        [KNOWN_ADMIN_CPF, 'Admin', 'admin@bps.com.br', KNOWN_ADMIN_HASH]
      );
      console.info(
        '[INIT] Usuário admin criado/atualizado com hash conhecido (dev/test)'
      );
      return;
    }

    const row = existsRes.rows[0];
    const currentHash = row.senha_hash;

    // Se já é o hash esperado, ok
    if (currentHash === KNOWN_ADMIN_HASH) return;

    // Se hash atual for inválido ou não corresponde à senha 123456, substituímos
    const senhaValida = await bcrypt
      .compare('123456', currentHash)
      .catch(() => false);
    if (!senhaValida) {
      await query('UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2', [
        KNOWN_ADMIN_HASH,
        KNOWN_ADMIN_CPF,
      ]);
      console.info(
        '[INIT] Hash admin inconsistente detectado e substituído pelo hash padrão (dev/test)'
      );
    }
  } catch (err) {
    console.warn('[INIT] Falha ao garantir hash do admin:', err);
  }
}

/**
 * Obter notificações financeiras não lidas
 */
export async function getNotificacoesFinanceiras(
  contratoId?: number,
  apenasNaoLidas: boolean = true,
  session?: Session
) {
  let queryText = 'SELECT * FROM notificacoes_financeiras';
  const params: unknown[] = [];
  const whereClauses: string[] = [];

  // Excluir notificações de pendência de pagamento (desabilitadas)
  whereClauses.push('tipo != $1');
  params.push('parcela_pendente');

  if (contratoId) {
    whereClauses.push(`id = $${params.length + 1}`);
    params.push(contratoId);
  }

  if (apenasNaoLidas) {
    whereClauses.push(`lida = false`);
  }

  if (whereClauses.length > 0) {
    queryText += ` WHERE ${whereClauses.join(' AND ')}`;
  }

  queryText += ' ORDER BY created_at DESC';

  const result = await query(queryText, params, session);
  return result.rows;
}

/**
 * Marcar notificação como lida
 */
export async function marcarNotificacaoComoLida(
  notificacaoId: number,
  session?: Session
) {
  const result = await query(
    'UPDATE notificacoes_financeiras SET lida = true, lida_em = NOW() WHERE id = $1 RETURNING *',
    [notificacaoId],
    session
  );
  return result.rows[0];
}

/**
 * Obter contratos de planos para uma clínica ou entidade
 */
export async function getContratosPlanos(
  filter: {
    clinica_id?: number;
    entidade_id?: number;
  },
  session?: Session
) {
  if (!filter.clinica_id && !filter.entidade_id) {
    throw new Error('Filtro de clinica_id ou entidade_id é obrigatório');
  }

  let queryText = `
    SELECT cp.*, p.nome as plano_nome, p.tipo as plano_tipo
    FROM contratos_planos cp
    JOIN planos p ON cp.plano_id = p.id
    WHERE cp.status = 'ativo'
  `;
  const params: unknown[] = [];

  if (filter.clinica_id) {
    params.push(filter.clinica_id);
    queryText += ` AND cp.clinica_id = $${params.length}`;
  }

  if (filter.entidade_id) {
    params.push(filter.entidade_id);
    queryText += ` AND cp.entidade_id = $${params.length}`;
  }

  queryText += ' ORDER BY cp.created_at DESC';

  const result = await query(queryText, params, session);
  return result.rows;
}
