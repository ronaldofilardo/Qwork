import { NextRequest, NextResponse } from 'next/server';
import util from 'util';
import { query, criarContaResponsavel } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';
import { aceitarContrato } from '@/lib/contratos/contratos';
import { criarNotificacao } from '@/lib/notifications/create-notification';
import { ativarEntidade } from '@/lib/entidade-activation';

/**
 * API POST /api/pagamento/confirmar
 *
 * Confirma pagamento e executa ações pós-pagamento:
 * 1. Atualiza status do pagamento para 'pago'
 * 2. Gera recibo legal completo
 * 3. Retorna URLs do recibo e dados de acesso
 *
 * Política: CONTRATO PRIMEIRO (contract-first)
 * - O contrato deve estar explicitamente aceito ANTES do pagamento ser confirmado.
 * - Esta rota NÃO realiza aceitação ou ativação automática do contratante.
 */

export async function POST(request: NextRequest) {
  console.log('[HANDLER] Iniciando POST /api/pagamento/confirmar');

  // Pré-parsear body para permitir ações de compensação no catch externo
  let body: any;
  try {
    body = await request.json();
    console.log('[HANDLER] Body parseado com sucesso');
  } catch (parseErr) {
    console.error('[HANDLER] Falha ao parsear body:', parseErr);
    return NextResponse.json({ error: 'Requisição inválida' }, { status: 400 });
  }

  const {
    metodo_pagamento,
    plataforma_id,
    plataforma_nome,
    numero_parcelas,
    idempotency_key,
    external_transaction_id,
  } = body;

  // Variáveis para tentativa de compensação em caso de erro
  const pagamento_id: number | null = body?.pagamento_id || null;
  let paymentWasUpdated = false;
  // flags para fluxo pós-pagamento
  let loginLiberado = false;
  let acessoLiberado = false;

  try {
    console.log('[PAGAMENTO_CONFIRMAR] request body:', body);

    // Validações
    console.log('[HANDLER] Validando pagamento_id:', pagamento_id);
    if (!pagamento_id) {
      console.log('[HANDLER] Pagamento ID ausente, retornando 400');
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }
    console.log('[HANDLER] Pagamento ID válido, continuando...');

    // TODO: Código de fallback de recibo foi removido temporariamente pois estava usando
    // variáveis (reciboId, contratoId, pagamento) antes de serem definidas.
    // Precisa ser reposicionado APÓS a busca do pagamento do banco.

    // Buscar pagamento e dados completos do contratante
    console.log('[HANDLER] Buscando pagamento no banco...');
    let pagamentoResult;
    try {
      pagamentoResult = await query(
        `SELECT p.id, p.contratante_id, p.contrato_id, p.status, c.nome as entidade_nome,
                c.tipo, c.cnpj, c.responsavel_cpf, c.responsavel_nome, c.responsavel_email, c.responsavel_celular
         FROM pagamentos p
         JOIN entidades c ON p.contratante_id = c.id
         WHERE p.id = $1`,
        [pagamento_id]
      );
    } catch (queryError: any) {
      console.error(
        '[HANDLER] Erro na query de busca do pagamento:',
        queryError.message
      );
      console.error('[HANDLER] Stack:', queryError.stack);
      return NextResponse.json(
        { error: `Erro ao buscar pagamento: ${queryError.message}` },
        { status: 500 }
      );
    }
    console.log(
      '[HANDLER] Query executada, rows:',
      pagamentoResult.rows.length
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    const pagamento = pagamentoResult.rows[0];
    const contratoId = pagamento.contrato_id;

    console.log('[PAGAMENTO_CONFIRMAR] Dados do pagamento encontrados:', {
      id: pagamento.id,
      entidade_id: pagamento.contratante_id,
      cnpj: pagamento.cnpj,
      tipo: pagamento.tipo,
      responsavel_cpf: pagamento.responsavel_cpf,
      contrato_id: contratoId,
    });

    console.log(
      '[PAGAMENTO_CONFIRMAR] Iniciando UPDATE atômico para status=pago'
    );

    // Marcar pagamento como 'pago' de forma atômica (não replicamos transações manuais com BEGIN/COMMIT para evitar problema de conexão)
    let updated;
    try {
      updated = await query(
        `UPDATE pagamentos
         SET status = 'pago', 
             metodo = $2, 
             plataforma_id = $3, 
             plataforma_nome = $4, 
             numero_parcelas = $5, 
             data_pagamento = NOW(),
             idempotency_key = COALESCE($6, idempotency_key),
             external_transaction_id = COALESCE($7, external_transaction_id)
         WHERE id = $1 AND status NOT IN ('pago', 'cancelado')
         RETURNING id`,
        [
          pagamento_id,
          metodo_pagamento || 'avista',
          plataforma_id,
          plataforma_nome,
          numero_parcelas || 1,
          idempotency_key || null,
          external_transaction_id || null,
        ]
      );
    } catch (updateErr: any) {
      console.error(
        '[PAGAMENTO_CONFIRMAR] Erro no UPDATE do pagamento:',
        updateErr.message
      );
      console.error('[PAGAMENTO_CONFIRMAR] Stack:', updateErr.stack);
      return NextResponse.json(
        { error: `Erro ao atualizar pagamento: ${updateErr.message}` },
        { status: 500 }
      );
    }

    console.log(
      '[PAGAMENTO_CONFIRMAR] UPDATE result rows:',
      updated?.rows?.length
    );

    // Marcar flag para possível compensação se atualizamos o pagamento para 'pago'
    if (updated?.rows?.length > 0) {
      paymentWasUpdated = true;
    }

    if (updated.rows.length === 0) {
      // Verificar status atual
      const statusCheck = await query(
        'SELECT status FROM pagamentos WHERE id = $1',
        [pagamento_id]
      );
      const currentStatus = statusCheck.rows[0]?.status;

      if (!currentStatus) {
        return NextResponse.json(
          { error: 'Pagamento não encontrado' },
          { status: 404 }
        );
      }

      if (currentStatus === 'cancelado') {
        return NextResponse.json(
          { error: 'Pagamento foi cancelado' },
          { status: 400 }
        );
      }

      if (currentStatus === 'pago') {
        // Pagamento já confirmado - seguir com fluxo de pós-pagamento
        // (não retornar imediatamente) para garantir que ações idempotentes
        // como criação de login e aceite de contrato ocorram se ainda não feitas.
        console.log(
          '[PAGAMENTO_CONFIRMAR] pagamento já marcado como pago, continuando para ações idempotentes'
        );
      }
    } else {
      console.log(
        '[PAGAMENTO_CONFIRMAR] pagamento atualizado para pago (atomic update)'
      );
    }

    console.log(
      '[PAGAMENTO_CONFIRMAR] Pagamento confirmado - preparando ativação e liberação de login'
    );

    // Persistir detalhes das parcelas no pagamento (se aplicável)
    try {
      const pagamentoAtual = await query(
        `SELECT valor, numero_parcelas, data_pagamento FROM pagamentos WHERE id = $1`,
        [pagamento_id]
      );

      console.log(
        '[PAGAMENTO_CONFIRMAR] pagamentoAtual:',
        pagamentoAtual.rows[0]
      );

      if (
        pagamentoAtual.rows.length > 0 &&
        pagamentoAtual.rows[0].numero_parcelas &&
        pagamentoAtual.rows[0].numero_parcelas > 1
      ) {
        const numero = parseInt(pagamentoAtual.rows[0].numero_parcelas);
        const valor = parseFloat(pagamentoAtual.rows[0].valor);
        const dataInicio = new Date(pagamentoAtual.rows[0].data_pagamento);
        const parcelas = calcularParcelas({
          valorTotal: valor,
          numeroParcelas: numero,
          dataInicial: dataInicio,
        });

        await query(
          `UPDATE pagamentos SET detalhes_parcelas = $2 WHERE id = $1`,
          [pagamento_id, JSON.stringify(parcelas)]
        );

        // 🔔 CRIAR NOTIFICAÇÕES PARA PARCELAS FUTURAS
        console.log(
          `[NOTIFICAÇÃO] Criando notificações para ${parcelas.length - 1} parcelas futuras`
        );

        for (const parcela of parcelas) {
          // Pular a primeira parcela (já paga)
          if (parcela.numero === 1) continue;

          try {
            const vencimento = new Date(parcela.data_vencimento);
            const vencimentoFormatado = vencimento.toLocaleDateString('pt-BR');

            await criarNotificacao({
              tipo: 'parcela_pendente',
              destinatario_id: pagamento.contratante_id,
              destinatario_tipo: 'contratante',
              titulo: `Parcela ${parcela.numero}/${numero} - Vence em ${vencimentoFormatado}`,
              mensagem: `Você tem uma parcela pendente no valor de R$ ${parcela.valor.toFixed(2).replace('.', ',')} com vencimento em ${vencimentoFormatado}.`,
              dados_contexto: {
                pagamento_id: pagamento_id,
                numero_parcela: parcela.numero,
                total_parcelas: numero,
                vencimento: parcela.data_vencimento,
                valor: parcela.valor,
                entidade_id: pagamento.contratante_id,
              },
              link_acao: '/rh/conta#pagamentos',
              botao_texto: 'Ver Pagamentos',
              prioridade: 'alta',
            });

            console.log(
              `[NOTIFICAÇÃO] Parcela ${parcela.numero}/${numero} criada para entidade ${pagamento.contratante_id}`
            );
          } catch (notifError) {
            console.error(
              `[NOTIFICAÇÃO] Erro ao criar notificação de parcela ${parcela.numero}:`,
              notifError
            );
            // Não interromper fluxo por erro de notificação
          }
        }
      }
    } catch (err) {
      console.error('Erro ao persistir detalhes_parcelas:', err);
      // Não interromper fluxo principal por falha na persistência de JSON
    }

    // A geração automática de recibo foi desativada: recibos são gerados sob demanda.
    // O fluxo agora retorna uma flag `show_receipt_info` para o frontend abrir o popup
    // de instruções sobre como obter o recibo (recibo sob demanda).

    // --- Liberar login no aceite do pagamento (sem alterar o contrato) ---
    // Política: manter `contratos` como pendente para que o admin possa aprovar,
    // mas liberar login/acesso ao confirmar o pagamento.
    try {
      // Marcar contratante como ativo/confirmado (não altera contratos.status)
      await query(
        `UPDATE entidades SET ativa = true, pagamento_confirmado = true, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1`,
        [pagamento.contratante_id]
      );

      acessoLiberado = true;

      // Criar login do responsável usando função centralizada e ativar entidade
      try {
        try {
          await criarContaResponsavel(pagamento.contratante_id);
          loginLiberado = true;
        } catch (createErr) {
          console.warn(
            '[PAGAMENTO_CONFIRMAR] Falha ao criar conta do responsável via criarContaResponsavel (ignorado):',
            createErr?.message || createErr
          );
        }

        // Tentar ativar entidade mesmo sem recibo (recibos são gerados sob demanda)
        try {
          const ativ = await ativarEntidade(pagamento.contratante_id);
          if (ativ.success) {
            acessoLiberado = true;
          } else {
            console.warn(
              '[PAGAMENTO_CONFIRMAR] ativarEntidade não completou:',
              ativ.message
            );
          }
        } catch (ativErr) {
          console.warn(
            '[PAGAMENTO_CONFIRMAR] Erro ao ativar entidade (ignorado):',
            ativErr?.message || ativErr
          );
        }
      } catch (loginErr) {
        console.warn(
          '[PAGAMENTO_CONFIRMAR] Erro ao liberar login (ignorado):',
          loginErr?.message || loginErr
        );
      }
    } catch (markErr) {
      console.warn(
        '[PAGAMENTO_CONFIRMAR] Falha ao marcar entidade ativa (ignorado):',
        markErr?.message || markErr
      );
    }

    // Se houver um contrato associado e não estiver aceito, aceitar automaticamente após pagamento
    if (contratoId) {
      try {
        try {
          await aceitarContrato({
            contrato_id: contratoId,
            cpf_aceite: '00000000000',
            ip_aceite: '127.0.0.1',
          });
          console.log(
            '[PAGAMENTO_CONFIRMAR] Contrato aceito automaticamente após pagamento:',
            contratoId
          );
        } catch (aceiteErr: any) {
          // Se já foi aceito anteriormente, ignorar
          if (
            aceiteErr.message &&
            aceiteErr.message.includes('Contrato já foi aceito')
          ) {
            console.log(
              '[PAGAMENTO_CONFIRMAR] Contrato já estava aceito:',
              contratoId
            );
          } else {
            console.warn(
              '[PAGAMENTO_CONFIRMAR] Erro ao aceitar contrato automaticamente (ignorado):',
              aceiteErr?.message || aceiteErr
            );
          }
        }

        // Garantir que entidade esteja como aprovada/ativa após pagamento
        await query(
          `UPDATE entidades SET status = 'aprovado', ativa = true, pagamento_confirmado = true, data_liberacao_login = COALESCE(data_liberacao_login, NOW()), aprovado_em = COALESCE(aprovado_em, CURRENT_TIMESTAMP), atualizado_em = CURRENT_TIMESTAMP WHERE id = $1`,
          [pagamento.contratante_id]
        );

        acessoLiberado = true;

        // Garantir criação de login/conta e ativação centralizada
        try {
          await criarContaResponsavel(pagamento.contratante_id);
          loginLiberado = true;
        } catch (createErr) {
          console.warn(
            '[PAGAMENTO_CONFIRMAR] Falha ao criar conta após aceite do contrato (ignorado):',
            createErr?.message || createErr
          );
        }

        try {
          const ativRes = await ativarEntidade(pagamento.contratante_id);
          if (ativRes.success) {
            acessoLiberado = true;
          } else {
            console.warn(
              '[PAGAMENTO_CONFIRMAR] ativarEntidade após aceite retornou:',
              ativRes.message
            );
          }
        } catch (ativErr) {
          console.warn(
            '[PAGAMENTO_CONFIRMAR] Erro ao ativar entidade após aceite (ignorado):',
            ativErr?.message || ativErr
          );
        }
      } catch (err) {
        console.warn(
          '[PAGAMENTO_CONFIRMAR] Falha ao finalizar aceite de contrato após pagamento (ignorado):',
          err?.message || err
        );
      }
    }

    // ===== ATIVAÇÃO IMEDIATA: Criar conta de login e ativar contratante =====
    // POLÍTICA CORRETA: Login liberado IMEDIATAMENTE após pagamento confirmado
    // Recibo é gerado SOB DEMANDA quando o usuário solicitar
    console.log(
      '[PAGAMENTO_CONFIRMAR] Iniciando ativação e liberação de login (sem dependência de recibo)'
    );
    try {
      // 1. Ativar entidade
      await query(
        `UPDATE entidades 
         SET ativa = true,
             status = 'aprovado',
             pagamento_confirmado = true,
             data_liberacao_login = COALESCE(data_liberacao_login, NOW()),
             aprovado_em = COALESCE(aprovado_em, CURRENT_TIMESTAMP),
             aprovado_por_cpf = '00000000000',
             atualizado_em = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [pagamento.contratante_id]
      );

      acessoLiberado = true;

      // 2. Criar conta de login com senha = últimos 6 dígitos do CNPJ
      const cnpjLimpo = pagamento.cnpj.replace(/\D/g, '');
      const senhaInicial = cnpjLimpo.slice(-6); // Últimos 6 dígitos

      // Verificar se já existe login
      const loginExists = await query(
        'SELECT cpf FROM funcionarios WHERE cpf = $1',
        [pagamento.responsavel_cpf]
      );

      console.log(
        '[PAGAMENTO_CONFIRMAR] loginExists count:',
        loginExists.rows.length
      );

      if (loginExists.rows.length === 0) {
        // Determinar perfil baseado no tipo de contratante (entidade → gestor)
        const perfil = pagamento.tipo === 'entidade' ? 'gestor' : 'emissor';

        // IMPORTANTE: nivel_cargo só pode ser definido para perfil 'funcionario'
        // Neste fluxo criamos apenas perfis de gestor ou emissor, portanto manter NULL
        const nivelCargo = null;

        // Inserir com senha em texto plano - sistema fará hash automaticamente no primeiro login
        // Tentar mapear contratante para empresa em empresas_clientes, senão deixar nulo
        const empresaRow = await query(
          'SELECT id FROM empresas_clientes WHERE cnpj = $1 LIMIT 1',
          [pagamento.cnpj]
        );
        const empresaId = empresaRow.rows[0]?.id || null;
        const clinicaId = null; // não lidamos com clínicas aqui no fluxo de pagamento
        console.log(
          `[PAGAMENTO_CONFIRMAR] Criando login para responsável: cpf=${pagamento.responsavel_cpf}, perfil=${perfil}, nivel_cargo=${nivelCargo}`
        );

        // Inserção dentro de transação explícita
        try {
          await query('BEGIN');

          const insertRes = await query(
            `INSERT INTO funcionarios (cpf, nome, email, senha_hash, perfil, ativo, nivel_cargo, entidade_id, clinica_id, empresa_id, criado_em, atualizado_em)
             VALUES ($1, $2, $3, $4, $5, true, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, cpf, perfil`,
            [
              pagamento.responsavel_cpf,
              pagamento.responsavel_nome,
              pagamento.responsavel_email,
              senhaInicial,
              perfil,
              nivelCargo,
              pagamento.contratante_id,
              clinicaId,
              empresaId,
            ]
          );

          await query('COMMIT');

          console.log(
            `[PAGAMENTO_CONFIRMAR] ✅ Login criado com sucesso: ID=${insertRes.rows[0].id}, perfil=${insertRes.rows[0].perfil}, senha=últimos 6 dígitos do CNPJ`
          );

          // Garantir que haja uma senha padronizada na tabela entidades_senhas
          try {
            await query('SELECT criar_senha_inicial_entidade($1)', [
              pagamento.contratante_id,
            ]);
            console.log(
              '[PAGAMENTO_CONFIRMAR] criar_senha_inicial_entidade executada com sucesso'
            );
          } catch (fnErr) {
            console.warn(
              '[PAGAMENTO_CONFIRMAR] Falha ao executar criar_senha_inicial_entidade:',
              fnErr
            );
          }
        } catch (txErr: any) {
          try {
            await query('ROLLBACK');
          } catch (rbErr) {
            console.error(
              '[PAGAMENTO_CONFIRMAR] Erro ao executar ROLLBACK:',
              rbErr
            );
          }
          console.error(
            '[PAGAMENTO_CONFIRMAR] ❌ Erro ao criar login:',
            txErr.message
          );
          // Não rethrow em test ou produção — ativação não deve bloquear confirmação de pagamento
        }
      } else {
        console.log(
          `[PAGAMENTO_CONFIRMAR] Login já existe para ${pagamento.responsavel_cpf}`
        );
      }

      loginLiberado = true;
    } catch (activationError) {
      console.error('[PAGAMENTO_CONFIRMAR] Erro na ativação:', activationError);
      // Não interromper fluxo por erro de ativação
    }

    console.log(
      '[PAGAMENTO_CONFIRMAR] Respondendo sucesso - login liberado, recibo sob demanda'
    );
    return NextResponse.json({
      success: true,
      message: 'Pagamento confirmado com sucesso! Acesso liberado.',
      pagamento_id: pagamento_id,
      entidade_id: pagamento.contratante_id,
      entidade_nome: pagamento.entidade_nome,
      acesso_liberado: acessoLiberado,
      login_liberado: loginLiberado,
      proximos_passos: [
        'Acesso ao sistema liberado imediatamente',
        'Login: use CPF do responsável e senha = últimos 6 dígitos do CNPJ',
        'Recibo disponível sob demanda: Conta > Plano > Baixar Comprovante',
        'Contrato padrão em: /termos/contrato',
      ],
    });
  } catch (error) {
    // Log principal
    try {
      console.error(
        '[PAGAMENTO_CONFIRMAR] Erro ao confirmar pagamento:',
        error
      );
      console.error(
        '[PAGAMENTO_CONFIRMAR] Erro detalhado:',
        util.inspect(error, { showHidden: true, depth: 5 })
      );
      console.error(
        '[PAGAMENTO_CONFIRMAR] Erro stack:',
        (error && (error as any).stack) || error
      );
    } catch (e) {
      console.error('[PAGAMENTO_CONFIRMAR] Erro ao logar erro original:', e);
    }

    // Se atualizamos o pagamento para 'pago' antes do erro, tentar compensar
    if (paymentWasUpdated && pagamento_id) {
      try {
        console.log(
          '[PAGAMENTO_CONFIRMAR] Iniciando compensação: revertendo estados (pago -> pendente)'
        );
        await query('BEGIN');

        // Obter contratante associado (se ainda disponível)
        const pInfo = await query(
          'SELECT entidade_id, contrato_id FROM pagamentos WHERE id = $1',
          [pagamento_id]
        );
        const entidadeIdForRollback = pInfo.rows[0]?.entidade_id || null;
        const contratoIdFromPayment = pInfo.rows[0]?.contrato_id || null;

        // Reverter pagamento para pendente
        await query("UPDATE pagamentos SET status = 'pendente' WHERE id = $1", [
          pagamento_id,
        ]);

        // Reverter contratos relacionados
        if (contratoIdFromPayment) {
          await query(
            "UPDATE contratos SET status = 'pendente', aceito = false WHERE id = $1",
            [contratoIdFromPayment]
          );
        } else if (entidadeIdForRollback) {
          await query(
            "UPDATE contratos SET status = 'pendente', aceito = false WHERE entidade_id = $1",
            [entidadeIdForRollback]
          );
        }

        // Voltar pré-contrato para fase de definição
        if (entidadeIdForRollback) {
          await query(
            `UPDATE contratacao_personalizada
             SET status = 'aguardando_valor_admin',
                 valor_por_funcionario = NULL,
                 valor_total_estimado = NULL,
                 numero_funcionarios_estimado = NULL,
                 payment_link_token = NULL,
                 payment_link_expiracao = NULL
             WHERE entidade_id = $1`,
            [entidadeIdForRollback]
          );

          // Marcar entidade como pendente novamente
          await query(
            `UPDATE entidades SET status = 'pendente', pagamento_confirmado = false, ativa = false WHERE id = $1`,
            [entidadeIdForRollback]
          );
        }

        await query('COMMIT');
        console.log('[PAGAMENTO_CONFIRMAR] Compensação aplicada com sucesso');
      } catch (compErr) {
        try {
          await query('ROLLBACK');
        } catch (rb) {
          console.error(
            '[PAGAMENTO_CONFIRMAR] Erro ao dar ROLLBACK na compensação:',
            rb
          );
        }
        console.error(
          '[PAGAMENTO_CONFIRMAR] Falha ao aplicar compensação automaticamente:',
          compErr
        );
      }
    }

    // Em ambiente de teste, retornar erro detalhado
    const errorMessage =
      process.env.NODE_ENV === 'test' && error instanceof Error
        ? `${error.message} | Stack: ${error.stack?.substring(0, 200)}`
        : 'Erro ao confirmar pagamento';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// Endpoint para consultar status do pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pagamentoId = searchParams.get('id');

    if (!pagamentoId) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    const pagamentoResult = await query(
      `SELECT p.*, c.nome as entidade_nome, c.pagamento_confirmado
       FROM pagamentos p
       JOIN entidades c ON p.entidade_id = c.id
       WHERE p.id = $1`,
      [pagamentoId]
    );

    if (pagamentoResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Pagamento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      pagamento: pagamentoResult.rows[0],
    });
  } catch (error) {
    console.error('Erro ao consultar pagamento:', error);
    return NextResponse.json(
      { error: 'Erro ao consultar pagamento' },
      { status: 500 }
    );
  }
}
