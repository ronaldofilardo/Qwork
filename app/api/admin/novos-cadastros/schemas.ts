/**
 * app/api/admin/novos-cadastros/schemas.ts
 * Schemas Zod para validação de novos cadastros
 */

import { z } from 'zod';

export const GetNovosCadastrosSchema = z.object({
  tipo: z.enum(['clinica', 'entidade']).optional(),
  status: z.string().optional(),
});

export const AprovarEntidadeSchema = z.object({
  acao: z.literal('aprovar'),
  entidade_id: z.number().int().positive(),
  observacoes: z.string().optional(),
});

export const RejeitarEntidadeSchema = z.object({
  acao: z.literal('rejeitar'),
  entidade_id: z.number().int().positive(),
  motivo: z.string().min(10, 'Motivo deve ter pelo menos 10 caracteres'),
});

export const SolicitarReanaliseSchema = z.object({
  acao: z.literal('solicitar_reanalise'),
  entidade_id: z.number().int().positive(),
  mensagem: z.string().min(10, 'Mensagem deve ter pelo menos 10 caracteres'),
});

export const DeletarEntidadeSchema = z.object({
  acao: z.literal('deletar'),
  entidade_id: z.number().int().positive(),
});

export const NovosCadastrosActionSchema = z.preprocess(
  (obj) => {
    // Normalize incoming payloads: accept both 'tomador_id' (frontend) and 'entidade_id' (server)
    if (obj && typeof obj === 'object') {
      const o = obj as any;
      if (!('entidade_id' in o) && 'tomador_id' in o) {
        return { ...o, entidade_id: o.tomador_id };
      }
    }
    return obj;
  },
  z.discriminatedUnion('acao', [
    AprovarEntidadeSchema,
    RejeitarEntidadeSchema,
    SolicitarReanaliseSchema,
    DeletarEntidadeSchema,
  ])
);

export type GetNovosCadastrosInput = z.infer<typeof GetNovosCadastrosSchema>;
export type AprovarEntidadeInput = z.infer<typeof AprovarEntidadeSchema>;
export type RejeitarEntidadeInput = z.infer<typeof RejeitarEntidadeSchema>;
export type SolicitarReanaliseInput = z.infer<typeof SolicitarReanaliseSchema>;
export type DeletarEntidadeInput = z.infer<typeof DeletarEntidadeSchema>;
export type NovosCadastrosAction = z.infer<typeof NovosCadastrosActionSchema>;
