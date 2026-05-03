/**
 * app/api/admin/novos-cadastros/handlers.ts
 * Handlers de negócio para gerenciamento de novos cadastros
 */

import { query } from '@/lib/db';
import {
  aprovarEntidade,
  rejeitarEntidade,
  solicitarReanalise,
} from '@/lib/db/entidade-status';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import type { RequestContext } from '@/lib/application/handlers/api-handler';
import { requireRole } from '@/lib/application/handlers/api-handler';
import type {
  GetNovosCadastrosInput,
  AprovarEntidadeInput,
  RejeitarEntidadeInput,
  SolicitarReanaliseInput,
  DeletarEntidadeInput,
} from './schemas';

export async function handleGetNovosCadastros(
  input: GetNovosCadastrosInput,
  context: RequestContext
) {
  // Exige sessão com role de admin
  requireRole(context, 'admin');
  // Se filtro de status específico, usar query customizada
  if (input.status && input.status !== 'todos') {
    let queryText = `
      SELECT 
        c.*, 
        NULL::INTEGER as numero_funcionarios_estimado,
        NULL::DECIMAL as valor_por_funcionario,
        NULL::DECIMAL as valor_total_estimado,
        NULL::VARCHAR as contratacao_status,
        true AS requer_aprovacao_manual
      FROM entidades c
      WHERE c.status = $1
    `;
    const params: string[] = [input.status];

    // Nota: tipo não existe em entidades - é determinado pela presença em tabelas clinicas
    // A arquitetura segregada usa tabelas separadas para clínicas e entidades

    queryText += ' ORDER BY c.criado_em DESC';

    const result = await query(queryText, params);
    return {
      success: true,
      total: result.rowCount || result.rows.length,
      tomadores: result.rows,
    };
  }

  // Sem filtro de status, usar função específica mas com JOIN
  const queryText = `
    SELECT 
      c.*, 
      NULL::INTEGER as numero_funcionarios_estimado,
      NULL::DECIMAL as valor_por_funcionario,
      NULL::DECIMAL as valor_total_estimado,
      NULL::VARCHAR as contratacao_status,
      true AS requer_aprovacao_manual
    FROM entidades c
    WHERE c.status IN ('pendente', 'aguardando_pagamento', 'em_reanalise')
  `;

  // Nota: tipo não existe em entidades - a arquitetura segregada usa tabelas separadas

  const result = await query(queryText);
  return {
    success: true,
    total: result.rowCount || result.rows.length,
    tomadores: result.rows,
  };
}

export async function handleAprovarEntidade(
  input: AprovarEntidadeInput,
  context: RequestContext
) {
  // Exige sessão com role de admin
  requireRole(context, 'admin');
  const { session, request } = context;

  const entidade = await aprovarEntidade(
    input.entidade_id,
    session.cpf,
    session
  );

  // Auditoria CRÍTICA
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'entidades',
      action: 'UPDATE',
      resourceId: input.entidade_id,
      oldData: { status: 'pendente' },
      newData: { status: 'ativo', aprovado_por: session.cpf },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Entidade APROVADA - ID: ${String(input.entidade_id)}, Aprovador: ${String(session.nome)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Entidade aprovada com sucesso',
    entidade,
  };
}

export async function handleRejeitarEntidade(
  input: RejeitarEntidadeInput,
  context: RequestContext
) {
  // Exige sessão com role de admin
  requireRole(context, 'admin');
  const { session, request } = context;

  const entidade = await rejeitarEntidade(
    input.entidade_id,
    input.motivo,
    session
  );

  // Auditoria CRÍTICA
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'entidades',
      action: 'UPDATE',
      resourceId: input.entidade_id,
      oldData: { status: 'pendente' },
      newData: { status: 'rejeitado', motivo: input.motivo },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Entidade REJEITADA - ID: ${String(input.entidade_id)}, Motivo: ${String(input.motivo)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Entidade rejeitada',
    entidade,
  };
}

export async function handleSolicitarReanalise(
  input: SolicitarReanaliseInput,
  context: RequestContext
) {
  const { session, request } = context;

  if (!session || session.perfil !== 'admin') {
    throw new Error('Acesso negado. Apenas administradores.');
  }

  const entidade = await solicitarReanalise(
    input.entidade_id,
    input.mensagem,
    session
  );

  // Auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'entidades',
      action: 'UPDATE',
      resourceId: input.entidade_id,
      newData: { status: 'reanalise_solicitada', mensagem: input.mensagem },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Reanalise solicitada - ID: ${String(input.entidade_id)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Solicitação de reanálise enviada',
    entidade,
  };
}

export async function handleDeletarEntidade(
  input: DeletarEntidadeInput,
  context: RequestContext
) {
  requireRole(context, 'admin');

  const { session } = context;
  const requestInfo = extractRequestInfo(context.request);

  // Verificar se a entidade existe e está em status que permite deleção
  const entidade = await query(
    'SELECT id, nome, status FROM entidades WHERE id = $1',
    [input.entidade_id]
  );

  if (entidade.rows.length === 0) {
    throw new Error('Entidade não encontrada');
  }

  const status = (entidade.rows[0] as any).status;

  // Só permitir deletar se estiver em status pendente ou rejeitado
  if (!['pendente', 'rejeitado'].includes(status)) {
    throw new Error('Não é possível deletar entidade com status atual');
  }

  // Deletar a entidade (cascade deve cuidar das dependências)
  await query('DELETE FROM entidades WHERE id = $1', [input.entidade_id]);

  // Log de auditoria
  await logAudit(
    {
      resource: 'entidade',
      action: 'DELETE',
      resourceId: input.entidade_id,
      oldData: entidade.rows[0] as any,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Entidade deletada: ${(entidade.rows[0] as any).nome}`,
    },
    session
  );

  return {
    success: true,
    message: 'Entidade deletada com sucesso',
  };
}
