/**
 * lib/validators/representante.ts
 *
 * Validação centralizada de unicidade para representantes.
 * Evita duplicação de lógica entre cadastro público, comercial e admin.
 */

import { query } from '@/lib/db';
import { checkCpfUnicoSistema } from '@/lib/validators/cpf-unico';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  field: 'email' | 'cpf' | 'cnpj' | null;
  message: string | null;
  source: 'representante' | 'lead' | null;
}

const NO_DUPLICATE: DuplicateCheckResult = {
  isDuplicate: false,
  field: null,
  message: null,
  source: null,
};

/**
 * Verifica se email já existe em representantes ou leads ativos.
 */
export async function checkEmailDuplicate(
  email: string
): Promise<DuplicateCheckResult> {
  const [repResult, leadResult] = await Promise.all([
    query<{ id: number }>(
      `SELECT id FROM representantes WHERE email = $1 LIMIT 1`,
      [email]
    ),
    query<{ id: string }>(
      `SELECT id FROM representantes_cadastro_leads WHERE email = $1 AND status NOT IN ('rejeitado', 'convertido') LIMIT 1`,
      [email]
    ),
  ]);

  if (repResult.rows.length > 0) {
    return {
      isDuplicate: true,
      field: 'email',
      message: 'Este e-mail já está cadastrado como representante',
      source: 'representante',
    };
  }

  if (leadResult.rows.length > 0) {
    return {
      isDuplicate: true,
      field: 'email',
      message: 'Este e-mail já possui um cadastro em análise',
      source: 'lead',
    };
  }

  return NO_DUPLICATE;
}

/**
 * Verifica se CPF já existe no sistema (representantes, leads, vendedores, gestores, rh).
 * Delega para checkCpfUnicoSistema para cobertura cross-perfil.
 */
export async function checkCpfDuplicate(
  cpf: string
): Promise<DuplicateCheckResult> {
  const result = await checkCpfUnicoSistema(cpf);
  if (!result.disponivel) {
    const isLead = result.perfil === 'representante_lead';
    return {
      isDuplicate: true,
      field: 'cpf',
      message: result.message ?? 'CPF já cadastrado no sistema',
      source: isLead ? 'lead' : 'representante',
    };
  }
  return NO_DUPLICATE;
}

/**
 * Verifica se CNPJ já existe em representantes ou leads ativos.
 */
export async function checkCnpjDuplicate(
  cnpj: string
): Promise<DuplicateCheckResult> {
  const [repResult, leadResult] = await Promise.all([
    query<{ id: number }>(
      `SELECT id FROM representantes WHERE cnpj = $1 LIMIT 1`,
      [cnpj]
    ),
    query<{ id: string }>(
      `SELECT id FROM representantes_cadastro_leads WHERE cnpj = $1 AND status NOT IN ('rejeitado', 'convertido') LIMIT 1`,
      [cnpj]
    ),
  ]);

  if (repResult.rows.length > 0) {
    return {
      isDuplicate: true,
      field: 'cnpj',
      message: 'Este CNPJ já está cadastrado como representante',
      source: 'representante',
    };
  }

  if (leadResult.rows.length > 0) {
    return {
      isDuplicate: true,
      field: 'cnpj',
      message: 'Este CNPJ já possui um cadastro em análise',
      source: 'lead',
    };
  }

  return NO_DUPLICATE;
}

/**
 * Verificação completa de duplicatas para um representante.
 * Checa email, e opcionalmente CPF (PF) ou CNPJ (PJ).
 */
export async function checkRepresentanteDuplicates(params: {
  email: string;
  tipoPessoa: 'pf' | 'pj';
  cpf?: string | null;
  cnpj?: string | null;
}): Promise<DuplicateCheckResult> {
  const emailCheck = await checkEmailDuplicate(params.email);
  if (emailCheck.isDuplicate) return emailCheck;

  if (params.tipoPessoa === 'pf' && params.cpf) {
    const cpfCheck = await checkCpfDuplicate(params.cpf);
    if (cpfCheck.isDuplicate) return cpfCheck;
  }

  if (params.tipoPessoa === 'pj' && params.cnpj) {
    const cnpjCheck = await checkCnpjDuplicate(params.cnpj);
    if (cnpjCheck.isDuplicate) return cnpjCheck;
  }

  return NO_DUPLICATE;
}
