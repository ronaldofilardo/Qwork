// Validação e Sanitização de Inputs
// Fase 4: Validação robusta de entradas de API

import { z } from 'zod';

export const MFACodeSchema = z.object({
  cpf: z.string().length(11).regex(/^\d+$/),
  code: z.string().length(6).regex(/^\d+$/),
});

export const NotificacaoSchema = z.object({
  tipo: z.enum([
    'limite_excedido',
    'renovacao_proxima',
    'pagamento_vencido',
    'alerta_geral',
  ]),
  titulo: z.string().min(1).max(200),
  mensagem: z.string().min(1),
  prioridade: z.enum(['baixa', 'normal', 'alta', 'critica']).default('normal'),
});

/**
 * Validar input com schema Zod
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: z.ZodError } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, errors: result.error };
}

/**
 * Sanitizar string para prevenir SQL injection
 * Nota: Usar prepared statements é preferível, mas esta é uma camada adicional
 */
export function sanitizeString(input: string): string {
  return input.replace(/'/g, "''").replace(/;/g, '').replace(/--/g, '').trim();
}

/**
 * Validar CPF
 */
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');

  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação de dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned[10])) return false;

  return true;
}

/**
 * Validar valores monetários
 */
export function validateMonetaryValue(value: number): boolean {
  return (
    value >= 0 && Number.isFinite(value) && Number(value.toFixed(2)) === value
  );
}

/**
 * Validar data de vigência (deve ser futura)
 */
export function validateVigenciaDate(date: Date): boolean {
  return date > new Date();
}
