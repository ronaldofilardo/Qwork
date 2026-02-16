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
  getPagamentosByEntidade,
  atualizarStatusPagamento,
  updatePagamentoAsaasData,
  getAsaasCustomerIdByTomador,
} from '@/lib/db-contratacao';
import { logAudit, extractRequestInfo } from '@/lib/audit';
import { ativarEntidade } from '@/lib/entidade-activation';
import {
  criarContaResponsavel,
  criarSenhaInicialEntidade,
} from '@/lib/infrastructure/database';
// Integração Asaas
import { asaasClient } from '@/lib/asaas/client';
import {
  mapMetodoPagamentoToAsaasBillingType,
  formatCpfCnpj,
  formatPhone,
  calculateDueDate,
  truncateDescription,
} from '@/lib/asaas/mappers';
import type { AsaasCustomer, AsaasPayment } from '@/lib/asaas/types';
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

  // Exige sessão e permite apenas admin ou responsável da entidade
  requireSession(context);
  if (session.perfil !== 'admin' && !session.entidade_id) {
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

  if (input.entidade_id) {
    const pagamentos = await getPagamentosByEntidade(
      input.entidade_id,
      session
    );

    return {
      success: true,
      pagamentos,
    };
  }

  throw new Error('Forneça id ou entidade_id');
}

// ============================================================================
// POST HANDLERS
// ============================================================================

