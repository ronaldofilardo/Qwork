/**
 * Schemas de Validação Zod - Plano Personalizado
 * Valida DTOs de todas as rotas de contratação personalizada
 */

import { z } from 'zod';

/**
 * Schema: Criar Pré-Cadastro
 */
export const CriarPreCadastroSchema = z.object({
  tomador_id: z
    .number()
    .int()
    .positive({ message: 'ID do tomador deve ser um número positivo' }),
  numero_funcionarios_estimado: z
    .number()
    .int()
    .min(1, { message: 'Número de funcionários deve ser maior que zero' })
    .max(10000, {
      message: 'Número máximo de funcionários é 10.000 para plano único',
    }),
  justificativa_tomador: z
    .string()
    .min(20, {
      message: 'Justificativa deve ter pelo menos 20 caracteres',
    })
    .max(1000, { message: 'Justificativa deve ter no máximo 1000 caracteres' })
    .optional(),
});

export type CriarPreCadastroInput = z.infer<typeof CriarPreCadastroSchema>;

/**
 * Schema: Definir Valor (Admin)
 */
export const DefinirValorAdminSchema = z.object({
  contratacao_id: z
    .number()
    .int()
    .positive({ message: 'ID da contratação inválido' }),
  valor_por_funcionario: z
    .number()
    .positive({ message: 'Valor por funcionário deve ser maior que zero' })
    .min(10, { message: 'Valor mínimo por funcionário: R$ 10,00' })
    .max(500, { message: 'Valor máximo por funcionário: R$ 500,00' }),
  observacoes_admin: z
    .string()
    .min(10, { message: 'Observações devem ter pelo menos 10 caracteres' })
    .max(500, { message: 'Observações devem ter no máximo 500 caracteres' })
    .optional(),
});

export type DefinirValorAdminInput = z.infer<typeof DefinirValorAdminSchema>;

/**
 * Schema: Aceitar Contrato
 */
export const AceitarContratoSchema = z.object({
  contratacao_id: z
    .number()
    .int()
    .positive({ message: 'ID da contratação inválido' }),
  ip_origem: z.string().ip({ message: 'IP inválido' }).optional(),
  user_agent: z
    .string()
    .max(500, { message: 'User agent muito longo' })
    .optional(),
});

export type AceitarContratoInput = z.infer<typeof AceitarContratoSchema>;

/**
 * Schema: Rejeitar Contratação
 */
export const RejeitarContratacaoSchema = z.object({
  contratacao_id: z
    .number()
    .int()
    .positive({ message: 'ID da contratação inválido' }),
  motivo_rejeicao: z
    .string()
    .min(10, { message: 'Motivo deve ter pelo menos 10 caracteres' })
    .max(500, { message: 'Motivo deve ter no máximo 500 caracteres' }),
});

export type RejeitarContratacaoInput = z.infer<
  typeof RejeitarContratacaoSchema
>;

/**
 * Schema: Cancelar Contratação
 */
export const CancelarContratacaoSchema = z.object({
  contratacao_id: z
    .number()
    .int()
    .positive({ message: 'ID da contratação inválido' }),
  motivo: z
    .string()
    .min(10, { message: 'Motivo deve ter pelo menos 10 caracteres' })
    .max(500, { message: 'Motivo deve ter no máximo 500 caracteres' })
    .optional(),
});

export type CancelarContratacaoInput = z.infer<
  typeof CancelarContratacaoSchema
>;

/**
 * Schema: Query Parameters - Listar Contratações
 */
export const ListarContratacoesQuerySchema = z.object({
  status: z
    .enum([
      'pre_cadastro',
      'aguardando_valor_admin',
      'valor_definido',
      'aguardando_pagamento',
      'pagamento_confirmado',
      'ativo',
      'rejeitado',
      'cancelado',
    ])
    .optional(),
  tomador_id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),
  limite: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100).default(50))
    .optional(),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(0).default(0))
    .optional(),
});

export type ListarContratacoesQuery = z.infer<
  typeof ListarContratacoesQuerySchema
>;

/**
 * Schema: Criar Notificação
 */
export const CriarNotificacaoSchema = z.object({
  tipo: z.enum([
    'pre_cadastro_criado',
    'valor_definido',
    'pagamento_confirmado',
    'contratacao_ativa',
    'rejeicao_admin',
    'cancelamento_gestor',
    'sla_excedido',
    'alerta_geral',
  ]),
  prioridade: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  destinatario_id: z
    .number()
    .int()
    .positive({ message: 'ID do destinatário inválido' }),
  destinatario_tipo: z.enum(['admin', 'gestor', 'funcionario']),
  titulo: z
    .string()
    .min(3, { message: 'Título deve ter pelo menos 3 caracteres' })
    .max(100, { message: 'Título deve ter no máximo 100 caracteres' }),
  mensagem: z
    .string()
    .min(10, { message: 'Mensagem deve ter pelo menos 10 caracteres' })
    .max(500, { message: 'Mensagem deve ter no máximo 500 caracteres' }),
  dados_contexto: z.record(z.any()).optional(),
  link_acao: z.string().url({ message: 'Link inválido' }).optional(),
  botao_texto: z.string().max(30).optional(),
  contratacao_personalizada_id: z.number().int().positive().optional(),
});

export type CriarNotificacaoInput = z.infer<typeof CriarNotificacaoSchema>;

/**
 * Schema: Marcar Notificação(ões) como Lida(s)
 */
export const MarcarNotificacaoLidaSchema = z.object({
  notificacao_ids: z
    .array(z.number().int().positive())
    .min(1, { message: 'Deve fornecer pelo menos um ID' })
    .max(100, { message: 'Máximo de 100 IDs por requisição' }),
});

export type MarcarNotificacaoLidaInput = z.infer<
  typeof MarcarNotificacaoLidaSchema
>;
