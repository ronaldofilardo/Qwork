/**
 * app/api/admin/novos-cadastros/schemas.ts
 * Schemas Zod para validação de novos cadastros
 */

import { z } from 'zod';

export const GetNovosCadastrosSchema = z.object({
  tipo: z.enum(['clinica', 'entidade']).optional(),
  status: z.string().optional(),
});

export const AprovarContratanteSchema = z.object({
  acao: z.literal('aprovar'),
  contratante_id: z.number().int().positive(),
  observacoes: z.string().optional(),
});

export const RejeitarContratanteSchema = z.object({
  acao: z.literal('rejeitar'),
  contratante_id: z.number().int().positive(),
  motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
});

export const SolicitarReanaliseSchema = z.object({
  acao: z.literal('solicitar_reanalise'),
  contratante_id: z.number().int().positive(),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

export const AprovarPersonalizadoSchema = z.object({
  acao: z.literal('aprovar_personalizado'),
  contratante_id: z.number().int().positive(),
  valor_por_funcionario: z
    .number()
    .positive({ message: 'Valor por funcionário deve ser positivo' }),
  numero_funcionarios: z
    .number()
    .int()
    .positive({ message: 'Número de funcionários deve ser positivo' }),
});

export const RegenerarLinkPersonalizadoSchema = z.object({
  acao: z.literal('regenerar_link'),
  contratante_id: z.number().int().positive(),
});

export const DeletarContratanteSchema = z.object({
  acao: z.literal('deletar'),
  contratante_id: z.number().int().positive(),
});

export const NovosCadastrosActionSchema = z.discriminatedUnion('acao', [
  AprovarContratanteSchema,
  RejeitarContratanteSchema,
  SolicitarReanaliseSchema,
  AprovarPersonalizadoSchema,
  RegenerarLinkPersonalizadoSchema,
  DeletarContratanteSchema,
]);

export type GetNovosCadastrosInput = z.infer<typeof GetNovosCadastrosSchema>;
export type AprovarContratanteInput = z.infer<typeof AprovarContratanteSchema>;
export type RejeitarContratanteInput = z.infer<
  typeof RejeitarContratanteSchema
>;
export type SolicitarReanaliseInput = z.infer<typeof SolicitarReanaliseSchema>;
export type AprovarPersonalizadoInput = z.infer<
  typeof AprovarPersonalizadoSchema
>;
export type RegenerarLinkPersonalizadoInput = z.infer<
  typeof RegenerarLinkPersonalizadoSchema
>;
export type DeletarContratanteInput = z.infer<typeof DeletarContratanteSchema>;
export type NovosCadastrosAction = z.infer<typeof NovosCadastrosActionSchema>;
