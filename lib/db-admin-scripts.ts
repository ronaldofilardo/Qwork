/**
 * Helper para scripts administrativos que precisam atualizar dados sem sessão ativa
 * Mantém contexto de auditoria mesmo sem usuário logado
 *
 * APENAS para scripts internos - nunca use em endpoints da API
 */

import { Pool } from 'pg';
import { getNeonPool, getPool } from './db';

export interface AdminScriptContext {
  cpf?: string; // CPF de quem executa (default: '00000000000' para admin anônimo)
  perfil?: string; // Perfil (default: 'admin')
  operation?: string; // Descrição da operação para auditoria
}

/**
 * Executa operações administrativas com contexto de auditoria correto
 *
 * @param callback Função com queries administrativas
 * @param context Contexto de quem executa (CPF, perfil, operação)
 *
 * @example
 * await withAdminContext(() => {
 *   return client.query(
 *     'UPDATE funcionarios SET senha_hash = $1 WHERE cpf = $2',
 *     [hashBcrypt, '12345678901']
 *   );
 * }, { operation: 'Corrigir senha CPF 12345678901' });
 */
export async function withAdminContext<T>(
  callback: (client: any) => Promise<T>,
  context?: AdminScriptContext
): Promise<T> {
  const {
    cpf = '00000000000', // Admin anônimo
    perfil = 'admin',
    operation = 'Script administrativo',
  } = context || {};

  // Detectar se estamos em produção (Neon)
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.env.DATABASE_URL?.includes('neon.tech');

  const pool = isProduction ? await getNeonPool() : getPool();

  if (!pool) {
    throw new Error('Pool de banco de dados não disponível');
  }

  const client = await pool.connect();

  try {
    // Iniciar transação
    await client.query('BEGIN');

    // Configurar contexto de auditoria - CRÍTICO para evitar erro de SECURITY
    await client.query("SELECT set_config('app.current_user_cpf', $1, false)", [
      cpf,
    ]);
    await client.query(
      "SELECT set_config('app.current_user_perfil', $1, false)",
      [perfil]
    );

    console.log(`[Admin Script] Executando: ${operation}`);
    console.log(`[Admin Script] Contexto: CPF=${cpf}, Perfil=${perfil}`);

    // Executar operação
    const result = await callback(client);

    // Commit
    await client.query('COMMIT');
    console.log(`[Admin Script] ✅ Operação bem-sucedida: ${operation}`);

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`[Admin Script] ❌ Erro na operação "${operation}":`, error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Atualizar senha de um usuário com auditoria completa
 *
 * @param cpf CPF do usuário
 * @param novoHashBcrypt Hash bcrypt da nova senha
 * @param motivo Motivo da alteração (para auditoria)
 */
export async function atualizarSenhaAdmin(
  cpf: string,
  novoHashBcrypt: string,
  motivo: string
): Promise<{ nome: string; email: string; perfil: string }> {
  return withAdminContext(
    async (client) => {
      // Buscar dados atuais para log
      const antes = await client.query(
        'SELECT nome, email, perfil FROM funcionarios WHERE cpf = $1',
        [cpf]
      );

      if (antes.rows.length === 0) {
        throw new Error(`Usuário CPF ${cpf} não encontrado`);
      }

      // Atualizar senha
      const resultado = await client.query(
        'UPDATE funcionarios SET senha_hash = $1, atualizado_em = NOW() WHERE cpf = $2 RETURNING nome, email, perfil',
        [novoHashBcrypt, cpf]
      );

      if (resultado.rowCount === 0) {
        throw new Error(`Falha ao atualizar senha do CPF ${cpf}`);
      }

      return resultado.rows[0];
    },
    {
      cpf: '00000000000', // Admin anônimo
      perfil: 'admin',
      operation: `Atualizar senha CPF ${cpf} - Motivo: ${motivo}`,
    }
  );
}
