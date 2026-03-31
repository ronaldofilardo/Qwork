/**
 * lib/db-security/index.ts
 *
 * Barrel file para db-security. Re-exporta tudo dos submódulos
 * e contém queryWithEmpresaFilter e queryWithSecurity.
 *
 * Retrocompatibilidade: `import { queryWithContext } from '@/lib/db-security'`
 * continua funcionando.
 */

import { query } from '../db';
import { getSession } from '../session';
import { TypeValidators } from '../types/enums';
import { queryAsGestor, isGestor } from '../db-gestor';

// Re-export query for convenience (retrocompatibilidade)
export { query };

// Re-export submódulos
export { queryWithContext, transactionWithContext } from './rls-context';
export { getPermissionsByRole, hasPermission } from './permissions';

// ============================================================================
// VALIDADORES PRIVADOS (duplicados aqui para queryWithEmpresaFilter)
// ============================================================================

function isValidPerfil(perfil: string): boolean {
  return TypeValidators.isPerfil(perfil);
}

function isValidCPF(cpf: string): boolean {
  return /^\d{11}$/.test(cpf);
}

// ============================================================================
// queryWithEmpresaFilter - mantido aqui pois usa query (não transação)
// ============================================================================

/**
 * Query com contexto de segurança RLS e filtro opcional por empresa.
 * Define variáveis de sessão e opcionalmente app.query_empresa_filter.
 */
export async function queryWithEmpresaFilter<T = unknown>(
  text: string,
  params?: unknown[],
  empresaId?: number
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const session = getSession();

    if (session) {
      const cpf = session.cpf.replace(/[^0-9]/g, '');
      const perfil = session.perfil.toLowerCase().replace(/[^a-z_]/g, '');

      if (!cpf || cpf.length !== 11) {
        throw new Error('CPF inválido na sessão');
      }

      if (!isValidCPF(cpf)) {
        throw new Error('Formato de CPF inválido');
      }

      if (!perfil || !isValidPerfil(perfil)) {
        throw new Error('Perfil inválido na sessão');
      }

      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        cpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        perfil,
      ]);

      if (['rh', 'gestor', 'emissor'].includes(perfil)) {
        const clinicaResult = await query(
          `SELECT ec.clinica_id 
           FROM funcionarios f
           JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
           JOIN empresas_clientes ec ON ec.id = fc.empresa_id
           WHERE f.cpf = $1 AND fc.ativo = true
           ORDER BY fc.data_vinculo DESC
           LIMIT 1`,
          [cpf]
        );
        if (clinicaResult.rows.length > 0 && clinicaResult.rows[0].clinica_id) {
          const clinicaId = clinicaResult.rows[0].clinica_id.toString();

          if (!/^\d+$/.test(clinicaId)) {
            throw new Error('ID de clínica inválido');
          }

          await query('SELECT set_config($1, $2, false)', [
            'app.current_user_clinica_id',
            clinicaId,
          ]);
        } else if (perfil === 'rh') {
          throw new Error('RH deve estar vinculado a uma clínica ativa');
        }
      }

      if (empresaId !== undefined && empresaId !== null) {
        if (!Number.isInteger(empresaId) || empresaId <= 0) {
          throw new Error('ID de empresa inválido');
        }

        if (perfil === 'rh') {
          const empresaCheck = await query(
            `SELECT ec.id 
             FROM empresas_clientes ec
             JOIN funcionarios f ON f.cpf = $2
             JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id AND fc.ativo = true
             JOIN empresas_clientes ec2 ON ec2.id = fc.empresa_id
             WHERE ec.id = $1 AND ec.clinica_id = ec2.clinica_id
             LIMIT 1`,
            [empresaId, cpf]
          );

          if (empresaCheck.rows.length === 0) {
            throw new Error('Empresa não pertence à clínica do usuário');
          }
        }

        await query('SELECT set_config($1, $2, false)', [
          'app.query_empresa_filter',
          empresaId.toString(),
        ]);
      }
    }

    return await query<T>(text, params);
  } catch (error) {
    console.error(
      '[queryWithEmpresaFilter] Erro ao executar query com contexto:',
      error
    );

    if (error instanceof Error && error.message.includes('inválido')) {
      try {
        await query(`SELECT log_access_denied($1, $2, $3, $4)`, [
          'QUERY',
          'database',
          empresaId?.toString() || null,
          error.message,
        ]);
      } catch (logError) {
        console.error(
          '[queryWithEmpresaFilter] Erro ao logar acesso negado:',
          logError
        );
      }
    }

    throw error;
  }
}

// ============================================================================
// queryWithSecurity - unificador com detecção automática de tipo
// ============================================================================

/**
 * Query unificada com detecção automática de tipo de usuário.
 *
 * - GESTORES (RH e Entidade): usa queryAsGestor() sem RLS
 * - FUNCIONÁRIOS: usa queryWithContext() com RLS
 */
export async function queryWithSecurity<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const session = getSession();

  if (!session) {
    console.warn('[queryWithSecurity] Query sem sessão - usando query direta');
    return query(text, params);
  }

  if (isGestor(session.perfil)) {
    console.log(
      `[queryWithSecurity] Roteando para queryAsGestor (perfil: ${session.perfil})`
    );
    return queryAsGestor<T>(text, params);
  } else {
    // Importação dinâmica para evitar circular dependency
    const { queryWithContext } = await import('./rls-context');
    console.log(
      `[queryWithSecurity] Roteando para queryWithContext (perfil: ${session.perfil})`
    );
    return queryWithContext<T>(text, params);
  }
}
