// Validação e Sanitização de Inputs
// Fase 4: Validação robusta de entradas de API

import { z } from 'zod';

/**
 * Schemas de validação para planos e contratos
 */

export const PlanoSchema = z.object({
  tipo: z.enum(['personalizado', 'basico', 'premium']),
  nome: z.string().min(3).max(100),
  descricao: z.string().optional(),
  valor_por_funcionario: z.number().positive().optional(),
  valor_fixo_anual: z.number().positive().optional(),
  limite_funcionarios: z.number().int().positive().optional(),
  ativo: z.boolean().default(true),
});

export const ContratoPlanoSchema = z.object({
  plano_id: z.number().int().positive(),
  clinica_id: z.number().int().positive().optional(),
  contratante_id: z.number().int().positive().optional(),
  tipo_contratante: z.enum(['clinica', 'entidade']),
  valor_personalizado_por_funcionario: z.number().positive().optional(),
  numero_funcionarios_estimado: z.number().int().positive(),
  forma_pagamento: z.enum(['anual', 'mensal']).default('anual'),
  numero_parcelas: z.number().int().min(1).max(12).default(1),
});

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
