/**
 * lib/utils/get-base-url.ts
 * Utilitário para obter a URL base da aplicação de forma consistente
 */

/**
 * Retorna a URL base da aplicação com base no ambiente
 *
 * Prioridades:
 * 1. NEXT_PUBLIC_BASE_URL (configurada manualmente)
 * 2. VERCEL_URL (variável automática do Vercel)
 * 3. http://localhost:3000 (fallback para desenvolvimento)
 *
 * @returns URL base sem trailing slash
 */
export function getBaseUrl(): string {
  // 1. Prioridade: NEXT_PUBLIC_BASE_URL configurada manualmente
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '');
  }

  // 2. Em produção no Vercel, usar VERCEL_URL automática
  if (process.env.VERCEL_URL) {
    // VERCEL_URL não inclui o protocolo, adicionar https://
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback para desenvolvimento local
  return 'http://localhost:3000';
}

/**
 * Cria um link de pagamento personalizado
 * @param token - Token de pagamento gerado
 * @returns URL completa para o link de pagamento
 */
export function createPaymentLink(token: string): string {
  return `${getBaseUrl()}/pagamento/personalizado/${token}`;
}

/**
 * Cria um link de proposta
 * @param token - Token da proposta
 * @returns URL completa para o link da proposta
 */
export function createProposalLink(token: string): string {
  return `${getBaseUrl()}/proposta/${token}`;
}
