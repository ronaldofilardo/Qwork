import { z } from 'zod';
import {
  normalizeCNPJ,
  validarCNPJ,
  validarEmail,
  validarTelefone,
} from '@/lib/validators';

export const CriarLeadSchema = z.object({
  cnpj: z
    .string()
    .min(1, 'CNPJ é obrigatório')
    .transform((v) => normalizeCNPJ(v))
    .refine((v) => v.length === 14, 'CNPJ deve ter 14 dígitos')
    .refine(
      (v) => validarCNPJ(v),
      'CNPJ inválido (dígitos verificadores incorretos)'
    ),

  razao_social: z
    .string()
    .max(256, 'Máximo 256 caracteres')
    .optional()
    .nullable(),

  contato_nome: z
    .string()
    .max(128, 'Máximo 128 caracteres')
    .optional()
    .nullable(),

  contato_email: z
    .string()
    .optional()
    .nullable()
    .refine((v) => !v || validarEmail(v), 'E-mail inválido'),

  contato_telefone: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) => !v || validarTelefone(v),
      'Telefone inválido (ex: (11) 91234-5678)'
    ),
});

export type CriarLeadInput = z.input<typeof CriarLeadSchema>;
export type CriarLeadOutput = z.output<typeof CriarLeadSchema>;
