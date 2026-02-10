/**
 * db-transaction.ts
 *
 * Helper para executar transações com variáveis de auditoria persistentes
 * Usa uma ÚNICA conexão do pool para toda a transação
 *
 * PRODUÇÃO (Neon): Usa transaction() existente de lib/db.ts
 * DEV/TEST: Usa PoolClient dedicado para garantir mesma conexão
 */

import { getSession } from './session';
import { getPool, isProduction, transaction as dbTransaction } from './db';
import { PoolClient } from 'pg';

/**
 * Executa uma transação com contexto de auditoria configurado
 * Garante que app.current_user_cpf e app.current_user_perfil persistem
 * durante TODA a transação usando uma única conexão
 *
 * @param callback Função que recebe o client e executa queries
 * @returns Resultado do callback
 * @throws Error se não houver sessão ou se a transação falhar
 *
 * @example
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO funcionarios ...');
 *   await client.query('INSERT INTO funcionarios_entidades ...');
 *   return { success: true };
 * });
 */
export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const session = getSession();

  if (!session) {
    throw new Error('SEGURANÇA: withTransaction requer sessão autenticada');
  }

  // PRODUÇÃO: Usar função transaction() existente que suporta Neon
  if (isProduction) {
    console.log(
      '[withTransaction] Modo PRODUÇÃO: usando dbTransaction() para Neon'
    );

    // Para Neon, precisamos configurar as variáveis de auditoria uma vez no início
    // e garantir que todas as queries subsequentes usem a mesma sessão
    const { getNeonSql } = await import('./infrastructure/database/connection');
    const sql = await getNeonSql();
    if (!sql) {
      throw new Error('Conexão Neon não disponível');
    }

    // Configurar variáveis de auditoria uma única vez para toda a transação
    const escapeString = (str: string) => String(str).replace(/'/g, "''");
    const setCpf = `SELECT set_config('app.current_user_cpf', '${escapeString(
      session.cpf
    )}', true)`;
    const setPerfil = `SELECT set_config('app.current_user_perfil', '${escapeString(
      session.perfil
    )}', true)`;
    const setClinica = `SELECT set_config('app.current_user_clinica_id', '${escapeString(
      String(session.clinica_id || '')
    )}', true)`;
    const setEntidade = `SELECT set_config('app.current_user_entidade_id', '${escapeString(
      String(session.entidade_id || '')
    )}', true)`;

    try {
      await sql(setCpf);
      await sql(setPerfil);
      await sql(setClinica);
      await sql(setEntidade);
      console.log(
        `[withTransaction] Variáveis de auditoria configuradas para ${session.perfil} (CPF: ***${session.cpf.slice(-4)})`
      );
    } catch (err) {
      console.warn('[withTransaction] Falha ao configurar variáveis de auditoria:', err);
    }

    // Agora executar o callback usando dbTransaction que manterá o contexto
    return await dbTransaction(async (txClient) => {
      // Criar adapter que imita PoolClient mas usa TransactionClient
      const clientAdapter = {
        query: async (text: string, params?: unknown[]) => {
          const result = await txClient.query(text, params);
          return result;
        },
      } as PoolClient;

      return await callback(clientAdapter);
    }, session);
  }

  // DEV/TEST: Usar PoolClient dedicado
  const pool = getPool();
  const client = await pool.connect();

  try {
    // 1. Iniciar transação
    await client.query('BEGIN');

    // 2. Configurar variáveis de auditoria DENTRO da transação
    // Usar FALSE para escopo LOCAL (apenas esta transação)
    await client.query(`SELECT set_config('app.current_user_cpf', $1, false)`, [
      session.cpf,
    ]);
    await client.query(
      `SELECT set_config('app.current_user_perfil', $1, false)`,
      [session.perfil]
    );

    console.log(
      `[withTransaction] Transação iniciada para ${session.perfil} (CPF: ***${session.cpf.slice(-4)})`
    );

    // 3. Executar callback com o client
    const result = await callback(client);

    // 4. Commit
    await client.query('COMMIT');

    console.log(
      `[withTransaction] Transação commitada com sucesso para ${session.perfil}`
    );

    return result;
  } catch (error) {
    // Rollback em caso de erro
    await client.query('ROLLBACK');

    console.error(
      `[withTransaction] Erro na transação, rollback executado:`,
      error instanceof Error ? error.message : error
    );

    throw error;
  } finally {
    // SEMPRE liberar o client de volta ao pool
    client.release();
  }
}

/**
 * Versão específica para gestores de entidade
 * Valida que o usuário tem perfil gestor
 */
export async function withTransactionAsGestor<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const session = getSession();

  if (!session) {
    throw new Error(
      'SEGURANÇA: withTransactionAsGestor requer sessão autenticada'
    );
  }

  if (session.perfil !== 'gestor' && session.perfil !== 'rh') {
    throw new Error(
      `SEGURANÇA: withTransactionAsGestor é exclusivo para gestores (perfil atual: ${session.perfil})`
    );
  }

  return withTransaction(callback);
}
