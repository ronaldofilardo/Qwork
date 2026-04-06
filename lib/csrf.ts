/**
 * lib/csrf.ts
 *
 * CSRF Token generation e validation para formulários e API requests.
 * Usa crypto.randomBytes + armazenamento em sessão.
 */

import crypto from 'crypto';

const TOKEN_LENGTH = 32; // 256 bits

/**
 * Gera um novo token CSRF.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Valida um token CSRF contra um token armazenado.
 * Usa constant-time comparison para evitar timing attacks.
 */
export function validateCsrfToken(token: string, storedToken: string): boolean {
  if (typeof token !== 'string' || typeof storedToken !== 'string') {
    return false;
  }

  // Constant-time comparison (protege contra timing attacks)
  const tokenBuffer = Buffer.from(token, 'utf-8');
  const storedBuffer = Buffer.from(storedToken, 'utf-8');

  if (tokenBuffer.length !== storedBuffer.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < tokenBuffer.length; i++) {
    result |= tokenBuffer[i] ^ storedBuffer[i];
  }

  return result === 0;
}

/**
 * Tipos para uso em Server Components/Actions
 */
export interface CsrfTokenPayload {
  token: string;
  timestamp: number;
}
