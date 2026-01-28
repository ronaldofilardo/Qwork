import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      contratante_id,
      contrato_id,
      _contrato_id,
      plano_id,
      numero_funcionarios,
      valor_total,
      payment_link_token,
    } = body;

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
    if (!contratante_id) {
      return NextResponse.json(
        { error: 'ID do contratante é obrigatório' },
        { status: 400 }
      );
    }

    // Se contrato_id não foi fornecido, vamos tentar encontrar um contrato aceito associado ao contratante
    if (!contratoIdParam) {
      console.log(
        `[PAGAMENTO] Nenhum contrato_id informado para contratante ${contratante_id}, buscando contrato aceito associado`
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

    // Buscar dados do contratante
    // Se um contrato específico foi informado, buscar juntando a tabela contratos para garantir
    // que o contrato pertence ao contratante (e permitir passar contrato_id como $2 na query)
    let contratanteResult;
    if (contratoIdParam) {
      contratanteResult = await query(
        `SELECT c.id, c.nome, c.plano_id, c.status, COALESCE(c.numero_funcionarios_estimado, 1) as numero_funcionarios, 
                p.nome as plano_nome, p.tipo as plano_tipo, p.preco, ctr.id as contrato_id, ctr.aceito as contrato_aceito, ctr.valor_total as contrato_valor_total
         FROM contratantes c
         LEFT JOIN planos p ON c.plano_id = p.id
         JOIN contratos ctr ON ctr.contratante_id = c.id AND ctr.id = $2
         WHERE c.id = $1`,
        [contratante_id, contratoIdParam]
      );
    } else {
      contratanteResult = await query(
        `SELECT c.id, c.nome, c.plano_id, c.status, COALESCE(c.numero_funcionarios_estimado, 1) as numero_funcionarios, 
                p.nome as plano_nome, p.tipo as plano_tipo, p.preco
         FROM contratantes c
         LEFT JOIN planos p ON c.plano_id = p.id
         WHERE c.id = $1`,
        [contratante_id]
      );
    }

    if (contratanteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 404 }
      );
    }

    const contratante = contratanteResult.rows[0];

    // Se a consulta retornou valor_total do contrato, mapear para compatibilidade
    if (contratante.contrato_valor_total) {
      contratante.valor_total = contratante.contrato_valor_total;
    }

    // Verificar se o contratante tem status válido para iniciar pagamento
    // Normalmente exigimos que o contratante esteja em 'aguardando_pagamento'.
    // Para casos de plano personalizado, um contrato pode ter sido criado com
    // status 'aguardando_pagamento' mesmo que o contratante ainda esteja 'pendente'.
    // Neste caso, permitimos iniciar o pagamento quando houver um contrato
    // com status 'aguardando_pagamento' ou com `aceito = true`.
    if (contratante.status !== 'aguardando_pagamento') {
      // checar se existe um contrato que justifique iniciar o pagamento
      try {
        const contratoCheck = await query(
          `SELECT id, aceito, status FROM contratos WHERE contratante_id = $1 ORDER BY criado_em DESC LIMIT 1`,
          [contratante_id]
        );
        if (contratoCheck.rows.length === 0) {
          console.log(
            `[PAGAMENTO] Status inválido para contratante ${contratante_id}: ${contratante.status}`
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
            `[PAGAMENTO] Status inválido para contratante ${contratante_id}: ${contratante.status} e contrato recente não permite pagamento (status=${lastContrato.status}, aceito=${lastContrato.aceito})`
          );
          return NextResponse.json(
            { error: 'Status inválido para pagamento' },
            { status: 400 }
          );
        }
        // caso contrário, permitimos continuar (contrato está aguardando pagamento ou já aceito)
      } catch (err) {
        console.error(
          '[PAGAMENTO] Erro ao checar contratos do contratante:',
          err
        );
        return NextResponse.json(
          { error: 'Erro ao processar solicitação de pagamento' },
          { status: 500 }
        );
      }
    }

    // Verificar se já existe pagamento pendente/recente para este contratante
    try {
      const pagamentoExistente = await query(
        `SELECT id, status FROM pagamentos WHERE contratante_id = $1 ORDER BY criado_em DESC LIMIT 1`,
        [contratante_id]
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
    // um contrato aceito associado ao contratante.
    let contratoIdValido: number | null = null;
    if (contratoIdParam) {
      const contratoRow = await query(
        `SELECT id, aceito FROM contratos WHERE id = $1 AND contratante_id = $2`,
        [contratoIdParam, contratante_id]
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
          `SELECT id FROM contratos WHERE contratante_id = $1 AND aceito = true LIMIT 1`,
          [contratante_id]
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
    const finalPlanoId = plano_id || contratante.plano_id;
    const finalNumeroFuncionarios =
      numero_funcionarios || contratante.numero_funcionarios || 1;
    let finalValorTotal = valor_total;

    if (!finalValorTotal) {
      // Preferir valor_total já calculado no contratante quando disponível
      if (contratante.valor_total) {
        finalValorTotal = contratante.valor_total;
      } else if (contratante.plano_tipo === 'fixo') {
        finalValorTotal = 20.0 * finalNumeroFuncionarios; // R$20 por funcionário para planos fixos
      } else {
        finalValorTotal =
          parseFloat(contratante.preco || '0') * finalNumeroFuncionarios;
      }
    }

    console.log(`[PAGAMENTO] Dados calculados:`, {
      contratante_id,
      plano_id: finalPlanoId,
      numero_funcionarios: finalNumeroFuncionarios,
      valor_total: finalValorTotal,
      plano_tipo: contratante.plano_tipo,
    });

    // Criar registro de pagamento (associado ao contrato aceito)
    const pagamentoResult = await query(
      `INSERT INTO pagamentos (
        contratante_id, contrato_id, valor, status, metodo
      ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [contratante_id, contratoIdValido, finalValorTotal, 'pendente', 'avista']
    );

    const pagamentoId = pagamentoResult.rows[0].id;

    const valorPorFuncionario =
      contratante.plano_tipo === 'fixo'
        ? 20.0
        : finalValorTotal / finalNumeroFuncionarios;

    return NextResponse.json({
      success: true,
      pagamento_id: pagamentoId,
      valor: parseFloat(finalValorTotal),
      valor_plano: valorPorFuncionario,
      valor_unitario: valorPorFuncionario,
      numero_funcionarios: finalNumeroFuncionarios,
      plano_nome: contratante.plano_nome,
      contratante_nome: contratante.nome,
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
