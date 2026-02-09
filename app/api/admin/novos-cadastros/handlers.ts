/**
 * app/api/admin/novos-cadastros/handlers.ts
 * Handlers de negócio para gerenciamento de novos cadastros
 */

import { query } from '@/lib/infrastructure/database';
import {
  aprovarEntidade,
  rejeitarEntidade,
  solicitarReanalise,
} from '@/lib/db';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import type { RequestContext } from '@/lib/application/handlers/api-handler';
import { requireRole } from '@/lib/application/handlers/api-handler';
import { createPaymentLink } from '@/lib/utils/get-base-url';
import type {
  GetNovosCadastrosInput,
  AprovarEntidadeInput,
  RejeitarEntidadeInput,
  SolicitarReanaliseInput,
  AprovarPersonalizadoInput,
  RegenerarLinkPersonalizadoInput,
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
        p.tipo as plano_tipo, 
        p.nome as plano_nome,
        NULL::INTEGER as contratacao_personalizada_id,
        NULL::INTEGER as numero_funcionarios_estimado,
        NULL::DECIMAL as valor_por_funcionario,
        NULL::DECIMAL as valor_total_estimado,
        NULL::VARCHAR as contratacao_status,
        CASE WHEN c.pagamento_confirmado = true THEN false ELSE true END AS requer_aprovacao_manual
      FROM entidades c
      LEFT JOIN planos p ON c.plano_id = p.id
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
      p.tipo as plano_tipo, 
      p.nome as plano_nome,
      NULL::INTEGER as contratacao_personalizada_id,
      NULL::INTEGER as numero_funcionarios_estimado,
      NULL::DECIMAL as valor_por_funcionario,
      NULL::DECIMAL as valor_total_estimado,
      NULL::VARCHAR as contratacao_status,
      -- Indica se requer aprovação manual: quando já existe pagamento confirmado e contrato aceito, não requer aprovação manual
      CASE WHEN c.pagamento_confirmado = true THEN false ELSE true END AS requer_aprovacao_manual
    FROM entidades c
    LEFT JOIN planos p ON c.plano_id = p.id
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

export async function handleAprovarPersonalizado(
  input: AprovarPersonalizadoInput,
  context: RequestContext
) {
  requireRole(context, 'admin');
  const { session, request } = context;

  // Verificar se a tabela contratacao_personalizada ainda existe
  const tableExists = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contratacao_personalizada'
    )`,
    []
  );

  if (!tableExists.rows[0].exists) {
    throw new Error(
      'Funcionalidade de contratação personalizada não está mais disponível'
    );
  }

  // Buscar entidade e verificar se é personalizado
  const entidadeRes = await query(
    `SELECT c.*, p.tipo as plano_tipo, p.nome as plano_nome 
     FROM entidades c 
     JOIN planos p ON c.plano_id = p.id 
     WHERE c.id = $1`,
    [input.entidade_id]
  );

  if (entidadeRes.rows.length === 0) {
    throw new Error('Entidade não encontrada');
  }

  const entidade = entidadeRes.rows[0] as {
    id: number;
    nome: string;
    plano_id: number;
    plano_tipo: string;
    plano_nome: string;
  };

  if (entidade.plano_tipo !== 'personalizado') {
    throw new Error('Operação válida apenas para planos personalizados');
  }

  // Calcular valor total
  const valorTotal = input.valor_por_funcionario * input.numero_funcionarios;

  // Atualizar contratacao_personalizada
  await query(
    `UPDATE contratacao_personalizada 
     SET valor_por_funcionario = $1, 
         numero_funcionarios_estimado = $2, 
         valor_total_estimado = $3, 
         status = 'valor_definido', 
         atualizado_em = CURRENT_TIMESTAMP 
     WHERE tomador_id = $4`,
    [
      input.valor_por_funcionario,
      input.numero_funcionarios,
      valorTotal,
      input.entidade_id,
    ]
  );

  // Gerar link de pagamento (token único)
  const { randomBytes } = await import('crypto');
  const token = randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  await query(
    `UPDATE contratacao_personalizada 
     SET payment_link_token = $1, 
         payment_link_expiracao = $2, 
         link_enviado_em = CURRENT_TIMESTAMP 
     WHERE tomador_id = $3`,
    [token, expiracao, input.entidade_id]
  );

  // Criar contrato em contratos
  const contratoRes = await query<{ id: number }>(
    `INSERT INTO contratos (
      tomador_id, plano_id, numero_funcionarios, valor_total, status, criado_em
    ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', CURRENT_TIMESTAMP) RETURNING id`,
    [
      input.entidade_id,
      entidade.plano_id,
      input.numero_funcionarios,
      valorTotal,
    ]
  );

  const contratoId = contratoRes.rows[0]?.id;

  // Log de auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratacao_personalizada',
      action: 'UPDATE',
      resourceId: input.entidade_id,
      oldData: { status: 'aguardando_valor_admin' },
      newData: {
        status: 'valor_definido',
        valor_por_funcionario: input.valor_por_funcionario,
        numero_funcionarios: input.numero_funcionarios,
        valor_total: valorTotal,
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Valores definidos para personalizado: R$ ${input.valor_por_funcionario}/func, Total: R$ ${valorTotal}`,
    },
    session
  );

  const linkPagamento = createPaymentLink(token);

  const tomadorResp = {
    id: entidade.id,
    nome: entidade.nome,
    valor_por_funcionario: input.valor_por_funcionario,
    numero_funcionarios: input.numero_funcionarios,
    valor_total: valorTotal,
    link_pagamento: linkPagamento,
    link_expiracao: expiracao.toISOString(),
    contrato_id: contratoId,
    contratacao_id: contratoId,
  };

  return {
    success: true,
    message: 'Valores definidos e link gerado com sucesso',
    entidade: tomadorResp,
    tomador: tomadorResp,
  };
}

export async function handleRegenerarLink(
  input: RegenerarLinkPersonalizadoInput,
  context: RequestContext
) {
  requireRole(context, 'admin');
  const { session, request } = context;

  // Verificar se a tabela contratacao_personalizada ainda existe
  const tableExists = await query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'contratacao_personalizada'
    )`,
    []
  );

  if (!tableExists.rows[0].exists) {
    throw new Error(
      'Funcionalidade de contratação personalizada não está mais disponível'
    );
  }

  // Buscar contratacao_personalizada existente
  const contratacaoRes = await query(
    `SELECT cp.*, c.nome, c.id as entidade_id
     FROM contratacao_personalizada cp
     JOIN entidades c ON cp.entidade_id = c.id
     WHERE cp.entidade_id = $1
       AND cp.status = 'valor_definido'`,
    [input.entidade_id]
  );

  if (contratacaoRes.rows.length === 0) {
    throw new Error(
      'Contratação personalizada não encontrada ou não está com status valor_definido'
    );
  }

  const contratacao = contratacaoRes.rows[0] as {
    entidade_id: number;
    nome: string;
    payment_link_token?: string;
    payment_link_expiracao?: Date;
  };

  // Gerar novo token e nova expiração
  const { randomBytes } = await import('crypto');
  const token = randomBytes(32).toString('hex');
  const expiracao = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h

  // Atualizar link
  await query(
    `UPDATE contratacao_personalizada 
     SET payment_link_token = $1, 
         payment_link_expiracao = $2, 
         link_enviado_em = CURRENT_TIMESTAMP 
     WHERE tomador_id = $3`,
    [token, expiracao, input.entidade_id]
  );

  // Log de auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratacao_personalizada',
      action: 'UPDATE',
      resourceId: input.entidade_id,
      newData: {
        payment_link_token: token,
        link_expiracao: expiracao,
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Link de pagamento regenerado para entidade ${input.entidade_id}`,
    },
    session
  );

  const linkPagamento = createPaymentLink(token);

  const tomadorResp = {
    id: contratacao.entidade_id,
    nome: contratacao.nome,
    link_pagamento: linkPagamento,
    link_expiracao: expiracao.toISOString(),
  };

  return {
    success: true,
    message: 'Link regenerado com sucesso',
    entidade: tomadorResp,
    tomador: tomadorResp,
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
