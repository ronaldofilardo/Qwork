/**
 * lib/session-representante.ts
 * Gestão de sessão para Representantes Comerciais.
 *
 * Suporta leitura DUAL-MODE:
 * 1) bps-session (perfil='representante') — novo, criado via createSession()
 * 2) rep-session — fallback para sessões antigas ainda ativas
 *
 * A criação de novas rep-session foi removida. Use lib/session.ts::createSession.
 */
import { cookies } from 'next/headers';
import { query } from './db';
import type { Session } from './session';

export interface RepresentanteSession {
  representante_id: number;
  nome: string;
  email: string;
  cpf?: string; // disponível quando logado via bps-session
  status: string;
  tipo_pessoa: 'pf' | 'pj';
  criado_em_ms: number; // epoch ms para expiração
}

const COOKIE_NAME = 'rep-session';
const BPS_COOKIE_NAME = 'bps-session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 horas — validação de rep-session legado

// ------------------------------------------------------------------
// Obter sessão — tenta bps-session (unificado), depois rep-session (fallback)
// ------------------------------------------------------------------
export function getSessaoRepresentante(): RepresentanteSession | null {
  try {
    const cookieStore = cookies();

    // 1) Tentar bps-session (login unificado)
    const bps = cookieStore.get(BPS_COOKIE_NAME);
    if (bps?.value) {
      try {
        const sess = JSON.parse(bps.value);
        if (sess.perfil === 'representante' && sess.representante_id) {
          // Converter bps-session para RepresentanteSession
          return {
            representante_id: sess.representante_id,
            nome: sess.nome || '',
            email: '', // não disponível em bps-session — preenchido em requireRepresentanteComDB
            cpf: sess.cpf || undefined,
            status: '', // será validado no DB quando necessário
            tipo_pessoa: sess.tipo_pessoa || 'pf',
            criado_em_ms: sess.lastRotation || Date.now(),
          };
        }
      } catch {
        // bps-session inválida — tentar rep-session
      }
    }

    // 2) Fallback: rep-session (login legado)
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie?.value) return null;
    console.warn(
      '[DEPRECATED] Sessão rep-session lida como fallback. Migrar para bps-session com perfil=representante.'
    );
    const sess: RepresentanteSession = JSON.parse(cookie.value);
    // Verificar expiração
    if (Date.now() - sess.criado_em_ms > SESSION_DURATION_MS) {
      return null;
    }
    return sess;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------
// Destruir sessão (ambos cookies se presentes)
// ------------------------------------------------------------------
export function destruirSessaoRepresentante(): void {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);

  // Se bps-session tem perfil 'representante', destruir também
  try {
    const bps = cookieStore.get(BPS_COOKIE_NAME);
    if (bps?.value) {
      const sess = JSON.parse(bps.value);
      if (sess.perfil === 'representante') {
        cookieStore.delete(BPS_COOKIE_NAME);
      }
    }
  } catch {
    // ignorar erros
  }
}

// ------------------------------------------------------------------
// requireRepresentante — usar nas API routes dos representantes
// Lança Error se não autenticado ou se status for impeditivo.
// ------------------------------------------------------------------
export function requireRepresentante(): RepresentanteSession {
  const sess = getSessaoRepresentante();
  if (!sess) {
    throw new Error('REP_NAO_AUTENTICADO');
  }

  // Validação leve de status no cookie (sem query DB a cada request)
  const statusBloqueados = ['desativado', 'rejeitado'];
  if (statusBloqueados.includes(sess.status)) {
    throw new Error('REP_CONTA_INATIVA');
  }

  return sess;
}

// ------------------------------------------------------------------
// requireRepresentanteComDB — validação completa contra DB
// Usar em operações sensíveis (alteração de dados, etc.)
// ESC-3: Passa sessão ao query() para garantir SET LOCAL de RLS em ambos
//        os paths (legado rep-session e unificado bps-session).
// ------------------------------------------------------------------
export async function requireRepresentanteComDB(): Promise<RepresentanteSession> {
  const sess = getSessaoRepresentante();
  if (!sess) {
    throw new Error('REP_NAO_AUTENTICADO');
  }

  // Montar objeto compatível com Session para habilitar RLS via SET LOCAL
  const rlsSession: Session = {
    cpf: sess.cpf ?? '',
    nome: sess.nome,
    perfil: 'representante',
    representante_id: sess.representante_id,
  };

  const result = await query(
    `SELECT id, nome, email, status, tipo_pessoa FROM representantes WHERE id = $1 LIMIT 1`,
    [sess.representante_id],
    rlsSession
  );

  if (result.rows.length === 0) {
    throw new Error('REP_NAO_ENCONTRADO');
  }

  const rep = result.rows[0];
  if (['desativado', 'rejeitado'].includes(rep.status)) {
    throw new Error('REP_CONTA_INATIVA');
  }

  // Atualizar dados do cookie com dados frescos (sem recriar cookie)
  return {
    ...sess,
    nome: rep.nome,
    email: rep.email,
    status: rep.status,
    tipo_pessoa: rep.tipo_pessoa,
  };
}

// ------------------------------------------------------------------
// Helpers de resposta padrão para erros de autenticação
// ------------------------------------------------------------------
export function repAuthErrorResponse(err: Error) {
  if (err.message === 'REP_NAO_AUTENTICADO') {
    return {
      status: 401,
      body: { error: 'Não autenticado. Faça login como representante.' },
    };
  }
  if (err.message === 'REP_CONTA_INATIVA') {
    return { status: 403, body: { error: 'Conta desativada ou rejeitada.' } };
  }
  if (err.message === 'REP_NAO_ENCONTRADO') {
    return { status: 404, body: { error: 'Representante não encontrado.' } };
  }
  return { status: 500, body: { error: 'Erro interno.' } };
}