export async function handleIniciarPagamento(
  input: IniciarPagamentoInput,
  context: RequestContext
) {
  const { request } = context;

  // 1. Buscar dados do tomador/entidade (necessário para criar cliente no Asaas)
  const tomadorResult = await query(
    `SELECT 
      id, nome, cnpj, email, telefone,
      responsavel_nome, responsavel_cpf, responsavel_email, responsavel_celular
     FROM tomadores 
     WHERE id = $1`,
    [input.entidade_id]
  );

  if (tomadorResult.rows.length === 0) {
    throw new Error('Entidade/Tomador não encontrado');
  }

  const tomador = tomadorResult.rows[0] as {
    id: number;
    nome: string;
    cnpj: string;
    email: string;
    telefone: string;
    responsavel_nome?: string;
    responsavel_cpf?: string;
    responsavel_email?: string;
    responsavel_celular?: string;
  };

  // 2. Criar pagamento inicial no banco (status pendente)
  const pagamento = await iniciarPagamento(
    {
      entidade_id: input.entidade_id,
      contrato_id: input.contrato_id,
      valor: input.valor,
      metodo: input.metodo as any,
      plataforma_nome: 'Asaas', // Sempre usar Asaas agora
    },
    undefined // Sem sessão no fluxo de contratação
  );

  try {
    // 3. Verificar se já existe cliente no Asaas
    let asaasCustomerId = await getAsaasCustomerIdByTomador(input.entidade_id);

    if (!asaasCustomerId) {
      // Criar novo cliente no Asaas
      const customerData: AsaasCustomer = {
        name: tomador.responsavel_nome || tomador.nome,
        email: tomador.responsavel_email || tomador.email,
        cpfCnpj: formatCpfCnpj(tomador.responsavel_cpf || tomador.cnpj),
        phone: formatPhone(tomador.telefone || ''),
        mobilePhone: formatPhone(
          tomador.responsavel_celular || tomador.telefone || ''
        ),
        externalReference: `tomador_${input.entidade_id}`,
      };

      console.log('[Pagamento] Criando cliente no Asaas:', customerData.name);

      const customerResponse = await asaasClient.createCustomer(customerData);
      asaasCustomerId = customerResponse.id;

      console.log('[Pagamento] Cliente Asaas criado:', asaasCustomerId);
    } else {
      console.log('[Pagamento] Cliente Asaas já existe:', asaasCustomerId);
    }

    // 4. Criar cobrança no Asaas
    const billingType = mapMetodoPagamentoToAsaasBillingType(input.metodo);
    const dueDate = calculateDueDate(3); // Vencimento em 3 dias

    const paymentData: AsaasPayment = {
      customer: asaasCustomerId,
      billingType,
      value: input.valor,
      dueDate,
      description: truncateDescription(
        `QWork - Assinatura Plano ${input.plano_tipo || 'Personalizado'}`
      ),
      externalReference: `pag_${pagamento.id}_${Date.now()}`,
      // Configurações de juros e multa
      fine: {
        value: 2,
        type: 'PERCENTAGE', // 2% de multa
      },
      interest: {
        value: 1,
        type: 'PERCENTAGE', // 1% de juros ao mês
      },
    };

    console.log('[Pagamento] Criando cobrança no Asaas:', {
      customer: asaasCustomerId,
      value: input.valor,
      billingType,
    });

    const paymentResponse = await asaasClient.createPayment(paymentData);

    console.log('[Pagamento] Cobrança Asaas criada:', paymentResponse.id);

    // 5. Se for PIX, buscar QR Code
    let pixQrCode = null;
    if (billingType === 'PIX') {
      try {
        console.log('[Pagamento] Buscando QR Code PIX...');
        pixQrCode = await asaasClient.getPixQrCode(paymentResponse.id);
        console.log('[Pagamento] QR Code PIX gerado com sucesso');
      } catch (error) {
        console.error('[Pagamento] Erro ao buscar QR Code PIX:', error);
        // Não falha o processo, apenas loga o erro
      }
    }

    // 6. Atualizar pagamento no banco com dados do Asaas
    await updatePagamentoAsaasData(pagamento.id, {
      customerId: asaasCustomerId,
      paymentId: paymentResponse.id,
      paymentUrl: paymentResponse.invoiceUrl, // URL genérica da fatura
      boletoUrl: paymentResponse.bankSlipUrl,
      invoiceUrl: paymentResponse.invoiceUrl,
      pixQrCode: pixQrCode?.payload,
      pixQrCodeImage: pixQrCode?.encodedImage,
      netValue: paymentResponse.netValue,
      dueDate: paymentResponse.dueDate,
      status: 'processando', // Asaas criou, aguardando pagamento
    });

    // 7. Registrar auditoria
    const requestInfo = extractRequestInfo(request);
    await logAudit(
      {
        resource: 'pagamentos',
        action: 'INSERT',
        resourceId: pagamento.id,
        newData: {
          entidade_id: input.entidade_id,
          contrato_id: input.contrato_id,
          valor: input.valor,
          metodo: input.metodo,
          status: 'processando',
          asaas_payment_id: paymentResponse.id,
          asaas_customer_id: asaasCustomerId,
        },
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        details: `Pagamento criado no Asaas - Método: ${billingType}, Valor: R$ ${input.valor}`,
      },
      undefined
    );

    // 8. Retornar resposta com dados de pagamento
    return {
      success: true,
      message: 'Pagamento iniciado com sucesso no Asaas',
      pagamento: {
        ...pagamento,
        asaas_payment_id: paymentResponse.id,
        asaas_customer_id: asaasCustomerId,
        asaas_payment_url: paymentResponse.invoiceUrl,
        asaas_boleto_url: paymentResponse.bankSlipUrl,
        asaas_invoice_url: paymentResponse.invoiceUrl,
        asaas_pix_qrcode: pixQrCode?.payload,
        asaas_pix_qrcode_image: pixQrCode?.encodedImage,
        asaas_due_date: paymentResponse.dueDate,
        status: 'processando',
      },
      // Dados adicionais para o frontend
      paymentUrl: paymentResponse.invoiceUrl,
      bankSlipUrl: paymentResponse.bankSlipUrl,
      pixQrCode: pixQrCode
        ? {
            payload: pixQrCode.payload,
            encodedImage: pixQrCode.encodedImage,
          }
        : null,
      dueDate: paymentResponse.dueDate,
      billingType,
    };
  } catch (error: any) {
    // Se houver erro na integração com Asaas, atualizar status do pagamento
    console.error('[Pagamento] Erro na integração Asaas:', error);

    await query(
      `UPDATE pagamentos 
       SET status = 'cancelado',
           observacoes = $2,
           atualizado_em = NOW()
       WHERE id = $1`,
      [pagamento.id, `Erro Asaas: ${error.message}`]
    );

    throw new Error(
      `Falha ao processar pagamento no Asaas: ${error.message || 'Erro desconhecido'}`
    );
  }
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
    // Marcar pagamento confirmado na entidade
    await query(
      `UPDATE entidades 
       SET pagamento_confirmado = true,
           metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
             'pagamento_id', $1::int,
             'data_confirmacao', NOW(),
             'metodo_pagamento', $2
           )
       WHERE id = $3`,
      [input.pagamento_id, pagamento.metodo, pagamento.entidade_id]
    );

    // Buscar entidade para próximas etapas
    const entidadeResult = await query(
      `SELECT id, nome, cnpj, responsavel_cpf, responsavel_email, responsavel_telefone
       FROM entidades WHERE id = $1`,
      [pagamento.entidade_id]
    );

    if (entidadeResult.rows.length === 0) {
      throw new Error('Entidade não encontrada após pagamento');
    }

    const entidade = entidadeResult.rows[0] as {
      responsavel_cpf?: string;
      responsavel_email?: string;
      responsavel_telefone?: string;
      nome?: string;
      id: number;
    };

    // Ativar entidade
    await ativarEntidade({
      entidade_id: pagamento.entidade_id,
      motivo: `Ativação automática após confirmação do pagamento ${input.pagamento_id}`,
    });

    // Criar conta do responsável (se ainda não existe)
    try {
      const cpfNumeros = entidade.responsavel_cpf?.replace(/\D/g, '');
      if (cpfNumeros) {
        // Criar senha inicial no banco (se aplicável) e em seguida criar a conta
        try {
          await criarSenhaInicialEntidade(entidade.id);
        } catch (e) {
          // Não falhar se a criação da senha inicial falhar
          console.warn(
            'Não foi possível criar senha inicial automaticamente:',
            e
          );
        }

        await criarContaResponsavel(entidade.id);
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
      message: 'Pagamento confirmado e tomador ativado com sucesso',
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
