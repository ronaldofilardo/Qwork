/**
 * app/api/pagamento/schemas.ts
 *
 * Schemas de validação Zod para rotas de pagamento
 */

import { z } from 'zod';

// ============================================================================
// SCHEMAS DE INPUT
// ============================================================================

export const IniciarPagamentoSchema = z.object({
  acao: z.literal('iniciar'),
  entidade_id: z.number().int().positive(),
  contrato_id: z.number().int().positive(),
  valor: z.number().positive(),
  metodo: z.enum(['PIX', 'Cartao', 'Boleto', 'Transferencia']),
  plataforma_nome: z.string().optional().default('Simulado'),
  plano_tipo: z.string().optional(), // Tipo do plano para descrição Asaas
});

export const ConfirmarPagamentoSchema = z.object({
  acao: z.literal('confirmar'),
  pagamento_id: z.number().int().positive(),
  plataforma_id: z.string().optional(),
  dados_adicionais: z.record(z.any()).optional(),
  comprovante_path: z.string().optional(),
});

export const AtualizarStatusPagamentoSchema = z.object({
  acao: z.literal('atualizar_status'),
  pagamento_id: z.number().int().positive(),
  novo_status: z.enum(['pendente', 'processando', 'pago', 'cancelado', 'erro']),
  observacoes: z.string().optional(),
});

export const GetPagamentoSchema = z
  .object({
    id: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : undefined)),
    entidade_id: z
      .string()
      .optional()
      .transform((v) => (v ? parseInt(v) : undefined)),
  })
  .transform((data) => ({
    id: data.id as number | undefined,
    entidade_id: data.entidade_id as number | undefined,
  }))
  .refine((data) => data.id !== undefined || data.entidade_id !== undefined, {
    message: 'Forneça id ou entidade_id',
  });

// Union de todos os schemas POST
export const PagamentoActionSchema = z.discriminatedUnion('acao', [
  IniciarPagamentoSchema,
  ConfirmarPagamentoSchema,
  AtualizarStatusPagamentoSchema,
]);

// ============================================================================
// TYPES EXPORTADOS
// ============================================================================

export type IniciarPagamentoInput = z.infer<typeof IniciarPagamentoSchema>;
export type ConfirmarPagamentoInput = z.infer<typeof ConfirmarPagamentoSchema>;
export type AtualizarStatusPagamentoInput = z.infer<
  typeof AtualizarStatusPagamentoSchema
>;
export type GetPagamentoInput = z.infer<typeof GetPagamentoSchema>;
export type PagamentoAction = z.infer<typeof PagamentoActionSchema>;
