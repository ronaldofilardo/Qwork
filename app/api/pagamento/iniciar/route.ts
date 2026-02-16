import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      tomador_id,
      entidade_id, // backward compat
      contrato_id,
      _contrato_id,
      plano_id,
      numero_funcionarios,
      valor_total,
      payment_link_token,
    } = body;

    // Verificar feature flag de pular fase de pagamento
    // ⚠️ NUNCA ativar em produção - somente para teste local
    const skipPaymentPhase =
      process.env.NEXT_PUBLIC_SKIP_PAYMENT_PHASE === 'true' &&
      process.env.NODE_ENV !== 'production';
    if (skipPaymentPhase) {
      console.warn(
        '⚠️ [SEGURANÇA] SKIP_PAYMENT_PHASE ATIVADO - Apenas em ambiente de teste!'
      );
      return NextResponse.json(
        {
          error:
            'A fase de pagamento está temporariamente inativa (somente para testes). Não use em produção.',
        },
        { status: 409 }
      );
    }

    // Use tomador_id ou entidade_id (retrocompat)
    const finalTomadorId = tomador_id || entidade_id;

    let contratoIdParam = _contrato_id || contrato_id;

    // If a payment link token is supplied, consume it atomically and derive the contrato_id
    let consumedPaymentLinkContratoId: number | null = null;
    if (payment_link_token) {
      try {
        await query('BEGIN');
        const tokenRes = await query(
          `UPDATE payment_links SET usado = true, usado_em = CURRENT_TIMESTAMP
           WHERE token = $1 AND usado = false AND (expiracao IS NULL OR expiracao > NOW())
           RETURNING contrato_id`,
          [payment_link_token]
        );
        if (tokenRes.rows.length === 0) {
          await query('ROLLBACK');
          return NextResponse.json(
            { error: 'Link inválido, expirado ou já utilizado' },
            { status: 410 }
          );
        }
        consumedPaymentLinkContratoId = tokenRes.rows[0].contrato_id;
        await query('COMMIT');
        console.log(
          `[PAGAMENTO] payment_link_token consumido para contrato ${consumedPaymentLinkContratoId}`
        );
      } catch (err: any) {
        try {
          await query('ROLLBACK');
        } catch {}
        console.error('[PAGAMENTO] Erro ao consumir payment_link_token:', err);
        return NextResponse.json(
          { error: 'Erro ao processar link de pagamento' },
          { status: 500 }
        );
      }
    }

    // Validações básicas
    if (!finalTomadorId) {
      return NextResponse.json(
        { error: 'ID do tomador é obrigatório' },
        { status: 400 }
      );
    }

    // Se contrato_id não foi fornecido, vamos tentar encontrar um contrato aceito associado ao tomador
    if (!contratoIdParam) {
      console.log(
        `[PAGAMENTO] Nenhum contrato_id informado para tomador ${finalTomadorId}, buscando contrato aceito associado`
      );
    }

    // Se o token de link foi consumido, forçamos o contratoIdParam para o contrato do token
    if (consumedPaymentLinkContratoId) {
      // overriding explicit contract param with the token's contract ensures one-time-use behaviour
      console.log(
        '[PAGAMENTO] Substituindo contrato_id pelo contrato do payment_link_token:',
        consumedPaymentLinkContratoId
      );
      contratoIdParam = consumedPaymentLinkContratoId;
    }

    // Buscar dados do tomador
    // Se um contrato específico foi informado, buscar juntando a tabela contratos para garantir
    // que o contrato pertence ao tomador (e permitir passar contrato_id como $2 na query)
    let tomadorResult;
    if (contratoIdParam) {
      tomadorResult = await query(
        `SELECT t.id, t.nome, t.plano_id, t.status, COALESCE(t.numero_funcionarios_estimado, 1) as numero_funcionarios, 
                t.tipo,
                p.nome as plano_nome, p.tipo as plano_tipo, p.preco, ctr.id as contrato_id, ctr.aceito as contrato_aceito, ctr.valor_total as contrato_valor_total
         FROM tomadores t
         LEFT JOIN planos p ON t.plano_id = p.id
         JOIN contratos ctr ON ctr.tomador_id = t.id AND ctr.id = $2
         WHERE t.id = $1`,
        [finalTomadorId, contratoIdParam]
      );
    } else {
      tomadorResult = await query(
        `SELECT t.id, t.nome, t.plano_id, t.status, COALESCE(t.numero_funcionarios_estimado, 1) as numero_funcionarios, 
                t.tipo,
                p.nome as plano_nome, p.tipo as plano_tipo, p.preco
         FROM tomadores t
         LEFT JOIN planos p ON t.plano_id = p.id
         WHERE t.id = $1`,
        [finalTomadorId]
      );
    }

    if (tomadorResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Tomador não encontrado' },
        { status: 404 }
      );
    }

    const tomador = tomadorResult.rows[0];

    // Se a consulta retornou valor_total do contrato, mapear para compatibilidade
    if (tomador.contrato_valor_total) {
      tomador.valor_total = tomador.contrato_valor_total;
    }

    // Verificar se o tomador tem status válido para iniciar pagamento
    // Normalmente exigimos que o tomador esteja em 'aguardando_pagamento'.
    // Para casos de plano personalizado, um contrato pode ter sido criado com
    // status 'aguardando_pagamento' mesmo que o tomador ainda esteja 'pendente'.
    // Neste caso, permitimos iniciar o pagamento quando houver um contrato
    // com status 'aguardando_pagamento' ou com `aceito = true`.
    if (tomador.status !== 'aguardando_pagamento') {
      // checar se existe um contrato que justifique iniciar o pagamento
      try {
        const contratoCheck = await query(
          `SELECT id, aceito, status FROM contratos WHERE tomador_id = $1 ORDER BY criado_em DESC LIMIT 1`,
          [finalTomadorId]
        );
        if (contratoCheck.rows.length === 0) {
          console.log(
            `[PAGAMENTO] Status inválido para tomador ${finalTomadorId}: ${tomador.status}`
          );
          return NextResponse.json(
            { error: 'Status inválido para pagamento' },
            { status: 400 }
          );
        }

        const lastContrato = contratoCheck.rows[0];
        if (
          lastContrato.status !== 'aguardando_pagamento' &&
          !lastContrato.aceito
        ) {
          console.log(
            `[PAGAMENTO] Status inválido para tomador ${finalTomadorId}: ${tomador.status} e contrato recente não permite pagamento (status=${lastContrato.status}, aceito=${lastContrato.aceito})`
          );
          return NextResponse.json(
            { error: 'Status inválido para pagamento' },
            { status: 400 }
          );
        }
        // caso contrário, permitimos continuar (contrato está aguardando pagamento ou já aceito)
      } catch (err) {
        console.error('[PAGAMENTO] Erro ao checar contratos do tomador:', err);
        return NextResponse.json(
          { error: 'Erro ao processar solicitação de pagamento' },
          { status: 500 }
        );
      }
    }

    // Verificar se já existe pagamento pendente/recente para este tomador
    try {
      const pagamentoExistente = await query(
        `SELECT id, status FROM pagamentos 
         WHERE (entidade_id = $1 OR clinica_id = $1) 
         ORDER BY criado_em DESC LIMIT 1`,
        [finalTomadorId]
      );

      if (pagamentoExistente.rows.length > 0) {
        return NextResponse.json(
          {
            success: true,
            pagamento_existente: true,
            pagamento_id: pagamentoExistente.rows[0].id,
            status: pagamentoExistente.rows[0].status,
          },
          { status: 200 }
        );
      }
    } catch (err) {
      // Se ocorrer erro ao checar pagamentos, continuar — validação de contrato será aplicada em seguida
      console.warn('[PAGAMENTO] Erro ao checar pagamento existente:', err);
    }

    // Exigir contrato aceito (removendo suporte ao fluxo legado)
    // Se um contrato específico foi fornecido, valida-lo; caso contrário, buscar
    // um contrato aceito associado ao tomador.
    let contratoIdValido: number | null = null;
    if (contratoIdParam) {
      const contratoRow = await query(
        `SELECT id, aceito FROM contratos WHERE id = $1 AND tomador_id = $2`,
        [contratoIdParam, finalTomadorId]
      );
      if (contratoRow.rows.length === 0 || !contratoRow.rows[0].aceito) {
        return NextResponse.json(
          { error: 'Contrato deve ser aceito antes do pagamento' },
          { status: 400 }
        );
      }
      contratoIdValido = contratoRow.rows[0].id;
    } else {
      try {
        const contratoRow = await query(
          `SELECT id FROM contratos WHERE tomador_id = $1 AND aceito = true LIMIT 1`,
          [finalTomadorId]
        );
        if (contratoRow.rows.length === 0) {
          return NextResponse.json(
            { error: 'Contrato deve ser aceito antes do pagamento' },
            { status: 400 }
          );
        }
        contratoIdValido = contratoRow.rows[0].id;
      } catch (err: any) {
        // Se a tabela contratos não existir ou ocorrer erro de consulta, retornar mensagem amigável
        if (err && err.code === '42P01') {
          return NextResponse.json(
            { error: 'Contrato deve ser aceito antes do pagamento' },
            { status: 400 }
          );
        }
        console.error('Erro ao validar contrato aceito:', err);
        return NextResponse.json(
          { error: 'Erro ao processar solicitação de pagamento' },
          { status: 500 }
        );
      }
    }

    // Usar dados fornecidos ou calcular baseado no plano
    const finalPlanoId = plano_id || tomador.plano_id;
    const finalNumeroFuncionarios =
      numero_funcionarios || tomador.numero_funcionarios || 1;
    let finalValorTotal = valor_total;

    if (!finalValorTotal) {
      // Preferir valor_total já calculado no tomador quando disponível
      if (tomador.valor_total) {
        finalValorTotal = tomador.valor_total;
      } else if (tomador.plano_tipo === 'fixo') {
        finalValorTotal = 20.0 * finalNumeroFuncionarios; // R$20 por funcionário para planos fixos
      } else {
        finalValorTotal =
          parseFloat(tomador.preco || '0') * finalNumeroFuncionarios;
      }
    }

    console.log(`[PAGAMENTO] Dados calculados:`, {
      tomador_id: finalTomadorId,
      tipo: tomador.tipo,
      plano_id: finalPlanoId,
      numero_funcionarios: finalNumeroFuncionarios,
      valor_total: finalValorTotal,
      plano_tipo: tomador.plano_tipo,
    });

    // Criar registro de pagamento (associado ao contrato aceito)
    // Usar entidade_id ou clinica_id conforme o tipo do tomador
    const columnName =
      tomador.tipo === 'entidade' ? 'entidade_id' : 'clinica_id';
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (
        ${columnName}, contrato_id, valor, status, metodo
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [finalTomadorId, contratoIdValido, finalValorTotal, 'pendente', 'avista']
    );

    const pagamentoId = pagamentoResult.rows[0].id;

    const valorPorFuncionario =
      tomador.plano_tipo === 'fixo'
        ? 20.0
        : finalValorTotal / finalNumeroFuncionarios;

    return NextResponse.json({
      success: true,
      pagamento_id: pagamentoId,
      tomador_id: finalTomadorId,
      tipo: tomador.tipo,
      valor: parseFloat(finalValorTotal),
      valor_plano: valorPorFuncionario,
      valor_unitario: valorPorFuncionario,
      numero_funcionarios: finalNumeroFuncionarios,
      plano_nome: tomador.plano_nome,
      tomador_nome: tomador.nome,
      message: 'Pagamento iniciado com sucesso',
    });
  } catch (error: any) {
    console.error('Erro ao iniciar pagamento:', error);
    console.error('Stack:', error?.stack);
    console.error('Message:', error?.message);
    return NextResponse.json(
      {
        error: 'Erro ao processar solicitação de pagamento',
        details: error?.message,
      },
      { status: 500 }
    );
  }
}
