/**
 * Helper para scripts administrativos que precisam atualizar dados sem sessão ativa
 * Mantém contexto de auditoria mesmo sem usuário logado
 *
 * APENAS para scripts internos - nunca use em endpoints da API
 *
 * NOTA: Este arquivo está deprecado. Use a função query() de lib/db.ts com contexto de sessão apropriado
 */

export interface AdminScriptContext {
  cpf?: string; // CPF de quem executa (default: '00000000000' para admin anônimo)
  perfil?: string; // Perfil (default: 'admin')
  operation?: string; // Descrição da operação para auditoria
}

/**
 * DEPRECATED: Executa operações administrativas com contexto de auditoria correto
 * Use a função query() de lib/db.ts com contexto de sessão apropriado
 */
export function withAdminContext<T>(
  _callback: (client: any) => Promise<T>,
  _context?: AdminScriptContext
): Promise<T> {
  throw new Error(
    'withAdminContext is deprecated. Use query() from lib/db.ts with proper session context instead.'
  );
}

/**
 * DEPRECATED: Atualizar senha de um usuário com auditoria completa
 * Use a rota /api/admin/reset-senha em vez disso
 */
export function atualizarSenhaAdmin(
  _cpf: string,
  _novoHashBcrypt: string,
  _motivo: string
): Promise<{ nome: string; email: string; perfil: string }> {
  throw new Error(
    'atualizarSenhaAdmin is deprecated. Use /api/admin/reset-senha endpoint instead.'
  );
}
