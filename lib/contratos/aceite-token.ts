/**
 * Token de verificação para aceite de contrato.
 *
 * Gera um HMAC-SHA256 determinístico a partir do ID do contrato + secret,
 * eliminando a possibilidade de aceite por brute-force de IDs sequenciais.
 *
 * Uso:
 *  - Ao criar contrato → gerar token e incluir na URL de aceite
 *  - Ao aceitar contrato → validar token antes de processar
 */

import { createHmac, timingSafeEqual } from 'crypto';

function getSecret(): string {
  const secret =
    process.env.CONTRATO_ACEITE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SESSION_SECRET;

  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error(
      '[SEGURANÇA] CONTRATO_ACEITE_SECRET não configurado em produção'
    );
  }

  return secret || 'dev-only-insecure-secret';
}

/**
 * Gera token de aceite para um contrato.
 * Retorna string hex de 32 caracteres.
 */
export function gerarTokenAceite(contratoId: number): string {
  return createHmac('sha256', getSecret())
    .update(`aceite:contrato:${contratoId}`)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Valida token de aceite usando comparação timing-safe.
 * Retorna true se token válido.
 */
export function validarTokenAceite(contratoId: number, token: string): boolean {
  const expected = gerarTokenAceite(contratoId);
  if (token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}
