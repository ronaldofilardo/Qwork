/**
 * app/api/admin/novos-cadastros/handlers.ts
 * Handlers de negócio para gerenciamento de novos cadastros
 */

import { query } from '@/lib/infrastructure/database';
import {
  aprovarContratante,
  rejeitarContratante,
  solicitarReanalise,
} from '@/lib/db';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import type { RequestContext } from '@/lib/application/handlers/api-handler';
import { requireRole } from '@/lib/application/handlers/api-handler';
import { createPaymentLink } from '@/lib/utils/get-base-url';
import type {
  GetNovosCadastrosInput,
  AprovarContratanteInput,
  RejeitarContratanteInput,
  SolicitarReanaliseInput,
  AprovarPersonalizadoInput,
  RegenerarLinkPersonalizadoInput,
  DeletarContratanteInput,
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
        cp.id as contratacao_personalizada_id,
        cp.numero_funcionarios_estimado,
        cp.valor_por_funcionario,
        cp.valor_total_estimado,
        cp.status as contratacao_status,
      -- Indica se requer aprovação manual: quando já existe pagamento confirmado e contrato aceito, não requer aprovação manual
      CASE WHEN c.pagamento_confirmado = true AND EXISTS (SELECT 1 FROM contratos ct WHERE ct.contratante_id = c.id AND ct.aceito = true) THEN false ELSE true END AS requer_aprovacao_manual
      FROM contratantes c
      LEFT JOIN planos p ON c.plano_id = p.id
      LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
      WHERE c.status = $1
    `;
    const params: string[] = [input.status];

    if (input.tipo) {
      queryText += ' AND c.tipo = $2';
      params.push(input.tipo as string);
    }

    queryText += ' ORDER BY c.criado_em DESC';

    const result = await query(queryText, params);
    return {
      success: true,
      total: result.rowCount || result.rows.length,
      contratantes: result.rows,
    };
  }

  // Sem filtro de status, usar função específica mas com JOIN
  let queryText = `
    SELECT 
      c.*, 
      p.tipo as plano_tipo, 
      p.nome as plano_nome,
      cp.id as contratacao_personalizada_id,
      cp.numero_funcionarios_estimado,
      cp.valor_por_funcionario,
      cp.valor_total_estimado,
      cp.status as contratacao_status,
      -- Indica se requer aprovação manual: quando já existe pagamento confirmado e contrato aceito, não requer aprovação manual
      CASE WHEN c.pagamento_confirmado = true AND EXISTS (SELECT 1 FROM contratos ct WHERE ct.contratante_id = c.id AND ct.aceito = true) THEN false ELSE true END AS requer_aprovacao_manual
    FROM contratantes c
    LEFT JOIN planos p ON c.plano_id = p.id
    LEFT JOIN contratacao_personalizada cp ON c.id = cp.contratante_id
    WHERE c.status IN ('pendente', 'aguardando_pagamento', 'em_reanalise')
  `;

  if (input.tipo) {
    queryText += ' AND c.tipo = $1';
    const result = await query(queryText, [input.tipo]);
    return {
      success: true,
      total: result.rowCount || result.rows.length,
      contratantes: result.rows,
    };
  }

  const result = await query(queryText);
  return {
    success: true,
    total: result.rowCount || result.rows.length,
    contratantes: result.rows,
  };
}

export async function handleAprovarContratante(
  input: AprovarContratanteInput,
  context: RequestContext
) {
  // Exige sessão com role de admin
  requireRole(context, 'admin');
  const { session, request } = context;

  const contratante = await aprovarContratante(
    input.contratante_id,
    session.cpf,
    session
  );

  // Auditoria CRÍTICA
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratantes',
      action: 'UPDATE',
      resourceId: input.contratante_id,
      oldData: { status: 'pendente' },
      newData: { status: 'ativo', aprovado_por: session.cpf },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Contratante APROVADO - ID: ${String(input.contratante_id)}, Aprovador: ${String(session.nome)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Contratante aprovado com sucesso',
    contratante,
  };
}

export async function handleRejeitarContratante(
  input: RejeitarContratanteInput,
  context: RequestContext
) {
  // Exige sessão com role de admin
  requireRole(context, 'admin');
  const { session, request } = context;

  const contratante = await rejeitarContratante(
    input.contratante_id,
    input.motivo,
    session
  );

  // Auditoria CRÍTICA
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratantes',
      action: 'UPDATE',
      resourceId: input.contratante_id,
      oldData: { status: 'pendente' },
      newData: { status: 'rejeitado', motivo: input.motivo },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Contratante REJEITADO - ID: ${String(input.contratante_id)}, Motivo: ${String(input.motivo)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Contratante rejeitado',
    contratante,
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

  const contratante = await solicitarReanalise(
    input.contratante_id,
    input.mensagem,
    session
  );

  // Auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratantes',
      action: 'UPDATE',
      resourceId: input.contratante_id,
      newData: { status: 'reanalise_solicitada', mensagem: input.mensagem },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Reanalise solicitada - ID: ${String(input.contratante_id)}`,
    },
    session
  );

  return {
    success: true,
    message: 'Solicitação de reanálise enviada',
    contratante,
  };
}

