import { query } from './db';
import { Session } from './session';

/**
 * Validações de Segurança em Tempo de Execução
 */

/**
 * Valida se a sessão do usuário é consistente com os dados do banco
 */
export async function validateSessionIntegrity(session: Session): Promise<{
  isValid: boolean;
  issues: string[];
}> {
  const issues: string[] = [];

  try {
    // Verificar se usuário existe
    const userResult = await query(
      'SELECT cpf, nome, perfil, clinica_id, empresa_id, ativo FROM funcionarios WHERE cpf = $1',
      [session.cpf]
    );

    if (userResult.rows.length === 0) {
      issues.push('Usuário não encontrado no banco de dados');
      return { isValid: false, issues };
    }

    const user = userResult.rows[0];

    // Verificar se usuário está ativo
    if (!user.ativo) {
      issues.push('Usuário está inativo');
    }

    // Verificar consistência de perfil
    if (user.perfil !== session.perfil) {
      issues.push(
        `Perfil inconsistente: sessão=${session.perfil}, banco=${user.perfil}`
      );
    }

    // Verificar clinica_id se aplicável
    if (user.perfil === 'rh' || user.perfil === 'funcionario') {
      if (!user.clinica_id) {
        issues.push(`${user.perfil} deve ter clinica_id definida`);
      } else if (session.clinica_id !== user.clinica_id) {
        issues.push(
          `clinica_id inconsistente: sessão=${session.clinica_id}, banco=${user.clinica_id}`
        );
      }
    }

    // Verificar empresa_id se aplicável
    if (user.perfil === 'funcionario' && user.empresa_id) {
      // Validar que empresa pertence à clínica correta
      const empresaResult = await query(
        'SELECT clinica_id FROM empresas_clientes WHERE id = $1',
        [user.empresa_id]
      );

      if (empresaResult.rows.length > 0) {
        const empresaClinicaId = empresaResult.rows[0].clinica_id;
        if (empresaClinicaId !== user.clinica_id) {
          issues.push(
            `Empresa ${user.empresa_id} não pertence à clínica ${user.clinica_id} do funcionário`
          );
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  } catch (error) {
    issues.push(
      `Erro ao validar sessão: ${error instanceof Error ? error.message : String(error)}`
    );
    return { isValid: false, issues };
  }
}

/**
 * Valida se usuário tem acesso consistente aos recursos
 */
export async function validateResourceAccess(
  session: Session,
  resourceType: 'empresa' | 'clinica' | 'funcionario',
  resourceId: number
): Promise<{
  hasAccess: boolean;
  reason?: string;
}> {
  try {
    switch (resourceType) {
      case 'clinica':
        // Admin NÃO tem acesso operacional a clínicas
        // Admin só cria clinicas via endpoint /api/admin/cadastro/clinica
        if (session.perfil === 'admin') {
          return {
            hasAccess: false,
            reason: 'Admin não tem acesso operacional a clínicas',
          };
        }

        // RH e funcionário só podem acessar sua própria clínica
        if (session.clinica_id === resourceId) {
          return { hasAccess: true };
        }

        return {
          hasAccess: false,
          reason: `Acesso negado: usuário da clínica ${session.clinica_id} tentou acessar clínica ${resourceId}`,
        };

      case 'empresa':
        // Admin NÃO tem acesso operacional a empresas
        if (session.perfil === 'admin') {
          return {
            hasAccess: false,
            reason: 'Admin não tem acesso operacional a empresas',
          };
        }

        // Verificar se empresa pertence à clínica do usuário
        const empresaResult = await query(
          'SELECT clinica_id FROM empresas_clientes WHERE id = $1',
          [resourceId]
        );

        if (empresaResult.rows.length === 0) {
          return { hasAccess: false, reason: 'Empresa não encontrada' };
        }

        const empresaClinicaId = empresaResult.rows[0].clinica_id;

        // RH e funcionário só podem acessar empresas de sua clínica
        if (session.clinica_id === empresaClinicaId) {
          return { hasAccess: true };
        }

        return {
          hasAccess: false,
          reason: `Empresa pertence à clínica ${empresaClinicaId}, mas usuário é da clínica ${session.clinica_id}`,
        };

      case 'funcionario':
        // Admin NÃO tem acesso operacional a NENHUM funcionario
        // Admin só cria funcionarios RH via endpoint /api/admin/cadastro/rh
        if (session.perfil === 'admin') {
          return {
            hasAccess: false,
            reason: 'Admin não tem acesso operacional a funcionários',
          };
        }

        // Verificar clínica do funcionário alvo
        const funcResult = await query(
          'SELECT clinica_id, perfil FROM funcionarios WHERE cpf = $1',
          [resourceId.toString().padStart(11, '0')]
        );

        if (funcResult.rows.length === 0) {
          return { hasAccess: false, reason: 'Funcionário não encontrado' };
        }

        const funcClinicaId = funcResult.rows[0].clinica_id;

        // Funcionário só pode acessar seus próprios dados
        if (
          session.perfil === 'funcionario' &&
          session.cpf === resourceId.toString().padStart(11, '0')
        ) {
          return { hasAccess: true };
        }

        // RH pode acessar funcionários de sua clínica
        if (session.perfil === 'rh' && session.clinica_id === funcClinicaId) {
          return { hasAccess: true };
        }

        return {
          hasAccess: false,
          reason: `Funcionário pertence à clínica ${funcClinicaId}, mas usuário é da clínica ${session.clinica_id}`,
        };

      default:
        return { hasAccess: false, reason: 'Tipo de recurso inválido' };
    }
  } catch (error) {
    return {
      hasAccess: false,
      reason: `Erro na validação: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
