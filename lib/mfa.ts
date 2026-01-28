import { query } from './db';
import crypto from 'crypto';

// Tipos
export interface MFACode {
  cpf: string;
  code: string;
  expires_at: Date;
  used: boolean;
}

// Gerar código MFA de 6 dígitos
export function generateMFACode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Criar código MFA para usuário
export async function createMFACode(cpf: string): Promise<string> {
  const code = generateMFACode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  // Invalidar códigos anteriores não utilizados
  await query(
    'UPDATE mfa_codes SET used = true WHERE cpf = $1 AND used = false',
    [cpf]
  );

  // Inserir novo código
  await query(
    'INSERT INTO mfa_codes (cpf, code, expires_at, used) VALUES ($1, $2, $3, $4)',
    [cpf, code, expiresAt, false]
  );

  return code;
}

// Validar código MFA
export async function validateMFACode(cpf: string, code: string): Promise<boolean> {
  const result = await query(
    'SELECT * FROM mfa_codes WHERE cpf = $1 AND code = $2 AND used = false AND expires_at > NOW()',
    [cpf, code]
  );

  if (result.rows.length === 0) {
    return false;
  }

  // Marcar código como usado
  await query(
    'UPDATE mfa_codes SET used = true WHERE cpf = $1 AND code = $2',
    [cpf, code]
  );

  return true;
}

// Verificar se usuário tem MFA pendente
export async function hasPendingMFA(cpf: string): Promise<boolean> {
  const result = await query(
    'SELECT * FROM mfa_codes WHERE cpf = $1 AND used = false AND expires_at > NOW()',
    [cpf]
  );

  return result.rows.length > 0;
}

// Limpar códigos expirados (job de limpeza)
export async function cleanupExpiredMFACodes(): Promise<number> {
  const result = await query(
    'DELETE FROM mfa_codes WHERE expires_at < NOW() - INTERVAL \'24 hours\'',
    []
  );

  return result.rowCount || 0;
}
