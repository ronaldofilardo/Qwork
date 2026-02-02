/**
 * lib/db-gestor.ts
 *
 * Funções de banco de dados específicas para GESTORES (RH e Entidade)
 *
 * POLÍTICA ARQUITETURAL:
 * - Gestores NÃO estão em funcionarios (apenas em contratantes_senhas)
 * - Gestores NÃO usam RLS (Row Level Security)
 * - Validação de permissões via requireEntity() / requireClinica()
 * - Queries diretas sem queryWithContext()
 *
 * @see docs/ANALISE-CICLO-GESTOR-FUNCIONARIO.md
 */

import { query } from './db';
import { getSession } from './session';
import { PerfilUsuarioType } from './types/enums';

/**
 * Verifica se o perfil é de um gestor (RH ou Entidade)
 */
export function isGestor(perfil?: PerfilUsuarioType): boolean {
  return perfil === 'rh' || perfil === 'gestor_entidade';
}

/**
 * Verifica se o perfil é especificamente gestor de entidade
 */
export function isGestorEntidade(perfil?: PerfilUsuarioType): boolean {
  return perfil === 'gestor_entidade';
}

/**
 * Verifica se o perfil é especificamente RH (gestor de clínica)
 */
export function isGestorRH(perfil?: PerfilUsuarioType): boolean {
  return perfil === 'rh';
}

/**
 * Valida contexto de gestor via contratantes (NÃO funcionarios)
 *
 * @param cpf CPF do gestor
 * @param perfil Perfil esperado ('rh' ou 'gestor_entidade')
 * @returns true se o gestor existe e está ativo
 */
async function validateGestorContext(
  cpf: string,
  perfil: 'rh' | 'gestor_entidade'
): Promise<boolean> {
  try {
    // Validar formato do CPF
    if (!/^\d{11}$/.test(cpf)) {
      console.error('[validateGestorContext] CPF inválido:', cpf);
      return false;
    }

    // Buscar gestor em contratantes_senhas (fonte de verdade)
    const tipoContratante =
      perfil === 'gestor_entidade' ? 'entidade' : 'clinica';

    const result = await query(
      `SELECT cs.cpf, c.id as contratante_id, c.tipo, c.ativa
       FROM contratantes_senhas cs
       JOIN contratantes c ON c.id = cs.contratante_id
       WHERE cs.cpf = $1 AND c.tipo = $2 AND c.ativa = true`,
      [cpf, tipoContratante]
    );

    if (result.rows.length === 0) {
      console.error(
        `[validateGestorContext] Gestor não encontrado ou inativo: CPF=${cpf}, Perfil=${perfil}`
      );
      return false;
    }

    const gestor = result.rows[0];
    console.log(
      `[validateGestorContext] ✓ Gestor validado: CPF=${cpf}, Contratante=${gestor.contratante_id}, Tipo=${gestor.tipo}`
    );

    return true;
  } catch (error) {
    console.error('[validateGestorContext] Erro:', error);
    return false;
  }
}

/**
 * Query específica para gestores (RH e Entidade)
 *
 * NÃO usa RLS - validação via contratantes_senhas
 * Deve ser usada apenas por endpoints que já validaram permissões com:
 * - requireEntity() para gestor_entidade
 * - requireClinica() ou requireRHWithEmpresaAccess() para RH
 *
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 * @throws Error se chamado por não-gestor ou gestor inválido
 */
export async function queryAsGestor<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const session = getSession();

  if (!session) {
    throw new Error('SEGURANÇA: queryAsGestor requer sessão autenticada');
  }

  if (!isGestor(session.perfil)) {
    throw new Error(
      `SEGURANÇA: queryAsGestor é exclusivo para gestores (perfil atual: ${session.perfil})`
    );
  }

  // Validar que o gestor existe e está ativo em contratantes
  const isValid = await validateGestorContext(
    session.cpf,
    session.perfil as 'rh' | 'gestor_entidade'
  );

  if (!isValid) {
    throw new Error(
      'SEGURANÇA: Gestor não encontrado ou inativo em contratantes_senhas'
    );
  }

  // 🔒 SEGURANÇA: Configurar variáveis de contexto para auditoria (mesmo sem RLS)
  await query('SELECT set_config($1, $2, false)', [
    'app.current_user_cpf',
    session.cpf,
  ]);
  await query('SELECT set_config($1, $2, false)', [
    'app.current_user_perfil',
    session.perfil,
  ]);

  // Executar query direta (sem RLS)
  console.log(
    `[queryAsGestor] Executando query para ${session.perfil} (CPF: ***${session.cpf.slice(-4)})`
  );

  return query(text, params);
}

