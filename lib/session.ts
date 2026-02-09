import { query } from './db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

import { PerfilUsuarioType, NivelCargoType } from './types/enums';

// Re-exportar tipos para facilitar importação
export type { PerfilUsuarioType, NivelCargoType } from './types/enums';

// Tipos
export interface Session {
  cpf: string;
  nome: string;
  perfil: PerfilUsuarioType;
  nivelCargo?: NivelCargoType;
  // POLÍTICA DE NEGÓCIO - PAPÉIS E PERMISSÕES:
  //
  // 'admin': Gestão da PLATAFORMA (financeiro, auditoria, configurações globais)
  //          → NÃO tem clinica_id/entidade_id operacional
  //          → NÃO pode criar/editar empresas, funcionários, lotes
  //          → PODE acessar dados para auditorias/relatórios (via APIs /api/admin/*)
  //
  // 'rh': Gestor de CLÍNICA (operações dentro da clínica)
  //       → TEM clinica_id obrigatório
  //       → PODE criar/editar empresas, funcionários, liberar lotes
  //       → Isolamento: apenas recursos da própria clínica
  //
  // 'emissor': Usuário INDEPENDENTE (emissão de laudos)
  //            → NÃO vinculado a clinica_id/empresa_id
  //            → Acessa lotes finalizados de qualquer clínica para emitir laudos
  //
  // 'gestor': Gestor de ENTIDADE (ex.: grande empresa com múltiplas unidades)
  //           → TEM entidade_id obrigatório
  //           → Opera lotes da própria entidade
  clinica_id?: number; // Apenas para perfil 'rh'
  entidade_id?: number; // Apenas para perfil 'gestor'
  tomador_id?: number; // Identification do tomador (entidade ou clínica)
  sessionLogId?: number;
  sessionToken?: string; // Token único para rotação
  mfaVerified?: boolean; // Indica se MFA foi verificado
  lastRotation?: number; // Timestamp da última rotação
  rotationRequired?: boolean; // Indica que a rotação é necessária (persistir via Route Handler/Server Action)
}

// Gerar token único para sessão
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Criar sessão (armazenar em cookie seguro)
export function createSession(session: Session): void {
  const cookieStore = cookies();

  // Adicionar token único e timestamp de criação
  const sessionWithToken = {
    ...session,
    sessionToken: generateSessionToken(),
    lastRotation: Date.now(),
  };

  // Cookie httpOnly, secure, sameSite
  cookieStore.set('bps-session', JSON.stringify(sessionWithToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Secure when running in production
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 horas
    path: '/',
  });
}

// Regenerar sessão (rotação de chaves) - NÃO persiste cookie automaticamente
// Esta função retorna a nova sessão rotacionada. A persistência (escrever cookie)
// deve ser feita por um Route Handler ou Server Action chamando `persistSession`.
export function regenerateSession(session: Session): Session {
  // Novo token para rotação
  const rotatedSession = {
    ...session,
    sessionToken: generateSessionToken(),
    lastRotation: Date.now(),
  };

  return rotatedSession;
}

// Persistir sessão no cookie - chamar apenas em Server Actions / Route Handlers
export function persistSession(session: Session): void {
  const cookieStore = cookies();
  cookieStore.set('bps-session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.VERCEL === '1' || process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

// Obter sessão atual
export function getSession(): Session | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('bps-session');

    if (!sessionCookie?.value) {
      return null;
    }

    const session: Session = JSON.parse(sessionCookie.value);

    // Verificar se a sessão precisa de rotação (a cada 2 horas)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    if (session.lastRotation && Date.now() - session.lastRotation > TWO_HOURS) {
      // NÃO gravar cookie durante render — marcar necessidade de rotação para que
      // um Route Handler / Server Action possa persistir a rotação de forma segura.
      session.rotationRequired = true;
      // [DEBUG] Silenciado: getSession realiza rotação de sessão via Route Handler/Server Action
    }

    return session;
  } catch (error) {
    console.error('Erro ao obter sessão:', error);
    return null;
  }
}

// Destruir sessão
export function destroySession(): void {
  const cookieStore = cookies();
  cookieStore.delete('bps-session');
}

// Verificar se usuário está autenticado
// Verificar se usuário está autenticado
export async function requireAuth(): Promise<Session> {
  const session = getSession();

  if (!session) {
    throw new Error('Não autenticado');
  }

  return Promise.resolve(session);
}

// Verificar perfil específico
export async function requireRole(
  role: PerfilUsuarioType | PerfilUsuarioType[],
  enforceMfa: boolean = true
): Promise<Session> {
  const session = await requireAuth();

  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!allowedRoles.includes(session.perfil)) {
    console.log(
      `[DEBUG] requireRole: Perfil ${
        session.perfil
      } não autorizado para roles ${allowedRoles.join(', ')}`
    );
    throw new Error('Sem permissão');
  }

  // Verificar MFA para admins (desabilitado em desenvolvimento)
  if (
    enforceMfa &&
    session.perfil === 'admin' &&
    !session.mfaVerified &&
    process.env.NODE_ENV === 'production'
  ) {
    console.log(
      `[DEBUG] requireRole: Admin ${session.cpf} precisa verificar MFA`
    );
    throw new Error('MFA_REQUIRED');
  }

  console.log(
    `[DEBUG] requireRole: Acesso autorizado para ${session.cpf} com perfil ${session.perfil}`
  );
  return session;
}

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
    } catch (err) {
      console.log(
        `[DEBUG] requireRHWithEmpresaAccess: Erro ao mapear clínica: ${err?.message || err}`
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
      } catch (err) {
        console.log(
          `[DEBUG] requireClinica: Falha ao mapear clínica via tomador_id: ${err?.message || err}`
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
      } catch (err) {
        console.log(
          `[DEBUG] requireClinica: Falha ao mapear clínica via tomador_id (fallback): ${err?.message || err}`
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
