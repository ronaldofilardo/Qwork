/**
 * lib/db-safe.ts
 *
 * Funções de sanitização para uso em queries SQL dinâmicas (SET LOCAL, etc).
 * Previne SQL Injection em contextos onde parameterized queries ($1) não são suportados.
 *
 * REGRA: Todas as rotas que usam SET LOCAL devem importar estas funções.
 * NUNCA use template literals diretos com dados de usuário em queries SQL.
 */

/**
 * Escapa string para uso seguro em valores SQL entre aspas simples.
 * Remove caracteres nulos, escapa aspas simples (SQL standard doubling).
 *
 * Uso: `SET LOCAL app.current_user_cpf = '${escapeSqlString(cpf)}'`
 */
export function escapeSqlString(value: string): string {
  if (typeof value !== 'string') {
    throw new Error('escapeSqlString: valor deve ser string');
  }
  // Remove null bytes (potencial truncation attack)
  // Escapa aspas simples dobrando (SQL standard)
  // Remove backslashes que poderiam ser usados em escapes
  return value.replace(/\0/g, '').replace(/\\/g, '\\\\').replace(/'/g, "''");
}

/**
 * Valida e escapa um CPF para uso em SET LOCAL.
 * CPF deve conter apenas dígitos (11 chars) ou formato com pontos/traço.
 * Rejeita qualquer CPF com caracteres suspeitos.
 */
export function escapeCpfForSql(cpf: string): string {
  if (typeof cpf !== 'string') {
    throw new Error('escapeCpfForSql: CPF deve ser string');
  }
  // Aceita apenas dígitos, pontos e traço (formato CPF)
  const cleanCpf = cpf.replace(/[\.\-]/g, '');
  if (!/^\d{11}$/.test(cleanCpf)) {
    throw new Error('escapeCpfForSql: CPF inválido');
  }
  return cleanCpf;
}

/**
 * Valida e escapa um perfil para uso em SET LOCAL.
 * Perfil deve ser um dos valores permitidos.
 */
const VALID_PERFIS = [
  'admin',
  'suporte',
  'comercial',
  'vendedor',
  'rh',
  'emissor',
  'gestor',
  'funcionario',
  'representante',
] as const;

export function escapePerfilForSql(perfil: string): string {
  if (!VALID_PERFIS.includes(perfil as (typeof VALID_PERFIS)[number])) {
    throw new Error(`escapePerfilForSql: perfil inválido: ${perfil}`);
  }
  return perfil;
}

/**
 * Helper para SET LOCAL seguro — gera queries parametrizadas para contexto RLS.
 * Retorna array de queries prontas para execução sequencial.
 */
export function buildSetLocalQueries(context: {
  cpf: string;
  perfil: string;
  clinica_id?: number | null;
  entidade_id?: number | null;
  representante_id?: number | null;
  systemBypass?: boolean;
  allowReset?: boolean;
}): string[] {
  const queries: string[] = [];

  queries.push(
    `SET LOCAL app.current_user_cpf = '${escapeCpfForSql(context.cpf)}'`
  );
  queries.push(
    `SET LOCAL app.current_user_perfil = '${escapePerfilForSql(context.perfil)}'`
  );

  if (context.clinica_id != null) {
    queries.push(
      `SET LOCAL app.current_user_clinica_id = '${String(Math.abs(Math.floor(Number(context.clinica_id))))}'`
    );
  }

  if (context.entidade_id != null) {
    queries.push(
      `SET LOCAL app.current_user_entidade_id = '${String(Math.abs(Math.floor(Number(context.entidade_id))))}'`
    );
  }

  if (context.representante_id != null) {
    queries.push(
      `SET LOCAL app.current_representante_id = '${String(Math.abs(Math.floor(Number(context.representante_id))))}'`
    );
  }

  if (context.systemBypass) {
    queries.push(`SET LOCAL app.system_bypass = 'true'`);
  }

  if (context.allowReset) {
    queries.push(`SET LOCAL app.allow_reset = true`);
  }

  return queries;
}
