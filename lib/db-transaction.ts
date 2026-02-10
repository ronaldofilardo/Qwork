/**
 * db-transaction.ts
 * 
 * Helper para executar transações com variáveis de auditoria persistentes
 * Usa uma ÚNICA conexão do pool para toda a transação
 */

import { getSession } from './session';
import { getPool } from './db';
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

  const pool = getPool();
  const client = await pool.connect();
  
  try {
    // 1. Iniciar transação
    await client.query('BEGIN');
    
    // 2. Configurar variáveis de auditoria DENTRO da transação
    // Usar FALSE para escopo LOCAL (apenas esta transação)
    await client.query(
      `SELECT set_config('app.current_user_cpf', $1, false)`,
      [session.cpf]
    );
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
    throw new Error('SEGURANÇA: withTransactionAsGestor requer sessão autenticada');
  }

  if (session.perfil !== 'gestor' && session.perfil !== 'rh') {
    throw new Error(
      `SEGURANÇA: withTransactionAsGestor é exclusivo para gestores (perfil atual: ${session.perfil})`
    );
  }

  return withTransaction(callback);
}
