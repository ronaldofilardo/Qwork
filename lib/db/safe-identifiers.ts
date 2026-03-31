/**
 * Allowlist de identificadores SQL seguros.
 * Previne SQL injection via nomes de tabela/coluna dinâmicos.
 *
 * NUNCA interpolar nomes de tabela/coluna vindos de input do usuário
 * diretamente em queries SQL, mesmo com ternários.
 * Use sempre safeTable() / safeColumn() para validar contra a allowlist.
 */

const ALLOWED_TABLES = new Set([
  'entidades',
  'clinicas',
  'entidades_senhas',
  'clinicas_senhas',
  'representantes',
  'funcionarios',
  'contratos',
  'pagamentos',
  'lotes_avaliacao',
  'avaliacoes',
  'usuarios',
  'webhook_logs',
  'leads',
  'comissoes',
  'vendedores',
  'notificacoes',
  'notificacoes_admin',
  'empresas_clientes',
  'laudos',
  'recibos',
  'auditoria_logs',
  'rate_limit_entries',
] as const);

const ALLOWED_COLUMNS = new Set([
  'entidade_id',
  'clinica_id',
  'representante_id',
  'funcionario_id',
  'contrato_id',
  'pagamento_id',
  'lote_id',
  'vendedor_id',
  'emissor_cpf',
  'cpf',
  'id',
] as const);

/**
 * Valida e retorna um nome de tabela seguro.
 * Lança erro se o nome não estiver na allowlist.
 */
export function safeTable(name: string): string {
  if (!ALLOWED_TABLES.has(name as any)) {
    throw new Error(
      `[SQL_SAFETY] Nome de tabela não permitido: "${name}". Adicione à allowlist em lib/db/safe-identifiers.ts se for legítimo.`
    );
  }
  return name;
}

/**
 * Valida e retorna um nome de coluna seguro.
 * Lança erro se o nome não estiver na allowlist.
 */
export function safeColumn(name: string): string {
  if (!ALLOWED_COLUMNS.has(name as any)) {
    throw new Error(
      `[SQL_SAFETY] Nome de coluna não permitido: "${name}". Adicione à allowlist em lib/db/safe-identifiers.ts se for legítimo.`
    );
  }
  return name;
}
