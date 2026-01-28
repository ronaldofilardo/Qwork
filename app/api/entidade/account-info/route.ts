import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { calcularParcelas, getResumoPagamento } from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = getSession();
    if (!session || session.perfil !== 'gestor_entidade') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const contratanteId = session.contratante_id;
    if (!contratanteId) {
      return NextResponse.json(
        { error: 'Contratante não encontrado' },
        { status: 400 }
      );
    }

    // Buscar informações da entidade (contratantes)
    const entidadeQuery = `
      SELECT
        c.id,
        c.nome,
        c.cnpj,
        c.email,
        c.telefone,
        c.endereco,
        c.cidade,
        c.estado,
        c.criado_em
      FROM contratantes c
      WHERE c.id = $1 AND c.tipo = 'entidade'
      LIMIT 1
    `;

    const entidadeResult = await query(entidadeQuery, [contratanteId]);

    if (entidadeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Entidade não encontrada' },
        { status: 404 }
      );
    }

    const entidade = entidadeResult.rows[0];

    // Buscar contrato ativo (detectar colunas de preço disponíveis no esquema `planos`)
    const planColsRes = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'planos' AND column_name IN ('preco','valor_por_funcionario','valor_base','valor_fixo_anual')`
    );
    const availablePlanCols = planColsRes.rows.map((r: any) => r.column_name);

    const planSelect: string[] = [
      'p.nome as plano_nome',
      'p.tipo as plano_tipo',
    ];

    if (availablePlanCols.includes('preco')) {
      planSelect.push('p.preco as plano_preco');
    }
    if (availablePlanCols.includes('valor_por_funcionario')) {
      planSelect.push('p.valor_por_funcionario as plano_valor_por_funcionario');
    }
    if (availablePlanCols.includes('valor_base')) {
      planSelect.push('p.valor_base as plano_valor_base');
    }
    if (availablePlanCols.includes('valor_fixo_anual')) {
      planSelect.push('p.valor_fixo_anual as plano_valor_fixo_anual');
    }

    const contratoQuery = `
      SELECT
        co.id,
        co.plano_id,
        ${planSelect.join(',\n        ')},
        co.valor_total,
        co.numero_funcionarios,
        co.status,
        co.criado_em
      FROM contratos co
      JOIN planos p ON co.plano_id = p.id
      -- Comparar como texto para tolerar bancos com valores legados como 'ativo'
      WHERE co.contratante_id = $1 AND co.status::text IN ('ativo','aprovado','aguardando_pagamento')
      ORDER BY co.criado_em DESC
      LIMIT 1
    `;

    const contratoResult = await query(contratoQuery, [contratanteId]);
    let contrato =
      contratoResult.rows.length > 0 ? contratoResult.rows[0] : null;

    // Se não houver um contrato explícito (tabela `contratos`),
    // tentar obter a última entrada em `contratos_planos` como fallback
    if (!contrato) {
      try {
        // Fallback: buscar contratos_planos com seleção dinâmica de colunas de preço
        const planColsRes2 = await query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = 'planos' AND column_name IN ('preco','valor_por_funcionario','valor_base','valor_fixo_anual')`
        );
        const availablePlanCols2 = planColsRes2.rows.map(
          (r: any) => r.column_name
        );

        const planSelect2: string[] = [
          'p.nome as plano_nome',
          'p.tipo as plano_tipo',
        ];
        if (availablePlanCols2.includes('preco'))
          planSelect2.push('p.preco as plano_preco');
        if (availablePlanCols2.includes('valor_por_funcionario'))
          planSelect2.push(
            'p.valor_por_funcionario as plano_valor_por_funcionario'
          );
        if (availablePlanCols2.includes('valor_base'))
          planSelect2.push('p.valor_base as plano_valor_base');
        if (availablePlanCols2.includes('valor_fixo_anual'))
          planSelect2.push('p.valor_fixo_anual as plano_valor_fixo_anual');

        const contratoPlanoQuery = `
          SELECT
            cp.id,
            cp.plano_id,
            ${planSelect2.join(',\n            ')},
            cp.valor_pago as valor_total,
            COALESCE(cp.numero_funcionarios_estimado, cp.numero_funcionarios_atual) as numero_funcionarios,
            cp.created_at as criado_em
          FROM contratos_planos cp
          LEFT JOIN planos p ON cp.plano_id = p.id
          WHERE cp.contratante_id = $1
          ORDER BY cp.created_at DESC
          LIMIT 1
        `;

        const cpRes = await query(contratoPlanoQuery, [contratanteId]);
        if (cpRes.rows.length > 0) {
          contrato = cpRes.rows[0];
        }
      } catch (err) {
        console.error('Erro ao buscar contratos_planos (fallback):', err);
      }
    }

    // Buscar pagamentos do contratante (mais completos)
    const pagamentosQuery = `
      SELECT
        p.id,
        p.valor,
        p.status,
        p.numero_parcelas,
        p.metodo,
        p.data_pagamento,
        p.plataforma_nome,
        p.detalhes_parcelas,
        p.criado_em
      FROM pagamentos p
      WHERE p.contratante_id = $1
      ORDER BY p.criado_em DESC
      LIMIT 5
    `;

    const pagamentosResult = (await query(pagamentosQuery, [
      contratanteId,
    ])) || { rows: [] };
    const pagamentosRaw = pagamentosResult.rows || [];

    // Verificar se a tabela `recibos` existe via information_schema.columns
    // (mantém compatibilidade com mocks de teste que retornam column_name)
    let recibosExists = false;
    try {
      const recibosColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name IN ('criado_em')`
      );
      recibosExists =
        Array.isArray(recibosColsRes.rows) && recibosColsRes.rows.length > 0;
    } catch (err) {
      console.error(
        'Erro ao verificar existencia da tabela recibos (columns):',
        err
      );
      recibosExists = false;
    }

    const pagamentos = await Promise.all(
      pagamentosRaw.map(async (pag: any) => {
        let parcelas_json = null;
        try {
          if (pag.detalhes_parcelas) {
            parcelas_json =
              typeof pag.detalhes_parcelas === 'string'
                ? JSON.parse(pag.detalhes_parcelas)
                : pag.detalhes_parcelas;
          } else if (
            pag.numero_parcelas &&
            parseInt(pag.numero_parcelas) > 1 &&
            pag.valor &&
            pag.data_pagamento
          ) {
            const numero = parseInt(pag.numero_parcelas);
            parcelas_json = calcularParcelas({
              valorTotal: parseFloat(pag.valor),
              numeroParcelas: numero,
              dataInicial: new Date(pag.data_pagamento),
            });
          }
        } catch (err) {
          console.error('Erro ao calcular parcelas_json:', err);
        }

        // Gerar resumo das parcelas (valor pendente, statusGeral, etc.) quando possível
        let resumo: any = null;
        if (parcelas_json && Array.isArray(parcelas_json)) {
          resumo = getResumoPagamento(parcelas_json);
        } else {
          // Fallback: derivar do status do pagamento
          const valorNum = pag.valor ? parseFloat(pag.valor) : 0;
          resumo = {
            totalParcelas: pag.numero_parcelas
              ? parseInt(pag.numero_parcelas)
              : 1,
            parcelasPagas:
              pag.status === 'pago' &&
              (!pag.numero_parcelas || parseInt(pag.numero_parcelas) === 1)
                ? 1
                : 0,
            parcelasPendentes:
              pag.status === 'pago' &&
              (!pag.numero_parcelas || parseInt(pag.numero_parcelas) === 1)
                ? 0
                : 1,
            valorTotal: valorNum,
            valorPago: pag.status === 'pago' ? valorNum : 0,
            valorPendente: pag.status === 'pago' ? 0 : valorNum,
            statusGeral: pag.status === 'pago' ? 'quitado' : 'em_aberto',
          };
        }

        // Buscar recibo para este pagamento (se existir) — reusar lógica anterior
        let recibo = null;
        if (recibosExists) {
          try {
            const reciboRes = await query(
              `SELECT id, numero_recibo FROM recibos WHERE pagamento_id = $1 ORDER BY criado_em DESC LIMIT 1`,
              [pag.id]
            );
            if (reciboRes.rows.length > 0) {
              const r = reciboRes.rows[0];
              recibo = { id: r.id, numero_recibo: r.numero_recibo };
            }
          } catch (err) {
            console.error('Erro ao buscar recibo:', err);
          }
        } else {
          // A tabela `recibos` não existe no esquema atual — ignorar e seguir sem recibo
          recibo = null;
        }

        return {
          id: pag.id,
          valor: pag.valor ? parseFloat(pag.valor) : null,
          status: pag.status,
          numero_parcelas: pag.numero_parcelas,
          metodo: pag.metodo,
          data_pagamento: pag.data_pagamento,
          plataforma: pag.plataforma_nome,
          detalhes_parcelas: pag.detalhes_parcelas,
          parcelas_json,
          resumo,
          recibo,
          criado_em: pag.criado_em,
        };
      })
    );

    // Determinar vigência com base no último pagamento confirmado: inicio = data_pagamento, fim = inicio + 364 dias
    let vigencia_inicio: string | null = null;
    let vigencia_fim: string | null = null;

    try {
      const pagosConfirmados = pagamentos
        .filter((p: any) => p.status === 'pago' && p.data_pagamento)
        .sort(
          (a: any, b: any) =>
            new Date(b.data_pagamento).getTime() -
            new Date(a.data_pagamento).getTime()
        );

      if (pagosConfirmados.length > 0) {
        vigencia_inicio = pagosConfirmados[0].data_pagamento;
        const d = new Date(vigencia_inicio);
        const fim = new Date(d);
        fim.setDate(fim.getDate() + 364);
        vigencia_fim = fim.toISOString();
      } else if (contrato && contrato.criado_em) {
        // fallback: usar data de criação do contrato se não houver pagamento
        vigencia_inicio = contrato.criado_em;
        const d = new Date(vigencia_inicio);
        const fim = new Date(d);
        fim.setDate(fim.getDate() + 364);
        vigencia_fim = fim.toISOString();
      }
    } catch (err) {
      console.error('Erro ao determinar vigência:', err);
    }

    // Determinar um valor unitário do plano quando possível (priorizar campo do plano)
    let plano_preco_unitario = null;
    if (contrato) {
      plano_preco_unitario =
        contrato.plano_valor_por_funcionario ||
        contrato.plano_valor_base ||
        contrato.plano_preco ||
        contrato.plano_valor_fixo_anual ||
        null;
    }

    // Calcular resumo financeiro do contrato (somar valorPago dos pagamentos)
    let totalPagoAcross = 0;
    for (const p of pagamentos) {
      if (p.resumo && typeof p.resumo.valorPago === 'number') {
        totalPagoAcross += p.resumo.valorPago;
      } else if (p.status === 'pago' && typeof p.valor === 'number') {
        totalPagoAcross += p.valor;
      }
    }

    const contratoValorTotal =
      contrato && contrato.valor_total
        ? parseFloat(contrato.valor_total)
        : null;
    const restanteCalc =
      contratoValorTotal != null
        ? Math.max(contratoValorTotal - totalPagoAcross, 0)
        : null;
    const percentualPago =
      contratoValorTotal != null && contratoValorTotal > 0
        ? Math.round((totalPagoAcross / contratoValorTotal) * 10000) / 100
        : null;

    // FONTE DA VERDADE: Status derivado dos pagamentos reais (não de contrato.status)
    // Se valor pago >= valor total do contrato → quitado, senão → em_aberto
    const pagamento_status_derivado =
      contratoValorTotal != null && totalPagoAcross >= contratoValorTotal
        ? 'quitado'
        : 'em_aberto';

    // Status do contrato para compatibilidade (mas UI deve usar pagamento_status)
    const contrato_status_display =
      pagamento_status_derivado === 'quitado'
        ? 'ativo'
        : contrato?.status || 'aguardando_pagamento';

    const accountInfo = {
      // Informações cadastradas
      nome: entidade.nome,
      cnpj: entidade.cnpj,
      email: entidade.email,
      telefone: entidade.telefone,
      endereco: entidade.endereco,
      cidade: entidade.cidade,
      estado: entidade.estado,
      criado_em: entidade.criado_em,

      // Plano contratado (enriquecido)
      contrato: contrato
        ? {
            id: contrato.id,
            plano_id: contrato.plano_id,
            plano_nome: contrato.plano_nome,
            plano_tipo: contrato.plano_tipo,
            plano_preco_unitario: plano_preco_unitario
              ? parseFloat(plano_preco_unitario)
              : null,
            valor_total: contrato.valor_total
              ? parseFloat(contrato.valor_total)
              : null,
            numero_funcionarios: contrato.numero_funcionarios,
            status: contrato_status_display, // Status ajustado baseado em pagamentos
            criado_em: contrato.criado_em,
            vigencia_inicio: vigencia_inicio,
            vigencia_fim: vigencia_fim,
            // FONTE DA VERDADE: Resumo financeiro derivado dos pagamentos
            pagamento_status: pagamento_status_derivado,
            pagamento_resumo: {
              totalPago: Math.round(totalPagoAcross * 100) / 100,
              restante:
                restanteCalc != null
                  ? Math.round(restanteCalc * 100) / 100
                  : null,
              percentual: percentualPago,
            },
          }
        : null,

      // Pagamentos (enriquecidos)
      pagamentos,
    };

    return NextResponse.json(accountInfo);
  } catch (error) {
    console.error('Erro ao buscar informações da conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
