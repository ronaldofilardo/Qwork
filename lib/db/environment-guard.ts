/**
 * lib/db/environment-guard.ts
 *
 * Valida permissões de acesso por ambiente de banco.
 * Somente emissores podem selecionar ambiente; produção
 * exige CPF na whitelist ALLOWED_PROD_EMISSORES_CPFS.
 */

export type DbEnvironment = 'development' | 'staging' | 'production';

interface AccessResult {
  allowed: boolean;
  reason: string;
}

/**
 * Retorna o conjunto de CPFs autorizados a acessar produção.
 * Lê de ALLOWED_PROD_EMISSORES_CPFS (comma-separated) em runtime.
 */
function getAllowedProdCpfs(): Set<string> {
  const raw = process.env.ALLOWED_PROD_EMISSORES_CPFS ?? '';
  const cpfs = raw
    .split(',')
    .map((c) => c.trim().replace(/\D/g, ''))
    .filter(Boolean);
  return new Set(cpfs);
}

/**
 * Valida se o CPF do emissor tem permissão para acessar o ambiente solicitado.
 *
 * - development: sempre permitido para emissores
 * - staging: sempre permitido para emissores (requer STAGING_DATABASE_URL configurada)
 * - production: apenas CPFs presentes em ALLOWED_PROD_EMISSORES_CPFS
 */
export function validateDbEnvironmentAccess(
  cpf: string,
  dbEnvironment: DbEnvironment
): AccessResult {
  const cleanCpf = cpf.replace(/\D/g, '');

  if (dbEnvironment === 'production') {
    const allowed = getAllowedProdCpfs();
    if (allowed.size === 0) {
      return {
        allowed: false,
        reason:
          'Acesso ao ambiente de produção não está habilitado. Configure ALLOWED_PROD_EMISSORES_CPFS.',
      };
    }
    if (!allowed.has(cleanCpf)) {
      return {
        allowed: false,
        reason:
          'Seu CPF não possui permissão para acessar o ambiente de produção.',
      };
    }
  }

  if (dbEnvironment === 'staging') {
    if (!process.env.STAGING_DATABASE_URL) {
      return {
        allowed: false,
        reason:
          'Ambiente de homologação não está configurado (STAGING_DATABASE_URL ausente).',
      };
    }
  }

  if (dbEnvironment === 'development') {
    if (!process.env.LOCAL_DATABASE_URL) {
      return {
        allowed: false,
        reason:
          'Banco de desenvolvimento não está configurado (LOCAL_DATABASE_URL ausente).',
      };
    }
  }

  return { allowed: true, reason: '' };
}
