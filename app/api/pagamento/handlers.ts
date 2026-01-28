/**
 * app/api/pagamento/handlers.ts
 *
 * Handlers de negócio para operações de pagamento
 * Separados da rota para facilitar testes e manutenção
 */

import { query } from '@/lib/infrastructure/database';
import {
  iniciarPagamento,
  confirmarPagamento,
  getPagamentoById,
  getPagamentosByContratante,
  atualizarStatusPagamento,
} from '@/lib/db-contratacao';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { ativarContratante } from '@/lib/contratante-activation';
import {
  criarContaResponsavel,
  criarSenhaInicialEntidade,
} from '@/lib/infrastructure/database';
// Recebíveis (recibos) são gerados sob demanda. Importação de gerador removida
import type { RequestContext } from '@/lib/application/handlers/api-handler';
import { requireSession } from '@/lib/application/handlers/api-handler';
import type {
  IniciarPagamentoInput,
  ConfirmarPagamentoInput,
  AtualizarStatusPagamentoInput,
  GetPagamentoInput,
} from './schemas';

// ============================================================================
// GET HANDLERS
// ============================================================================

export async function handleGetPagamento(
  input: GetPagamentoInput,
  context: RequestContext
) {
  const { session } = context;

  // Exige sessão e permite apenas admin ou responsável do contratante
  requireSession(context);
  if (session.perfil !== 'admin' && !session.contratante_id) {
    throw new Error('Não autorizado');
  }

  if (input.id) {
    const pagamento = await getPagamentoById(input.id, session);

    if (!pagamento) {
      throw new Error('Pagamento não encontrado');
    }

    return {
      success: true,
      pagamento,
    };
  }

  if (input.contratante_id) {
    const pagamentos = await getPagamentosByContratante(
      input.contratante_id,
      session
    );

    return {
      success: true,
      pagamentos,
    };
  }

  throw new Error('Forneça id ou contratante_id');
}

// ============================================================================
// POST HANDLERS
// ============================================================================

