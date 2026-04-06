/**
 * lib/db-security/rls-context.ts
 *
 * Lógica de configuração RLS (Row Level Security) extraída de lib/db-security.ts.
 * Centraliza a configuração de variáveis de sessão no PostgreSQL para isolamento de dados.
 */

import { query, transaction, type TransactionClient } from '../db';
import { getSession, type Session } from '../session';
import { TypeValidators } from '../types/enums';

// ============================================================================
// VALIDADORES PRIVADOS
// ============================================================================

/**
 * Valida se o perfil é válido
 */
function isValidPerfil(perfil: string): boolean {
  return TypeValidators.isPerfil(perfil);
}

/**
 * Valida se o CPF tem formato correto (11 dígitos)
 */
function isValidCPF(cpf: string): boolean {
  return /^\d{11}$/.test(cpf);
}

/**
 * Sanitiza e valida dados da sessão.
 * Retorna CPF e perfil sanitizados ou lança erro.
 */
function sanitizeSession(session: Session): { cpf: string; perfil: string } {
  const cpf = session.cpf.replace(/[^0-9]/g, '');
  const perfil = session.perfil.toLowerCase().replace(/[^a-z_]/g, '');

  if (!cpf || cpf.length !== 11) {
    throw new Error('SEGURANÇA: CPF inválido na sessão');
  }

  if (!isValidCPF(cpf)) {
    throw new Error('SEGURANÇA: Formato de CPF inválido');
  }

  if (!perfil || !isValidPerfil(perfil)) {
    console.error(`[rls-context] Perfil inválido: ${perfil}`, session);
    throw new Error(`SEGURANÇA: Perfil inválido na sessão: ${perfil}`);
  }

  return { cpf, perfil };
}

// ============================================================================
// CONFIGURAÇÃO RLS CENTRALIZADA
// ============================================================================

/**
 * Extrai clinica_id e entidade_id da sessão para contexto RLS.
 *
 * DOIS FLUXOS DISTINTOS:
 *   - Fluxo Entidade (gestor): session.entidade_id → entidades.id
 *   - Fluxo Clínica (rh):     session.clinica_id  → clinicas.id
 *
 * Estes valores já foram validados no login e são a fonte de verdade.
 * NÃO consultar o banco — gestor/rh estão em `usuarios`, não em `funcionarios`.
 */
function extractContextIds(session: Session): {
  clinicaId: string | null;
  entidadeId: string | null;
} {
  return {
    clinicaId: session.clinica_id?.toString() ?? null,
    entidadeId: session.entidade_id?.toString() ?? null,
  };
}

/**
 * Configura variáveis RLS no txClient usando SET LOCAL (escopo de transação).
 *
 * DOIS FLUXOS DISTINTOS:
 *   - app.current_user_clinica_id  → usado por current_user_clinica_id_optional()
 *   - app.current_user_entidade_id → usado por current_user_entidade_id()
 *
 * Aliases temporários (retrocompat): app.current_clinica_id, app.current_entidade_id
 */
async function setRLSVariables(
  txClient: TransactionClient,
  cpf: string,
  perfil: string,
  clinicaId: string | null,
  entidadeId: string | null
): Promise<void> {
  await txClient.query('SELECT set_config($1, $2, true)', [
    'app.current_user_cpf',
    cpf,
  ]);
  await txClient.query('SELECT set_config($1, $2, true)', [
    'app.current_perfil',
    perfil,
  ]);
  await txClient.query('SELECT set_config($1, $2, true)', [
    'app.current_user_perfil',
    perfil,
  ]);
  await txClient.query('SELECT set_config($1, $2, true)', [
    'app.current_user_tipo',
    perfil,
  ]);

  // FLUXO CLÍNICA (rh)
  if (clinicaId) {
    await txClient.query('SELECT set_config($1, $2, true)', [
      'app.current_user_clinica_id',
      clinicaId,
    ]);
    // Alias retrocompat temporário
    await txClient.query('SELECT set_config($1, $2, true)', [
      'app.current_clinica_id',
      clinicaId,
    ]);
  }

  // FLUXO ENTIDADE (gestor)
  if (entidadeId) {
    await txClient.query('SELECT set_config($1, $2, true)', [
      'app.current_user_entidade_id',
      entidadeId,
    ]);
    // Alias retrocompat temporário
    await txClient.query('SELECT set_config($1, $2, true)', [
      'app.current_entidade_id',
      entidadeId,
    ]);
  }
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Query com contexto de segurança RLS.
 * Define variáveis de sessão para isolamento automático via Row Level Security.
 */
export async function queryWithContext<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const session = getSession();

    if (!session) {
      console.warn('[queryWithContext] Query executada sem contexto de sessão');

      if (
        process.env.NODE_ENV === 'production' &&
        text.toLowerCase().includes('where')
      ) {
        throw new Error(
          'SEGURANÇA: Sessão obrigatória para queries com filtros'
        );
      }
    }

    if (session) {
      const { cpf, perfil } = sanitizeSession(session);

      return await transaction(async (txClient) => {
        const { clinicaId, entidadeId } = extractContextIds(session);
        await setRLSVariables(txClient, cpf, perfil, clinicaId, entidadeId);

        const result = await txClient.query<T>(text, params);

        return result;
      }, session);
    }

    // Sem sessão - executar query diretamente
    const result = await query<T>(text, params);
    return result;
  } catch (error) {
    console.error(
      '[queryWithContext] Erro ao executar query com contexto:',
      error
    );

    if (error instanceof Error && error.message.includes('inválido')) {
      try {
        await query(`SELECT log_access_denied($1, $2, $3, $4)`, [
          'QUERY',
          'database',
          null,
          error.message,
        ]);
      } catch (logError) {
        console.error(
          '[queryWithContext] Erro ao logar acesso negado:',
          logError
        );
      }
    }

    throw error;
  }
}

/**
 * Executa múltiplas queries em uma transação com contexto de segurança.
 * Usa cliente dedicado do pool para garantir mesma conexão.
 */
export async function transactionWithContext<T = void>(
  callback: (query: typeof queryWithContext) => Promise<T>
): Promise<T> {
  const session = getSession();

  if (!session) {
    throw new Error('SEGURANÇA: Sessão não encontrada para transação');
  }

  const { cpf, perfil } = sanitizeSession(session);

  console.log(
    `[transactionWithContext] 🔄 TRANSAÇÃO DEDICADA: CPF=${cpf}, Perfil=${perfil}`
  );

  return await transaction(async (txClient) => {
    const { clinicaId, entidadeId } = extractContextIds(session);
    await setRLSVariables(txClient, cpf, perfil, clinicaId, entidadeId);

    console.log(
      '[transactionWithContext] ✅ RLS configurado (transação dedicada)'
    );

    const result = await callback(async (text, params) => {
      return await txClient.query(text, params);
    });

    console.log('[transactionWithContext] ✅ Transação concluída');

    return result;
  }, session);
}