/**
 * Query específica para gestor de entidade
 * Valida que o usuário tem perfil gestor_entidade e contratante_id
 *
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 * @throws Error se não for gestor_entidade ou não tiver contratante_id
 */
export async function queryAsGestorEntidade<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const session = getSession();

  if (!session || !isGestorEntidade(session.perfil)) {
    throw new Error(
      'SEGURANÇA: queryAsGestorEntidade é exclusivo para gestor_entidade'
    );
  }

  if (!session.contratante_id) {
    throw new Error('SEGURANÇA: Sessão de gestor_entidade sem contratante_id');
  }

  return queryAsGestor<T>(text, params);
}

/**
 * Query específica para gestor RH
 * Valida que o usuário tem perfil rh e clinica_id
 *
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 * @throws Error se não for RH ou não tiver clinica_id
 */
export async function queryAsGestorRH<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const session = getSession();

  if (!session || !isGestorRH(session.perfil)) {
    throw new Error('SEGURANÇA: queryAsGestorRH é exclusivo para perfil rh');
  }

  if (!session.clinica_id) {
    console.warn(
      '[queryAsGestorRH] Sessão de RH sem clinica_id - pode causar problemas de isolamento'
    );
  }

  return queryAsGestor<T>(text, params);
}

/**
 * Helper para logs de auditoria de gestores
 * Como gestores não estão em funcionarios, precisamos logs específicos
 *
 * @param action Ação realizada (ex: 'criar_lote', 'editar_empresa')
 * @param resource Recurso afetado (ex: 'lotes_avaliacao', 'empresas')
 * @param resourceId ID do recurso
 * @param details Detalhes adicionais
 * @param ipAddress IP do request
 */
export async function logGestorAction(
  action: string,
  resource: string,
  resourceId: string | number,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  const session = getSession();

  if (!session || !isGestor(session.perfil)) {
    console.warn('[logGestorAction] Chamado por não-gestor, ignorando');
    return;
  }

  try {
    await query(
      `INSERT INTO audit_logs (user_cpf, action, resource, resource_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        session.cpf,
        action,
        resource,
        resourceId.toString(),
        JSON.stringify({
          ...details,
          perfil: session.perfil,
          contratante_id: session.contratante_id,
          clinica_id: session.clinica_id,
          is_gestor: true,
        }),
        ipAddress || 'unknown',
      ]
    );

    console.log(
      `[logGestorAction] ✓ Auditoria registrada: ${action} em ${resource}#${resourceId} por ${session.perfil}`
    );
  } catch (error) {
    console.error('[logGestorAction] Erro ao registrar auditoria:', error);
    // Não propagar erro de auditoria
  }
}

/**
 * Valida se um gestor tem acesso a uma empresa específica
 *
 * @param empresaId ID da empresa
 * @returns true se o gestor tem acesso
 * @throws Error se não for gestor ou não tiver acesso
 */
export async function validateGestorEmpresaAccess(
  empresaId: number
): Promise<boolean> {
  const session = getSession();

  if (!session || !isGestor(session.perfil)) {
    throw new Error('SEGURANÇA: Acesso restrito a gestores');
  }

  // Gestor de entidade: verifica se empresa está vinculada ao contratante
  if (isGestorEntidade(session.perfil)) {
    if (!session.contratante_id) {
      throw new Error('SEGURANÇA: Gestor de entidade sem contratante_id');
    }

    const result = await query(
      `SELECT 1 FROM empresas_clientes 
       WHERE id = $1 AND contratante_id = $2`,
      [empresaId, session.contratante_id]
    );

    if (result.rowCount === 0) {
      console.error(
        `[validateGestorEmpresaAccess] Empresa ${empresaId} não pertence ao contratante ${session.contratante_id}`
      );
      return false;
    }

    return true;
  }

  // Gestor RH: verifica se empresa está vinculada à clínica
  if (isGestorRH(session.perfil)) {
    if (!session.clinica_id) {
      throw new Error('SEGURANÇA: Gestor RH sem clinica_id');
    }

    const result = await query(
      `SELECT 1 FROM empresas_clientes 
       WHERE id = $1 AND clinica_id = $2`,
      [empresaId, session.clinica_id]
    );

    if (result.rowCount === 0) {
      console.error(
        `[validateGestorEmpresaAccess] Empresa ${empresaId} não pertence à clínica ${session.clinica_id}`
      );
      return false;
    }

    return true;
  }

  return false;
}