export async function handleIniciarPagamento(
  input: IniciarPagamentoInput,
  context: RequestContext
) {
  const { request } = context;

  const pagamento = await iniciarPagamento(
    {
      contratante_id: input.contratante_id,
      contrato_id: input.contrato_id,
      valor: input.valor,
      metodo: input.metodo as any,
      plataforma_nome: input.plataforma_nome,
    },
    undefined // Sem sessão no fluxo de contratação
  );

  // Registrar auditoria (opcional, sem sessão)
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'pagamentos',
      action: 'INSERT',
      resourceId: pagamento.id,
      newData: {
        contratante_id: input.contratante_id,
        contrato_id: input.contrato_id,
        valor: input.valor,
        metodo: input.metodo,
        status: 'pendente',
      },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Pagamento iniciado - Método: ${input.metodo}, Valor: R$ ${input.valor}`,
    },
    undefined
  );

  return {
    success: true,
    message: 'Pagamento iniciado com sucesso',
    pagamento,
  };
}

export async function handleConfirmarPagamento(
  input: ConfirmarPagamentoInput,
  context: RequestContext
) {
  const { session, request } = context;

  if (!session) {
    throw new Error('Sessão obrigatória para confirmar pagamento');
  }

  const pagamento = await confirmarPagamento(
    input.pagamento_id,
    input.plataforma_id,
    input.dados_adicionais,
    input.comprovante_path,
    session
  );

  // Registrar auditoria CRÍTICA
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'pagamentos',
      action: 'UPDATE',
      resourceId: input.pagamento_id,
      oldData: { status: 'pendente' },
      newData: { status: 'pago', data_pagamento: pagamento.data_pagamento },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `PAGAMENTO CONFIRMADO - ID: ${input.pagamento_id}, Valor: R$ ${pagamento.valor}`,
    },
    session
  );

  // Fluxo pós-pagamento: ativação/contas/recibo
  let contaCriada = false;
  try {
    // Marcar pagamento confirmado no contratante
    await query(
      `UPDATE contratantes 
       SET pagamento_confirmado = true,
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'pagamento_id', $1::int,
             'data_confirmacao', NOW(),
             'metodo_pagamento', $2
           )
       WHERE id = $3`,
      [input.pagamento_id, pagamento.metodo, pagamento.contratante_id]
    );

    // Buscar contratante para próximas etapas
    const contratanteResult = await query(
      `SELECT id, nome, cnpj, responsavel_cpf, responsavel_email, responsavel_telefone
       FROM contratantes WHERE id = $1`,
      [pagamento.contratante_id]
    );

    if (contratanteResult.rows.length === 0) {
      throw new Error('Contratante não encontrado após pagamento');
    }

    const contratante = contratanteResult.rows[0] as {
      responsavel_cpf?: string;
      responsavel_email?: string;
      responsavel_telefone?: string;
      nome?: string;
      id: number;
    };

    // Ativar contratante
    await ativarContratante({
      contratante_id: pagamento.contratante_id,
      motivo: `Ativação automática após confirmação do pagamento ${input.pagamento_id}`,
    });

    // Criar conta do responsável (se ainda não existe)
    try {
      const cpfNumeros = contratante.responsavel_cpf?.replace(/\D/g, '');
      if (cpfNumeros) {
        // Criar senha inicial no banco (se aplicável) e em seguida criar a conta
        try {
          await criarSenhaInicialEntidade(contratante.id);
        } catch (e) {
          // Não falhar se a criação da senha inicial falhar
          console.warn(
            'Não foi possível criar senha inicial automaticamente:',
            e
          );
        }

        await criarContaResponsavel(contratante.id);
        contaCriada = true;
      }
    } catch (err: any) {
      // Se já existe conta, continua normalmente
      if (!err.message?.includes('já existe')) {
        console.error('Erro ao criar conta responsável:', err);
      }
    }

    // Recibo: geração sob demanda. Não gerar automaticamente aqui.
    const reciboGerado = false;

    return {
      success: true,
      message: 'Pagamento confirmado e contratante ativado com sucesso',
      pagamento,
      conta_criada: contaCriada,
      recibo_gerado: reciboGerado,
      acesso_liberado: true,
      login_liberado: !!contaCriada,
      show_receipt_info: true,
      proximos_passos: [
        'Acesso ao sistema liberado',
        'Faça login com suas credenciais',
        'Recibo disponível em: Informações da Conta > Plano > Baixar Comprovante',
      ],
    };
  } catch (error: any) {
    console.error('Erro no fluxo pós-pagamento:', error);

    return {
      success: true,
      message: 'Pagamento confirmado, mas ocorreram erros no pós-processamento',
      pagamento,
      erro: error.message,
      acesso_liberado: true,
      login_liberado: !!contaCriada,
      show_receipt_info: true,
      proximos_passos: [
        'Acesso ao sistema liberado',
        'Faça login com suas credenciais',
        'Recibo disponível em: Informações da Conta > Plano > Baixar Comprovante',
      ],
    };
  }
}

export async function handleAtualizarStatusPagamento(
  input: AtualizarStatusPagamentoInput,
  context: RequestContext
) {
  const { session, request } = context;

  if (!session || session.perfil !== 'admin') {
    throw new Error(
      'Apenas administradores podem atualizar status de pagamento'
    );
  }

  const pagamento = await atualizarStatusPagamento(
    input.pagamento_id,
    input.novo_status as any,
    input.observacoes,
    session
  );

  // Registrar auditoria
  const requestInfo = extractRequestInfo(request);
  await logAudit(
    {
      resource: 'pagamentos',
      action: 'UPDATE',
      resourceId: input.pagamento_id,
      newData: { status: input.novo_status, observacoes: input.observacoes },
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      details: `Status atualizado para: ${input.novo_status}`,
    },
    session
  );

  return {
    success: true,
    message: 'Status atualizado com sucesso',
    pagamento,
  };
}
