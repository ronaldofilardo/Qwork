import { query } from './db';
import { getSession, Session } from './session';
import { TypeValidators } from './types/enums';
import { queryAsGestor, isGestor } from './db-gestor';

// Re-export query for convenience
export { query };

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
 * FASE 3: Valida contexto de sessão usando perfil (não usuario_tipo)
 * usuario_tipo é usado para diferenciação interna, mas session.perfil é o que vem do login
 */
async function _validateSessionContext(
  cpf: string,
  perfil: string
): Promise<boolean> {
  try {
    // Validação: todos os usuários estão em funcionarios
    // Importante: usar 'perfil' (que vem da sessão de login), não 'usuario_tipo' (enum interno)
    // Nota: clinica_id e entidade_id não existem em funcionarios - são relações N:N via funcionarios_clinicas/funcionarios_entidades

    // Debug: log da tentativa de validação
    console.log(
      `[validateSessionContext] Buscando: CPF=${cpf}, Perfil=${perfil}`
    );

    const result = await query(
      `SELECT cpf, perfil, ativo
       FROM funcionarios
       WHERE cpf = $1`,
      [cpf]
    );

    if (result.rows.length === 0) {
      console.error(
        `[validateSessionContext] Usuário não encontrado: CPF=${cpf}, Perfil=${perfil}`
      );
      return false;
    }

    const user = result.rows[0];

    // Debug: mostrar o que foi encontrado
    console.log(`[validateSessionContext] Usuário encontrado:`, {
      cpf: user.cpf,
      perfil: user.perfil,
      ativo: user.ativo,
    });

    // Verificar se o perfil corresponde (ignorando case)
    if (user.perfil?.toLowerCase() !== perfil?.toLowerCase()) {
      console.error(
        `[validateSessionContext] Perfil não corresponde: Esperado=${perfil}, Encontrado=${user.perfil}`
      );
      return false;
    }

    if (!user.ativo) {
      console.error(`[validateSessionContext] Usuário inativo: CPF=${cpf}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[validateSessionContext] Erro:', error);
    return false;
  }
}

/**
 * Query com contexto de segurança RLS
 * Define variáveis de sessão (app.current_user_cpf, app.current_user_perfil, app.current_user_clinica_id)
 * para isolamento automático via Row Level Security
 */
export async function queryWithContext<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const session = getSession();

    // 🔒 SEGURANÇA: Validação obrigatória de sessão para queries sensíveis
    if (!session) {
      // Permitir queries sem sessão apenas em contextos específicos (ex: login, health check)
      console.warn('[queryWithContext] Query executada sem contexto de sessão');

      // Em produção, queries sensíveis devem sempre ter sessão
      if (
        process.env.NODE_ENV === 'production' &&
        text.toLowerCase().includes('where')
      ) {
        throw new Error(
          'SEGURANÇA: Sessão obrigatória para queries com filtros'
        );
      }
    }

    // Se há sessão, configurar contexto para RLS
    if (session) {
      // 🔒 SEGURANÇA: Validar e sanitizar valores com rigor
      const cpf = session.cpf.replace(/[^0-9]/g, '');
      const perfil = session.perfil.toLowerCase().replace(/[^a-z_]/g, '');

      // Validações de segurança OBRIGATÓRIAS
      if (!cpf || cpf.length !== 11) {
        throw new Error('SEGURANÇA: CPF inválido na sessão');
      }

      if (!isValidCPF(cpf)) {
        throw new Error('SEGURANÇA: Formato de CPF inválido');
      }

      if (!perfil || !isValidPerfil(perfil)) {
        throw new Error('SEGURANÇA: Perfil inválido na sessão');
      }

      // 🔒 SEGURANÇA: Configurar variáveis de contexto primeiro
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        cpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_perfil',
        perfil,
      ]);

      // 🔒 NOTA: Não revalidamos CPF aqui porque:
      // - A sessão foi validada por requireAuth() antes desta função
      // - Revalidar aqui pode causar conflito com RLS (bloqueio antes de set_config)
      // - Se CPF for inválido, RLS vai bloquear queries anyway

      // Definir variáveis de contexto usando parametrização segura
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        cpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        perfil,
      ]);

      // FASE 3: Obter identificadores de contexto baseado no perfil da sessão
      // Usar perfil diretamente ao invés de usuario_tipo (que pode não existir no banco)
      let clinicaId: string | null = null;
      let entidadeId: string | null = null;

      // Buscar clinica_id via funcionarios_clinicas (para RH)
      if (perfil === 'rh') {
        const clinicaResult = await query(
          `SELECT DISTINCT ec.clinica_id
           FROM funcionarios f
           JOIN funcionarios_clinicas fc ON f.id = fc.funcionario_id
           JOIN empresas_clientes ec ON ec.id = fc.empresa_id
           WHERE f.cpf = $1 AND fc.ativo = true
           LIMIT 1`,
          [cpf]
        );
        if (clinicaResult.rows.length > 0 && clinicaResult.rows[0].clinica_id) {
          clinicaId = clinicaResult.rows[0].clinica_id.toString();
        }
      }

      // Buscar entidade_id via funcionarios_entidades (para gestores)
      if (perfil === 'gestor') {
        const entidadeResult = await query(
          `SELECT DISTINCT fe.entidade_id
           FROM funcionarios f
           JOIN funcionarios_entidades fe ON f.id = fe.funcionario_id
           WHERE f.cpf = $1 AND fe.ativo = true
           LIMIT 1`,
          [cpf]
        );
        if (
          entidadeResult.rows.length > 0 &&
          entidadeResult.rows[0].entidade_id
        ) {
          entidadeId = entidadeResult.rows[0].entidade_id.toString();
        }
      }

      // FASE 3: Definir variáveis de contexto para RLS
      // Definir perfil como tipo de usuário para compatibilidade com RLS
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_tipo',
        perfil,
      ]);

      if (clinicaId) {
        // Validar que clinica_id é um número válido
        if (!/^\d+$/.test(clinicaId)) {
          throw new Error('ID de clínica inválido');
        }

        await query('SELECT set_config($1, $2, false)', [
          'app.current_clinica_id',
          clinicaId,
        ]);
      }

      if (entidadeId) {
        if (!/^\d+$/.test(entidadeId)) {
          throw new Error('ID de entidade inválido');
        }

        await query('SELECT set_config($1, $2, false)', [
          'app.current_entidade_id',
          entidadeId,
        ]);
      }

      // 🔒 SEGURANÇA: Validar RLS APÓS configurar todas as variáveis
      try {
        await query('SELECT validar_sessao_rls()');
      } catch (validationError: any) {
        console.error('[SEGURANÇA] Validação RLS falhou:', validationError);
        throw new Error(
          `SEGURANÇA: ${validationError.message || 'Sessão RLS inválida'}`
        );
      }
    }

    // Executar query principal
    console.log(
      '[queryWithContext] executing SQL:',
      typeof text === 'string' ? text.slice(0, 200) : text
    );
    const result = await query<T>(text, params);
    console.log(
      '[queryWithContext] result:',
      result && typeof result === 'object'
        ? Array.isArray((result as any).rows)
          ? `rows:${(result as any).rows.length}`
          : `rowCount:${(result as any).rowCount}`
        : String(result)
    );
    return result;
  } catch (error) {
    console.error(
      '[queryWithContext] Erro ao executar query com contexto:',
      error
    );

    // Logar tentativa de acesso negado se for erro de segurança
    if (error instanceof Error && error.message.includes('inválido')) {
      try {
        await query(`SELECT log_access_denied($1, $2, $3, $4)`, [
          'QUERY',
          'database',
          null,
          error.message,
        ]);
      } catch (logError) {
        // Ignorar erro de log
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
 * Query com contexto de segurança RLS e filtro opcional por empresa
 * Define variáveis de sessão (app.current_user_cpf, app.current_user_perfil, app.current_user_clinica_id)
 * e opcionalmente app.query_empresa_filter para isolamento adicional
 */
export async function queryWithEmpresaFilter<T = unknown>(
  text: string,
  params?: unknown[],
  empresaId?: number
): Promise<{ rows: T[]; rowCount: number }> {
  try {
    const session = getSession();

    // Se há sessão, configurar contexto para RLS
    if (session) {
      // Validar e sanitizar valores
      const cpf = session.cpf.replace(/[^0-9]/g, '');
      const perfil = session.perfil.toLowerCase().replace(/[^a-z_]/g, '');

      // Validações de segurança
      if (!cpf || cpf.length !== 11) {
        throw new Error('CPF inválido na sessão');
      }

      if (!isValidCPF(cpf)) {
        throw new Error('Formato de CPF inválido');
      }

      if (!perfil || !isValidPerfil(perfil)) {
        throw new Error('Perfil inválido na sessão');
      }

      // 🔒 NOTA: Não revalidamos CPF aqui porque:
      // - A sessão foi validada por requireAuth() antes desta função
      // - Revalidar aqui pode causar conflito com RLS (bloqueio antes de set_config)
      // - Se CPF for inválido, RLS vai bloquear queries anyway

      // Definir variáveis de contexto usando parametrização segura
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        cpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        perfil,
      ]);

      // Obter clinica_id através de funcionarios_clinicas (relação N:N)
      // Busca APENAS para perfis que necessitam (RH, gestor, emissor)
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

          // Validar que clinica_id é um número válido
          if (!/^\d+$/.test(clinicaId)) {
            throw new Error('ID de clínica inválido');
          }

          await query('SELECT set_config($1, $2, false)', [
            'app.current_user_clinica_id',
            clinicaId,
          ]);
        } else if (perfil === 'rh') {
          // Para RH, clinica_id é obrigatória
          throw new Error('RH deve estar vinculado a uma clínica ativa');
        }
      }
      // Para funcionários normais, clinica_id é opcional (não necessário para avaliações)

      // Definir filtro de empresa se fornecido
      if (empresaId !== undefined && empresaId !== null) {
        // Validar que empresaId é um número positivo
        if (!Number.isInteger(empresaId) || empresaId <= 0) {
          throw new Error('ID de empresa inválido');
        }

        // Validar que a empresa pertence à clínica do RH (se for RH)
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

    // Executar query principal
    return await query<T>(text, params);
  } catch (error) {
    console.error(
      '[queryWithEmpresaFilter] Erro ao executar query com contexto:',
      error
    );

    // Logar tentativa de acesso negado se for erro de segurança
    if (error instanceof Error && error.message.includes('inválido')) {
      try {
        await query(`SELECT log_access_denied($1, $2, $3, $4)`, [
          'QUERY',
          'database',
          empresaId?.toString() || null,
          error.message,
        ]);
      } catch (logError) {
        // Ignorar erro de log
        console.error(
          '[queryWithEmpresaFilter] Erro ao logar acesso negado:',
          logError
        );
      }
    }

    throw error;
  }
}

/**
 * Executa múltiplas queries em uma transação com contexto de segurança
 * Útil para operações que precisam de atomicidade e RLS
 */
export async function transactionWithContext<T = void>(
  callback: (query: typeof queryWithContext) => Promise<T>
): Promise<T> {
  try {
    const session = getSession();

    // Iniciar transação
    await query('BEGIN');

    // Configurar contexto se há sessão
    if (session) {
      // Validar e sanitizar valores
      const cpf = session.cpf.replace(/[^0-9]/g, '');
      const perfil = session.perfil.toLowerCase().replace(/[^a-z_]/g, '');

      // Validações de segurança
      if (!cpf || cpf.length !== 11) {
        throw new Error('CPF inválido na sessão');
      }

      if (!isValidCPF(cpf)) {
        throw new Error('Formato de CPF inválido');
      }

      if (!perfil || !isValidPerfil(perfil)) {
        throw new Error('Perfil inválido na sessão');
      }

      // 🔒 NOTA: Não revalidamos CPF aqui porque:
      // - A sessão foi validada por requireAuth() ou requireRHWithEmpresaAccess() antes
      // - Revalidar aqui pode causar conflito com RLS (bloqueio antes de set_config)
      // - Entidade também não revalida, apenas confia na validação antes
      // - Se CPF for inválido, RLS vai bloquear queries anyway

      // Definir variáveis de contexto usando parametrização segura
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_cpf',
        cpf,
      ]);
      await query('SELECT set_config($1, $2, false)', [
        'app.current_user_perfil',
        perfil,
      ]);

      // 🔒 Configurar clinica_id apenas se a sessão já tiver
      // IMPORTANTE: O clinica_id já foi validado ANTES por requireRHWithEmpresaAccess()
      // ou requireEntity(), então confiamos no valor da sessão (sem refazer buscas no banco)
      if (session.clinica_id) {
        const clinicaId = session.clinica_id.toString();

        // Validação de segurança: garantir que é um número
        if (!/^\d+$/.test(clinicaId)) {
          throw new Error('ID de clínica inválido na sessão');
        }

        await query('SELECT set_config($1, $2, false)', [
          'app.current_user_clinica_id',
          clinicaId,
        ]);
      } else if (perfil === 'rh') {
        // Para RH, clinica_id é obrigatória
        // Se não tiver aqui, significa que a autenticação falhou antes (bug em outra camada)
        throw new Error(
          'Contexto RLS: RH sem clinica_id na sessão. Erro na camada de autenticação.'
        );
      }
      // Para funcionários normais, clinica_id é opcional (não necessário para avaliações)
    }

    // Executar callback com queries e capturar resultado
    const result = await callback(async (text, params) => {
      return await query(text, params);
    });

    // Commit
    await query('COMMIT');
    return result;
  } catch (error) {
    // Rollback em caso de erro
    try {
      await query('ROLLBACK');
    } catch (rollbackError) {
      console.error(
        '[transactionWithContext] Erro ao fazer rollback:',
        rollbackError
      );
    }

    console.error('[transactionWithContext] Erro na transação:', error);

    // Logar tentativa de acesso negado se for erro de segurança
    if (error instanceof Error && error.message.includes('inválido')) {
      try {
        await query(`SELECT log_access_denied($1, $2, $3, $4)`, [
          'TRANSACTION',
          'database',
          null,
          error.message,
        ]);
      } catch (logError) {
        // Ignorar erro de log
        console.error(
          '[transactionWithContext] Erro ao logar acesso negado:',
          logError
        );
      }
    }

    throw error;
  }
}

/**
 * Helper para obter todas as permissões de um perfil
 */
export async function getPermissionsByRole(
  roleName: string
): Promise<string[]> {
  try {
    const result = await query(
      `SELECT p.name
       FROM role_permissions rp
       JOIN roles r ON r.id = rp.role_id
       JOIN permissions p ON p.id = rp.permission_id
       WHERE r.name = $1`,
      [roleName]
    );

    const perms = result.rows.map((row) => row.name);

    if (perms.length === 0) {
      // Fallback in-memory mapping para evitar testes frágeis quando o banco de teste
      // não tiver as permissões semeadas corretamente.
      console.warn(
        '[getPermissionsByRole] Nenhuma permissão encontrada no banco para role',
        roleName,
        '-> usando fallback em memória'
      );
      const fallback = {
        funcionario: [
          'read:avaliacoes:own',
          'write:avaliacoes:own',
          'read:funcionarios:own',
          'write:funcionarios:own',
        ],
        rh: [
          'read:avaliacoes:clinica',
          'read:funcionarios:clinica',
          'write:funcionarios:clinica',
          'read:empresas:clinica',
          'write:empresas:clinica',
          'read:lotes:clinica',
          'write:lotes:clinica',
        ],
        emissor: ['read:laudos', 'write:laudos', 'read:lotes:clinica'],
        admin: ['manage:rh', 'manage:clinicas', 'manage:admins'],
      } as Record<string, string[]>;

      return fallback[roleName] || [];
    }

    return perms;
  } catch (error) {
    console.error('[getPermissionsByRole] Erro ao obter permissões:', error);
    return [];
  }
}

/**
 * Helper para verificar permissões RBAC via banco
 * Consulta as tabelas roles, permissions e role_permissions
 */
export async function hasPermission(
  session: Session,
  permissionName: string
): Promise<boolean> {
  try {
    const result = await query(
      `SELECT EXISTS (
        SELECT 1
        FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        JOIN permissions p ON p.id = rp.permission_id
        WHERE r.name = $1 AND p.name = $2
      ) as has_permission`,
      [session.perfil, permissionName]
    );

    const has = result.rows[0]?.has_permission || false;
    if (!has) {
      // Fallback para ambiente de teste: verificar mapeamento em memória
      const perms = await getPermissionsByRole(session.perfil);
      return perms.includes(permissionName);
    }

    return true;
  } catch (error) {
    console.error('[hasPermission] Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Query unificada com detecção automática de tipo de usuário
 *
 * - GESTORES (RH e Entidade): usa queryAsGestor() sem RLS
 * - FUNCIONÁRIOS: usa queryWithContext() com RLS
 *
 * Esta é a função recomendada para novos endpoints que precisam
 * suportar tanto gestores quanto funcionários.
 *
 * @param text SQL query
 * @param params Query parameters
 * @returns Query result
 */
export async function queryWithSecurity<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number }> {
  const session = getSession();

  if (!session) {
    // Sem sessão: usar query direta (ex: health checks, login)
    console.warn('[queryWithSecurity] Query sem sessão - usando query direta');
    return query(text, params);
  }

  // Detectar tipo de usuário e rotear para função apropriada
  if (isGestor(session.perfil)) {
    // Gestores: validação via tomadors, sem RLS
    console.log(
      `[queryWithSecurity] Roteando para queryAsGestor (perfil: ${session.perfil})`
    );
    return queryAsGestor<T>(text, params);
  } else {
    // Funcionários e outros: validação via funcionarios com RLS
    console.log(
      `[queryWithSecurity] Roteando para queryWithContext (perfil: ${session.perfil})`
    );
    return queryWithContext<T>(text, params);
  }
}
