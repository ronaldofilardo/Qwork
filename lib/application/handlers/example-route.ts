/**
 * EXEMPLO DE ROTA REFATORADA USANDO handleRequest
 *
 * Esta é uma rota-piloto demonstrando o padrão recomendado:
 * - Validação com Zod
 * - Autorização declarativa
 * - Lógica de negócio isolada
 * - Tratamento de erros centralizado
 */

import {
  handleRequest,
  requireSession,
  createApiError,
} from '@/lib/application/handlers/api-handler';
import { query } from '@/lib/infrastructure/database';
import { ROLES } from '@/lib/config/roles';
import { z } from 'zod';

// Schema de validação
const GetContratantesSchema = z.object({
  status: z
    .enum(['pendente', 'aprovado', 'rejeitado', 'ativo', 'inativo'])
    .optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

type GetContratantesInput = z.infer<typeof GetContratantesSchema>;

// Lógica de negócio isolada
async function getContratantesPendentes(input: GetContratantesInput) {
  const { status, limit, offset } = input;

  const sql = `
    SELECT 
      c.id,
      c.nome,
      c.cnpj,
      c.email,
      c.status_aprovacao,
      c.criado_em,
      p.nome as plano_nome
    FROM contratantes c
    LEFT JOIN planos p ON c.plano_id = p.id
    WHERE ($1::text IS NULL OR c.status_aprovacao = $1)
    ORDER BY c.criado_em DESC
    LIMIT $2 OFFSET $3
  `;

  const result = await query(sql, [status || null, limit, offset]);
  return {
    contratantes: result.rows,
    total: result.rowCount,
  };
}

// Handler da rota
export const GET = handleRequest<GetContratantesInput>({
  // Apenas admin pode acessar
  allowedRoles: [ROLES.ADMIN],

  // Validação do input (query params)
  validate: GetContratantesSchema,

  // Lógica de negócio
  execute: async (input, context) => {
    requireSession(context);
    return getContratantesPendentes(input);
  },
});

// Exemplo de POST com validação mais complexa
const AprovarContratanteSchema = z.object({
  contratante_id: z.number().positive(),
  observacoes: z.string().max(500).optional(),
});

export const POST = handleRequest({
  allowedRoles: [ROLES.ADMIN],
  validate: AprovarContratanteSchema,

  execute: async (input, context) => {
    requireSession(context);

    const { contratante_id, observacoes } = input;

    // Lógica de aprovação
    const sql = `
      UPDATE contratantes
      SET 
        status_aprovacao = 'aprovado',
        aprovado_por = $1,
        aprovado_em = CURRENT_TIMESTAMP,
        observacoes_aprovacao = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(sql, [
      context.session.cpf,
      observacoes || null,
      contratante_id,
    ]);

    if (result.rowCount === 0) {
      // Usar createApiError para garantir Error instance com código e status
      throw createApiError('Contratante não encontrado', 'NOT_FOUND', 404);
    }

    return {
      message: 'Contratante aprovado com sucesso',
      contratante: result.rows[0],
    };
  },
});
