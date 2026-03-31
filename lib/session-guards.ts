/**
 * Guards de autorização com acesso ao banco — extraído de lib/session.ts
 * Responsabilidade: verificar permissões de acesso que dependem de queries ao banco
 */
import { query } from './db';
import type { Session } from './types/session';
import { requireAuth, createSession } from './session';

// Verificar se usuário RH (gestor de clínica) tem acesso à empresa específica
// IMPORTANTE: Admin NÃO tem acesso operacional a empresas — apenas RH
export async function requireRHWithEmpresaAccess(
  empresaId: number
): Promise<Session> {
  const session = await requireAuth();

  // Apenas RH pode acessar empresas operacionalmente (Admin é apenas administrativo)
  if (session.perfil !== 'rh') {
    console.log(
      `[DEBUG] requireRHWithEmpresaAccess: Perfil ${session.perfil} não autorizado (apenas RH)`
    );
    throw new Error(
      'Apenas gestores RH ou administradores podem acessar empresas'
    );
  }

  // Tentar mapear clinica_id via entidade_id (ou tomador_id legacy) se não estiver na sessão
  if (!session.clinica_id && session.entidade_id) {
    console.log(
      `[DEBUG] requireRHWithEmpresaAccess: RH ${session.cpf} sem clinica_id - tentando mapear via entidade_id`
    );

    try {
      const entidadeIdParaBusca = session.entidade_id || session.entidade_id;
      const fallback = await query(
        `SELECT cl.id, cl.ativa, c.tipo 
         FROM clinicas cl
         INNER JOIN entidades c ON c.id = cl.entidade_id
         WHERE cl.entidade_id = $1 AND c.tipo = 'clinica'
         LIMIT 1`,
        [entidadeIdParaBusca]
      );

      if (fallback.rows.length > 0) {
        const mapped = fallback.rows[0];
        if (!mapped.ativa) {
          throw new Error('Clínica inativa. Entre em contato com o suporte.');
        }

        session.clinica_id = mapped.id;
        createSession(session); // Persistir na sessão
        console.log(
          `[DEBUG] requireRHWithEmpresaAccess: Clínica mapeada -> ${mapped.id}`
        );
      }
    } catch (err: unknown) {
      console.log(
        `[DEBUG] requireRHWithEmpresaAccess: Erro ao mapear clínica: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  // Verificar se o RH tem clinica_id na sessão (após tentativa de mapeamento)
  if (!session.clinica_id) {
    console.log(
      `[DEBUG] requireRHWithEmpresaAccess: RH ${session.cpf} sem clinica_id na sessão`
    );
    throw new Error('Clínica não identificada na sessão do RH');
  }

  // Verificar se a empresa pertence à clínica do RH
  const empresaResult = await query(
    'SELECT clinica_id FROM empresas_clientes WHERE id = $1',
    [empresaId]
  );

  if (empresaResult.rows.length === 0) {
    console.log(
      `[DEBUG] requireRHWithEmpresaAccess: Empresa ${empresaId} não encontrada`
    );
    throw new Error('Empresa não encontrada');
  }

  const empresaClinicaId = empresaResult.rows[0].clinica_id;

  // Reforçar política: RH só pode acessar empresas da própria clínica
  if (empresaClinicaId !== session.clinica_id) {
    console.log(
      `[DEBUG] requireRHWithEmpresaAccess: Empresa ${empresaId} pertence à clínica ${empresaClinicaId}, mas gestor está na clínica ${session.clinica_id} (acesso negado)`
    );
    throw new Error('Você não tem permissão para acessar esta empresa');
  }

  console.log(
    `[DEBUG] requireRHWithEmpresaAccess: Acesso autorizado para RH ${session.cpf} à empresa ${empresaId}`
  );
  return session;
}

// Verificar se usuário é gestor de entidade e retornar entidade_id
export async function requireEntity(): Promise<
  Session & { entidade_id: number }
> {
  const session = await requireAuth();

  if (session.perfil !== 'gestor') {
    console.log(`[DEBUG] requireEntity: Perfil ${session.perfil} não é gestor`);
    throw new Error('Acesso restrito a gestores de entidade');
  }

  if (!session.entidade_id) {
    console.log(
      `[DEBUG] requireEntity: Gestor ${session.cpf} sem entidade_id na sessão`
    );
    throw new Error('Entidade não identificada na sessão');
  }

  // Verificar se entidade existe e é ativo
  const entidadeResult = await query(
    "SELECT id, tipo, ativa FROM entidades WHERE id = $1 AND tipo = 'entidade'",
    [session.entidade_id]
  );

  if (entidadeResult.rows.length === 0) {
    console.log(
      `[DEBUG] requireEntity: Entidade ${session.entidade_id} não encontrada ou não é entidade`
    );
    throw new Error('Entidade não encontrada');
  }

  const entidade = entidadeResult.rows[0];

  if (!entidade.ativa) {
    console.log(
      `[DEBUG] requireEntity: Entidade ${session.entidade_id} está inativa`
    );
    throw new Error('Entidade inativa. Entre em contato com o suporte.');
  }

  return session as Session & { entidade_id: number };
}

// Verificar se usuário é RH (gestor de clínica) e retornar clinica_id
// IMPORTANTE: Admin NÃO tem papel operacional em clínicas — apenas RH
export async function requireClinica(): Promise<
  Session & { clinica_id: number }
> {
  const session = await requireAuth();

  // Apenas RH pode executar operações de clínica (criar empresas, funcionários, lotes)
  if (session.perfil !== 'rh') {
    console.log(
      `[DEBUG] requireClinica: Perfil ${session.perfil} não é RH (acesso negado)`
    );
    throw new Error(
      'Acesso restrito: apenas gestores RH (gestor de clínica) podem executar esta operação'
    );
  }

  if (!session.clinica_id) {
    console.log(
      `[DEBUG] requireClinica: Gestor ${session.cpf} sem clinica_id na sessão - tentando mapear via entidade_id`
    );

    // Tentar mapear a clínica a partir do entidade_id presente na sessão
    if (session.entidade_id) {
      try {
        const entidadeIdParaBusca = session.entidade_id;
        // Buscar clínica vinculada à entidade
        const fallback = await query(
          `SELECT cl.id, cl.ativa, c.tipo 
           FROM clinicas cl
           INNER JOIN entidades c ON c.id = cl.entidade_id
           WHERE cl.entidade_id = $1 
           LIMIT 1`,
          [entidadeIdParaBusca]
        );

        if (fallback.rows.length > 0) {
          const mapped = fallback.rows[0];

          // Verificar se tomador é realmente do tipo 'clinica'
          if (mapped.tipo !== 'clinica') {
            console.log(
              `[DEBUG] requireClinica: tomador ${session.entidade_id} tem tipo '${mapped.tipo}', não 'clinica'`
            );
            throw new Error('tomador não é do tipo clínica');
          }

          if (!mapped.ativa) {
            console.log(
              `[DEBUG] requireClinica: Clínica mapeada ${mapped.id} está inativa`
            );
            throw new Error('Clínica inativa. Entre em contato com o suporte.');
          }

          // Atualizar sessão localmente com o clinica_id mapeado
          session.clinica_id = mapped.id;
          console.log(
            `[DEBUG] requireClinica: Clínica mapeada com sucesso para gestor ${session.cpf} -> clínica ${mapped.id}`
          );

          // CRÍTICO: Persistir clinica_id na sessão (cookie) para evitar re-mapeamento
          createSession(session);
        } else {
          console.log(
            `[DEBUG] requireClinica: Nenhuma clínica encontrada para tomador_id ${session.entidade_id}`
          );
          const msg = `Clínica não identificada na sessão para tomador_id ${session.entidade_id}. Verifique se o cadastro da clínica foi concluído.`;
          throw new Error(msg);
        }
      } catch (err: unknown) {
        console.log(
          `[DEBUG] requireClinica: Falha ao mapear clínica via tomador_id: ${err instanceof Error ? err.message : String(err)}`
        );
        // Propagar erro específico para melhor diagnóstico
        throw err instanceof Error
          ? err
          : new Error(
              session.entidade_id
                ? `Clínica não identificada na sessão para tomador_id ${session.entidade_id}`
                : 'Clínica não identificada na sessão'
            );
      }
    } else {
      throw new Error('Clínica não identificada na sessão');
    }
  }

  // Verificar se clínica existe e é ativa
  const clinicaResult = await query(
    'SELECT id, ativa FROM clinicas WHERE id = $1',
    [session.clinica_id]
  );

  if (clinicaResult.rows.length === 0) {
    console.log(
      `[DEBUG] requireClinica: Clínica ${session.clinica_id} não encontrada - tentando mapear via tomador`
    );

    // Tentativa de fallback: mapear clínica a partir do tomador_id se presente na sessão
    if (session.entidade_id) {
      try {
        const fallback = await query(
          'SELECT id, ativa FROM clinicas WHERE entidade_id = $1 LIMIT 1',
          [session.entidade_id]
        );

        if (fallback.rows.length > 0) {
          const mapped = fallback.rows[0];
          if (!mapped.ativa) {
            console.log(
              `[DEBUG] requireClinica: Clínica mapeada ${mapped.id} está inativa`
            );
            throw new Error('Clínica inativa. Entre em contato com o suporte.');
          }

          // Atualizar sessão localmente com o clinica_id mapeado
          session.clinica_id = mapped.id;
          console.log(
            `[DEBUG] requireClinica: Clínica mapeada com sucesso para gestor ${session.cpf} -> clínica ${mapped.id}`
          );

          // CRÍTICO: Persistir clinica_id na sessão (cookie)
          createSession(session);

          return session as Session & { clinica_id: number };
        }
      } catch (err: unknown) {
        console.log(
          `[DEBUG] requireClinica: Falha ao mapear clínica via tomador_id (fallback): ${err instanceof Error ? err.message : String(err)}`
        );
        throw new Error(
          session.entidade_id
            ? `Clínica não identificada na sessão para tomador_id ${session.entidade_id}`
            : 'Clínica não identificada na sessão'
        );
      }
    }

    console.log(
      `[DEBUG] requireClinica: Clínica ${session.clinica_id} não encontrada`
    );
    throw new Error('Clínica não encontrada');
  }

  const clinica = clinicaResult.rows[0];

  if (!clinica.ativa) {
    console.log(
      `[DEBUG] requireClinica: Clínica ${session.clinica_id} está inativa`
    );
    throw new Error('Clínica inativa. Entre em contato com o suporte.');
  }

  console.log(
    `[DEBUG] requireClinica: Acesso autorizado para gestor ${session.cpf} da clínica ${session.clinica_id}`
  );

  return session as Session & { clinica_id: number };
}
