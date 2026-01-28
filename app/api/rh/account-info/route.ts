import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { calcularParcelas, getResumoPagamento } from '@/lib/parcelas-helper';

export const dynamic = 'force-dynamic';

export const GET = async () => {
  try {
    // EXCEÇÃO: Admin pode acessar esta rota para auditorias financeiras
    // (consulta informações de contrato/parcelas, não operações de clínica)
    const session = await requireRole(['rh', 'admin']);

    // Determinar clinica_id: preferir sessão, senão buscar pelo CPF
    let clinicaId = session.clinica_id;

    if (!clinicaId) {
      const res = await query(
        'SELECT clinica_id, contratante_id FROM funcionarios WHERE cpf = $1 AND ativo = true LIMIT 1',
        [session.cpf]
      );

      if (res.rows.length > 0) {
        // Prefer clinica_id se existir
        clinicaId = res.rows[0].clinica_id || null;
        // Se clinica_id não existir, verificar se o funcionário está vinculado a um contratante
        if (!clinicaId && res.rows[0].contratante_id) {
          // Verificar se o contratante vinculado é do tipo 'clinica'
          const contratanteRow = await query(
            "SELECT id FROM contratantes WHERE id = $1 AND tipo = 'clinica'",
            [res.rows[0].contratante_id]
          );
          if (contratanteRow.rows.length > 0)
            clinicaId = contratanteRow.rows[0].id;
        }
      }
    }

    // Fallback: se a sessão possuir contratante_id (usuário criado via fluxo de cadastro)
    // e o contratante for do tipo 'clinica', usá-lo como clinicaId
    if (!clinicaId && (session as any).contratante_id) {
      const contratanteCheck = await query(
        "SELECT id FROM contratantes WHERE id = $1 AND tipo = 'clinica'",
        [(session as any).contratante_id]
      );
      if (contratanteCheck.rows.length > 0) {
        clinicaId = contratanteCheck.rows[0].id;
      }
    }

    if (!clinicaId) {
      return NextResponse.json(
        { error: 'Você não está vinculado a uma clínica' },
        { status: 403 }
      );
    }

    // Buscar informações da clínica (contratante do tipo 'clinica')
    const clinicaQuery = (await query(
      `
      SELECT
        c.id,
        c.nome,
        c.cnpj,
        c.email,
        c.telefone,
        c.endereco,
        c.cidade,
        c.estado,
        c.responsavel_nome,
        c.criado_em
      FROM contratantes c
      WHERE c.id = $1 AND c.tipo = 'clinica'
      `,
      [clinicaId]
    )) || { rows: [] };

    let clinica;
    if (clinicaQuery.rows.length === 0) {
      // Possível que `clinicaId` seja na verdade um id da tabela `clinicas` (diferente de `contratantes`).
      // Tentar mapear: SELECT contratante_id FROM clinicas WHERE id = $1
      const clinicasMap = (await query(
        `SELECT contratante_id FROM clinicas WHERE id = $1 LIMIT 1`,
        [clinicaId]
      )) || { rows: [] };

      if (clinicasMap.rows.length > 0 && clinicasMap.rows[0].contratante_id) {
        const mappedContratanteId = clinicasMap.rows[0].contratante_id;

        // Rebuscar contratante (contratante_id -> contratantes)
        const contratanteQuery = (await query(
          `SELECT id, nome, cnpj, email, telefone, endereco, cidade, estado, responsavel_nome, criado_em, status, aprovado_em
           FROM contratantes WHERE id = $1 AND tipo = 'clinica'`,
          [mappedContratanteId]
        )) || { rows: [] };

        if (contratanteQuery.rows.length > 0) {
          clinica = contratanteQuery.rows[0];
          // atualizar clinicaId para o contratante real
          clinicaId = clinica.id;
        }
      }

      // Se ainda não encontrou, retornar fallback genérico
      if (!clinica) {
        clinica = {
          id: clinicaId,
          nome: `Clínica não cadastrada (ID ${clinicaId})`,
          cnpj: null,
          email: null,
          telefone: null,
          endereco: null,
        };
      }
    } else {
      clinica = clinicaQuery.rows[0];
    }

    // Buscar gestores RH da clínica — garantir que o usuário logado seja listado
    const gestoresQuery = (await query(
      `
      SELECT 
        id,
        cpf,
        nome,
        email,
        perfil
      FROM funcionarios
      WHERE (
        clinica_id = $1 AND ativo = true AND perfil = 'rh'
      )
      OR (
        cpf = $2 AND ativo = true
      )
      ORDER BY nome
      `,
      [clinica.id, session.cpf]
    )) || { rows: [] };

    // Buscar snapshot de cadastro (primeiro snapshot inserido - dados originais do cadastro)
    let cadastroOriginal = null;
    let cadastroOriginalCreatedAt = null;
    try {
      const snColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'contratantes_snapshots' AND column_name IN ('payload','criado_em')`
      );
      const snapsExists =
        Array.isArray(snColsRes.rows) && snColsRes.rows.length > 0;
      if (snapsExists) {
        const snapshotRes = (await query(
          `SELECT payload, criado_em FROM contratantes_snapshots WHERE contratante_id = $1 ORDER BY criado_em ASC LIMIT 1`,
          [clinica.id]
        )) || { rows: [] };
        if (snapshotRes.rows.length > 0) {
          cadastroOriginal = snapshotRes.rows[0].payload;
          cadastroOriginalCreatedAt = snapshotRes.rows[0].criado_em;
        }
      } else {
        // tabela de snapshots ausente no esquema atual — seguir sem snapshot
        cadastroOriginal = null;
        cadastroOriginalCreatedAt = null;
      }
    } catch (err) {
      console.error('Erro ao verificar/consultar contratantes_snapshots:', err);
      cadastroOriginal = null;
      cadastroOriginalCreatedAt = null;
    }

    // Buscar plano ativo da clínica (se existir)
    let plano = null;
    try {
      // Seleção dinâmica: só selecionar colunas que existem em `contratos_planos` para evitar erros
      const cpColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'contratos_planos' AND column_name IN ('numero_funcionarios_atual','valor_pago','tipo_pagamento','modalidade_pagamento','numero_parcelas','status','data_contratacao','data_fim_vigencia','plano_id','created_at')`
      );
      console.debug(
        'contratos_planos cols:',
        cpColsRes.rows.map((r: any) => r.column_name)
      );
      const cpCols = cpColsRes.rows.map((r: any) => r.column_name);

      const cpSelect: string[] = [];
      if (cpCols.includes('numero_funcionarios_estimado'))
        cpSelect.push('cp.numero_funcionarios_estimado');
      if (cpCols.includes('numero_funcionarios_atual'))
        cpSelect.push('cp.numero_funcionarios_atual');
      if (cpCols.includes('valor_pago')) cpSelect.push('cp.valor_pago');
      if (cpCols.includes('tipo_pagamento')) cpSelect.push('cp.tipo_pagamento');
      if (cpCols.includes('modalidade_pagamento'))
        cpSelect.push('cp.modalidade_pagamento');
      if (cpCols.includes('numero_parcelas'))
        cpSelect.push('cp.numero_parcelas');
      if (cpCols.includes('status')) cpSelect.push('cp.status');
      if (cpCols.includes('data_contratacao'))
        cpSelect.push('cp.data_contratacao');
      if (cpCols.includes('data_fim_vigencia'))
        cpSelect.push('cp.data_fim_vigencia');
      if (cpCols.includes('plano_id')) cpSelect.push('cp.plano_id');

      // Columns for plan info are stable (p.nome, p.tipo, p.descricao)
      const hasStatus = cpCols.includes('status');
      const planoQuery = `
        SELECT
          ${cpSelect.length > 0 ? cpSelect.join(',\n          ') + ',' : ''}
          p.nome as plano_nome,
          p.tipo as plano_tipo,
          p.descricao as plano_descricao,
          c.id as contrato_numero
        FROM contratos_planos cp
        LEFT JOIN planos p ON cp.plano_id = p.id
        LEFT JOIN contratos c ON c.contratante_id = COALESCE(cp.contratante_id, cp.clinica_id)
        WHERE ${hasStatus ? "cp.status::text IN ('ativo','aprovado','aguardando_pagamento') AND" : ''}
          ($1 = cp.clinica_id OR $1 = cp.contratante_id)
        ORDER BY cp.created_at DESC
        LIMIT 1`;

      const planoRes = (await query(planoQuery, [clinica.id])) || { rows: [] };
      plano = planoRes.rows.length > 0 ? planoRes.rows[0] : null;
    } catch (err) {
      console.error('Erro ao buscar plano (contratos_planos):', err);
      plano = null;
    }

    // Fallback: buscar em contratos (quando o plano foi registrado na tabela de contratos)
    if (!plano) {
      try {
        const contratoQuery = `
          SELECT
            c.id,
            c.plano_id,
            p.nome as plano_nome,
            p.tipo as plano_tipo,
            c.valor_total,
            c.numero_funcionarios,
            c.status,
            c.criado_em
          FROM contratos c
          LEFT JOIN planos p ON c.plano_id = p.id
          WHERE c.contratante_id = $1 AND c.status::text IN ('ativo','aprovado','aguardando_pagamento')
          ORDER BY c.criado_em DESC
          LIMIT 1`;

        const contratoRes = (await query(contratoQuery, [clinica.id])) || {
          rows: [],
        };
        if (contratoRes.rows.length > 0) {
          const c = contratoRes.rows[0];
          plano = {
            numero_funcionarios_atual: c.numero_funcionarios,
            valor_pago: c.valor_total,
            status: c.status,
            contrato_numero: c.id,
            plano_nome: c.plano_nome,
            plano_tipo: c.plano_tipo,
            plano_descricao: null,
          };
        }
      } catch (err) {
        console.error('Erro ao buscar contrato fallback:', err);
      }
    }

    let valorPorFuncionario = null;
    if (plano && plano.valor_pago != null && plano.numero_funcionarios_atual) {
      try {
        valorPorFuncionario =
          Number(plano.valor_pago) / Number(plano.numero_funcionarios_atual);
      } catch {
        valorPorFuncionario = null;
      }
    }

    // Buscar pagamentos da clínica
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

    const pagamentosResult = (await query(pagamentosQuery, [clinica.id])) || {
      rows: [],
    };
    const pagamentosRaw = pagamentosResult.rows || [];

    // Enriquecer pagamentos com recibos, parcelas e resumo
    const pagamentos = await Promise.all(
      pagamentosRaw.map(async (pag: any) => {
        let recibo = null;
        try {
          // Verificar se a tabela `recibos` existe para evitar erro SQL
          const recibosColsRes = await query(
            `SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name IN ('criado_em','numero_recibo')`
          );
          const recibosExists =
            Array.isArray(recibosColsRes.rows) &&
            recibosColsRes.rows.length > 0;
          if (recibosExists) {
            const reciboRes = await query(
              `SELECT id, numero_recibo FROM recibos WHERE pagamento_id = $1 ORDER BY criado_em DESC LIMIT 1`,
              [pag.id]
            );
            if (reciboRes.rows.length > 0) {
              const r = reciboRes.rows[0];
              recibo = { id: r.id, numero_recibo: r.numero_recibo };
            }
          } else {
            recibo = null;
          }
        } catch (err) {
          console.error('Erro ao verificar/consultar recibos (RH):', err);
        }

        // Calcular parcelas_json quando aplicável (detalhes_parcelas ou calculo a partir de numero_parcelas)
        let parcelas_json: any = null;
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
            parcelas_json = calcularParcelas({
              valorTotal: parseFloat(pag.valor),
              numeroParcelas: parseInt(pag.numero_parcelas),
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

    // Determinar status geral do pagamento do plano (se houver parcelas em aberto)
    let pagamento_status_overall = 'quitado';
    // valor_pendente_total mantido para compatibilidade futura
    let _valor_pendente_total = 0;
    // Somar valores pagos (preferir resumo de parcelas quando disponível)
    let totalPagoAcross = 0;

    for (const p of pagamentos) {
      if (
        p.resumo &&
        p.resumo.statusGeral &&
        p.resumo.statusGeral !== 'quitado'
      ) {
        pagamento_status_overall = 'em_aberto';
      }
      if (p.resumo && typeof p.resumo.valorPendente === 'number') {
        _valor_pendente_total += p.resumo.valorPendente;
      }

      if (p.resumo && typeof p.resumo.valorPago === 'number') {
        totalPagoAcross += p.resumo.valorPago;
      } else if (p.status === 'pago' && typeof p.valor === 'number') {
        totalPagoAcross += p.valor;
      }
    }

    // Determinar valor total do plano (usar valores disponíveis no objeto `plano`)
    const planoValorTotal = plano
      ? (plano.valor_total ?? plano.valor_pago ?? null)
      : null;

    const restanteCalc =
      planoValorTotal != null
        ? Math.max(planoValorTotal - totalPagoAcross, 0)
        : null;

    const percentualPago =
      planoValorTotal != null && planoValorTotal > 0
        ? Math.round((totalPagoAcross / planoValorTotal) * 10000) / 100
        : null;

    // FONTE DA VERDADE: Status derivado dos pagamentos reais
    // Quando existe valor total do plano, definir 'quitado' somente se totalPagoAcross >= planoValorTotal,
    // caso contrário 'em_aberto'. Se não houver valor_total, usar o status agregado calculado anteriormente.
    const pagamento_status_derivado =
      planoValorTotal != null
        ? totalPagoAcross >= planoValorTotal
          ? 'quitado'
          : 'em_aberto'
        : pagamento_status_overall;

    // Ajustar status do plano para refletir pagamentos (mas UI deve usar pagamento_status)
    const plano_status_display =
      pagamento_status_derivado === 'quitado'
        ? 'ativo'
        : plano?.status || 'aguardando_pagamento';

    return NextResponse.json({
      clinica: {
        id: clinica.id,
        nome: clinica.nome,
        cnpj: clinica.cnpj,
        email: clinica.email,
        telefone: clinica.telefone,
        endereco: clinica.endereco,
        cidade: clinica.cidade || null,
        estado: clinica.estado || null,
        responsavel_nome: clinica.responsavel_nome || null,
        criado_em: clinica.criado_em || null,
        cadastro_original: cadastroOriginal,
        cadastro_original_created_at: cadastroOriginalCreatedAt,
        plano: plano
          ? {
              numero_funcionarios_estimado: plano.numero_funcionarios_estimado,
              numero_funcionarios_atual: plano.numero_funcionarios_atual,
              valor_pago: plano.valor_pago,
              valor_total: planoValorTotal,
              tipo_pagamento: plano.tipo_pagamento,
              modalidade_pagamento: plano.modalidade_pagamento,
              numero_parcelas: plano.numero_parcelas,
              status: plano_status_display, // Status ajustado baseado em pagamentos
              data_contratacao: plano.data_contratacao,
              data_fim_vigencia: plano.data_fim_vigencia,
              contrato_numero: plano.contrato_numero || null,
              valor_por_funcionario: valorPorFuncionario,
              plano_nome: plano.plano_nome,
              plano_tipo: plano.plano_tipo,
              plano_descricao: plano.plano_descricao || null,
              pagamento_status: pagamento_status_derivado, // FONTE DA VERDADE
              valor_pendente: restanteCalc,
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
      },
      gestores: gestoresQuery.rows.map((gestor) => ({
        id: gestor.id,
        cpf: gestor.cpf,
        nome: gestor.nome,
        email: gestor.email,
        perfil: gestor.perfil,
      })),
      pagamentos,
    });
  } catch (error) {
    console.error('Erro ao buscar informações da conta:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
};
