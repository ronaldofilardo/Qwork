const { query } = require('../../lib/db');
const {
  calcularParcelas,
  getResumoPagamento,
} = require('../../lib/parcelas-helper');

async function run(cnpj = '63403935000139') {
  try {
    console.log('[INFO] Buscando tomador por CNPJ:', cnpj);
    const tomadorRes = await query(
      'SELECT id, nome, cnpj, email, telefone, endereco, cidade, estado, responsavel_nome, criado_em FROM tomadors WHERE cnpj = $1 LIMIT 1',
      [cnpj]
    );
    if (!tomadorRes.rows.length) {
      console.log('Nenhum tomador encontrado para esse CNPJ');
      return;
    }
    const tomador = tomadorRes.rows[0];
    const tomadorId = tomador.id;
    console.log('[INFO] tomador_id =', tomadorId);

    // buscar contratos_planos
    const planosRes = await query(
      `SELECT cp.*, p.nome as plano_nome, p.tipo as plano_tipo, c.id as contrato_numero
       FROM contratos_planos cp
       LEFT JOIN planos p on cp.plano_id = p.id
       LEFT JOIN contratos c ON c.tomador_id = COALESCE(cp.tomador_id, cp.clinica_id)
       WHERE ($1 = cp.clinica_id OR $1 = cp.tomador_id)
       ORDER BY cp.created_at DESC LIMIT 1`,
      [tomadorId]
    );

    let plano = null;
    if (planosRes.rows.length > 0) {
      plano = planosRes.rows[0];
      console.log('[INFO] encontrados registros em contratos_planos');
    } else {
      // fallback contratos
      const contratoRes = await query(
        `SELECT c.id, c.plano_id, p.nome as plano_nome, p.tipo as plano_tipo, c.valor_total, c.numero_funcionarios, c.status, c.criado_em
         FROM contratos c
         LEFT JOIN planos p ON c.plano_id = p.id
         WHERE c.tomador_id = $1 AND c.status::text IN ('ativo','aprovado','aguardando_pagamento')
         ORDER BY c.criado_em DESC LIMIT 1`,
        [tomadorId]
      );
      if (contratoRes.rows.length > 0) {
        const c = contratoRes.rows[0];
        plano = {
          numero_funcionarios_atual: c.numero_funcionarios,
          valor_pago: c.valor_total,
          valor_total: c.valor_total,
          status: c.status,
          contrato_numero: c.id,
          plano_nome: c.plano_nome,
          plano_tipo: c.plano_tipo,
        };
        console.log('[INFO] fallback em contratos encontrado');
      }
    }

    // pagamentos
    const pagamentosRes = await query(
      `SELECT id, valor, status, numero_parcelas, metodo, data_pagamento, plataforma_nome, detalhes_parcelas, criado_em
       FROM pagamentos WHERE tomador_id = $1 ORDER BY criado_em DESC`,
      [tomadorId]
    );

    const pagamentos = [];

    for (const pag of pagamentosRes.rows) {
      let parcelas_json = null;
      if (pag.detalhes_parcelas) {
        try {
          parcelas_json =
            typeof pag.detalhes_parcelas === 'string'
              ? JSON.parse(pag.detalhes_parcelas)
              : pag.detalhes_parcelas;
        } catch (err) {
          console.error('Erro parseando detalhes_parcelas', err);
        }
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

      let resumo = null;
      if (parcelas_json && Array.isArray(parcelas_json)) {
        resumo = getResumoPagamento(parcelas_json);
      } else {
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

      pagamentos.push({
        id: pag.id,
        valor: pag.valor ? parseFloat(pag.valor) : null,
        status: pag.status,
        numero_parcelas: pag.numero_parcelas
          ? parseInt(pag.numero_parcelas)
          : null,
        metodo: pag.metodo,
        data_pagamento: pag.data_pagamento,
        plataforma: pag.plataforma_nome,
        detalhes_parcelas: pag.detalhes_parcelas,
        parcelas_json,
        resumo,
        criado_em: pag.criado_em,
      });
    }

    // Compute pagamento_resumo aggregate
    let totalPagoAcross = 0;
    let totalParcelas = 0;
    let parcelasPagas = 0;
    let parcelasPendentes = 0;

    for (const p of pagamentos) {
      if (p.resumo && typeof p.resumo.valorPago === 'number')
        totalPagoAcross += p.resumo.valorPago;
      if (p.resumo && typeof p.resumo.totalParcelas === 'number')
        totalParcelas = Math.max(totalParcelas, p.resumo.totalParcelas);
      if (p.resumo && typeof p.resumo.parcelasPagas === 'number')
        parcelasPagas += p.resumo.parcelasPagas;
      if (p.resumo && typeof p.resumo.parcelasPendentes === 'number')
        parcelasPendentes += p.resumo.parcelasPendentes;
    }

    const pagamento_resumo = {
      totalPago: Math.round(totalPagoAcross * 100) / 100,
      restante:
        plano && typeof plano.valor_total === 'number'
          ? Math.round((plano.valor_total - totalPagoAcross) * 100) / 100
          : null,
      percentual:
        plano && plano.valor_total
          ? Math.round((totalPagoAcross / plano.valor_total) * 10000) / 100
          : null,
      totalParcelas: totalParcelas || null,
      parcelasPagas,
      parcelasPendentes,
    };

    console.log('--- Resultado (simulado) ---');
    console.log(
      JSON.stringify({ tomador, plano, pagamentos, pagamento_resumo }, null, 2)
    );
  } catch (err) {
    console.error('Erro', err);
  } finally {
    process.exit(0);
  }
}

const cnpj = process.argv[2] || '63403935000139';
run(cnpj);