export async function handleAprovarPersonalizado(
  input: AprovarPersonalizadoInput,
  context: RequestContext
) {
  requireRole(context, 'admin');
  const { session, request } = context;

  // Buscar contratante e verificar se é personalizado
  const contratanteRes = await query(
    `SELECT c.*, p.tipo as plano_tipo, p.nome as plano_nome 
     FROM contratantes c 
     JOIN planos p ON c.plano_id = p.id 
     WHERE c.id = $1`,
    [input.contratante_id]
  );

  if (contratanteRes.rows.length === 0) {
    throw new Error('Contratante não encontrado');
  }

  const contratante = contratanteRes.rows[0] as {
    id: number;
    nome: string;
    plano_id: number;
    plano_tipo: string;
    plano_nome: string;
  };

  if (contratante.plano_tipo !== 'personalizado') {
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
     WHERE contratante_id = $4`,
    [
      input.valor_por_funcionario,
      input.numero_funcionarios,
      valorTotal,
      input.contratante_id,
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
     WHERE contratante_id = $3`,
    [token, expiracao, input.contratante_id]
  );

  // Criar contrato em contratos
  await query(
    `INSERT INTO contratos (
      contratante_id, plano_id, numero_funcionarios, valor_total, status, criado_em
    ) VALUES ($1, $2, $3, $4, 'aguardando_pagamento', CURRENT_TIMESTAMP)`,
    [
      input.contratante_id,
      contratante.plano_id,
      input.numero_funcionarios,
      valorTotal,
    ]
  );

  // Log de auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratacao_personalizada',
      action: 'UPDATE',
      resourceId: input.contratante_id,
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

  return {
    success: true,
    message: 'Valores definidos e link gerado com sucesso',
    contratante: {
      id: contratante.id,
      nome: contratante.nome,
      valor_por_funcionario: input.valor_por_funcionario,
      numero_funcionarios: input.numero_funcionarios,
      valor_total: valorTotal,
      link_pagamento: linkPagamento,
      link_expiracao: expiracao.toISOString(),
    },
  };
}

export async function handleRegenerarLink(
  input: RegenerarLinkPersonalizadoInput,
  context: RequestContext
) {
  requireRole(context, 'admin');
  const { session, request } = context;

  // Buscar contratacao_personalizada existente
  const contratacaoRes = await query(
    `SELECT cp.*, c.nome, c.id as contratante_id
     FROM contratacao_personalizada cp
     JOIN contratantes c ON cp.contratante_id = c.id
     WHERE cp.contratante_id = $1
       AND cp.status = 'valor_definido'`,
    [input.contratante_id]
  );

  if (contratacaoRes.rows.length === 0) {
    throw new Error(
      'Contratação personalizada não encontrada ou não está com status valor_definido'
    );
  }

  const contratacao = contratacaoRes.rows[0] as {
    contratante_id: number;
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
     WHERE contratante_id = $3`,
    [token, expiracao, input.contratante_id]
  );

  // Log de auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'contratacao_personalizada',
      action: 'UPDATE',
      resourceId: input.contratante_id,
      newData: {
        payment_link_token: token,
        link_expiracao: expiracao,
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Link de pagamento regenerado para contratante ${input.contratante_id}`,
    },
    session
  );

  const linkPagamento = createPaymentLink(token);

  return {
    success: true,
    message: 'Link regenerado com sucesso',
    contratante: {
      id: contratacao.contratante_id,
      nome: contratacao.nome,
      link_pagamento: linkPagamento,
      link_expiracao: expiracao.toISOString(),
    },
  };
}

export async function handleDeletarContratante(
  input: DeletarContratanteInput,
  context: RequestContext
) {
  requireRole(context, 'admin');

  const { session } = context;
  const requestInfo = extractRequestInfo(context.request);

  // Verificar se o contratante existe e está em status que permite deleção
  const contratante = await query(
    'SELECT id, nome, status FROM contratantes WHERE id = $1',
    [input.contratante_id]
  );

  if (contratante.rows.length === 0) {
    throw new Error('Contratante não encontrado');
  }

  const status = (contratante.rows[0] as any).status;

  // Só permitir deletar se estiver em status pendente ou rejeitado
  if (!['pendente', 'rejeitado'].includes(status)) {
    throw new Error('Não é possível deletar contratante com status atual');
  }

  // Deletar o contratante (cascade deve cuidar das dependências)
  await query('DELETE FROM contratantes WHERE id = $1', [input.contratante_id]);

  // Log de auditoria
  await logAudit(
    {
      resource: 'contratante',
      action: 'DELETE',
      resourceId: input.contratante_id,
      oldData: contratante.rows[0] as any,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Contratante deletado: ${(contratante.rows[0] as any).nome}`,
    },
    session
  );

  return {
    success: true,
    message: 'Contratante deletado com sucesso',
  };
}
