/**
 * lib/middleware-tenant-validation.ts
 *
 * Validação de isolamento multi-tenant para rotas API.
 * Garante que usuários autenticados só acessem dados do próprio tenant.
 *
 * Uso em rotas:
 *   const violation = validateTenantAccess(session, { clinica_id, entidade_id });
 *   if (violation) return violation;
 */

import { NextResponse } from 'next/server';
import type { Session } from './session';

interface TenantParams {
  clinica_id?: string | number | null;
  entidade_id?: string | number | null;
  empresa_id?: string | number | null;
}

/**
 * Valida se os IDs de tenant nos query params/body são compatíveis com a sessão.
 * Retorna NextResponse de erro (403) se houver violação, ou null se OK.
 *
 * Regras:
 * - admin/suporte/comercial: acesso irrestrito (administrativo)
 * - rh: clinica_id deve ser igual ao session.clinica_id
 * - gestor: entidade_id deve ser igual ao session.entidade_id
 * - vendedor: sem acesso a dados de outros tenants
 * - emissor: sem validação de tenant (acessa lotes de qualquer clínica)
 */
export function validateTenantAccess(
  session: Session,
  params: TenantParams
): NextResponse | null {
  // Perfis administrativos têm acesso cross-tenant
  if (['admin', 'suporte', 'comercial'].includes(session.perfil)) {
    return null;
  }

  // Emissor acessa lotes de qualquer clínica (papel operacional independente)
  if (session.perfil === 'emissor') {
    return null;
  }

  // RH: validar clinica_id
  if (session.perfil === 'rh') {
    const requestedClinicaId =
      params.clinica_id != null ? Number(params.clinica_id) : null;
    if (
      requestedClinicaId != null &&
      requestedClinicaId !== session.clinica_id
    ) {
      console.error(
        `[TENANT_VIOLATION] RH CPF ***${session.cpf.slice(-4)} tentou acessar clinica_id=${requestedClinicaId} (session.clinica_id=${session.clinica_id})`
      );
      return NextResponse.json(
        { error: 'Acesso negado: dados de outra clínica' },
        { status: 403 }
      );
    }
  }

  // Gestor: validar entidade_id
  if (session.perfil === 'gestor') {
    const requestedEntidadeId =
      params.entidade_id != null ? Number(params.entidade_id) : null;
    if (
      requestedEntidadeId != null &&
      requestedEntidadeId !== session.entidade_id
    ) {
      console.error(
        `[TENANT_VIOLATION] Gestor CPF ***${session.cpf.slice(-4)} tentou acessar entidade_id=${requestedEntidadeId} (session.entidade_id=${session.entidade_id})`
      );
      return NextResponse.json(
        { error: 'Acesso negado: dados de outra entidade' },
        { status: 403 }
      );
    }
  }

  // Vendedor: não deve acessar dados de clínicas/entidades diretamente
  if (session.perfil === 'vendedor') {
    if (params.clinica_id != null || params.entidade_id != null) {
      console.error(
        `[TENANT_VIOLATION] Vendedor CPF ***${session.cpf.slice(-4)} tentou acessar dados de tenant`
      );
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
  }

  return null; // Sem violação
}

/**
 * Extrai parâmetros de tenant de query params de um Request.
 */
export function extractTenantParams(
  searchParams: URLSearchParams
): TenantParams {
  return {
    clinica_id: searchParams.get('clinica_id'),
    entidade_id: searchParams.get('entidade_id'),
    empresa_id: searchParams.get('empresa_id'),
  };
}
