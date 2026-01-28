/**
 * API para gerar recibos pós-pagamento
 * Endpoint: POST /api/recibo/gerar
 *
 * Responsável por:
 * - Gerar recibo financeiro após confirmação de pagamento
 * - Calcular vigência (data_pagamento + 364 dias)
 * - Formatar informações de pagamento (parcelas, vencimentos)
 * - Salvar recibo no banco de dados
 * - (Futuro) Gerar PDF do recibo
 */

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface GerarReciboRequest {
  contrato_id?: number;
  pagamento_id: number;
  parcela_numero?: number;
  tipo_recibo?: 'contratacao' | 'parcela';
  emitido_por_cpf?: string;
}

// Funções auxiliares

function formatarValor(valor: number): string {
  return valor
    .toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
    .replace('R$', 'R$')
    .replace(/\s+/, ' '); // Remove espaço extra
}

function determinarFormaPagamento(
  metodo: string,
  numeroParcelas: number
): string {
  if (numeroParcelas > 1) {
    return 'parcelado';
  }

  const mapeamento: Record<string, string> = {
    pix: 'pix',
    cartao: 'cartao',
    boleto: 'boleto',
    transferencia: 'transferencia',
    avista: 'avista',
  };

  return mapeamento[metodo] || 'avista';
}

function gerarDescricaoPagamento(
  metodo: string,
  numeroParcelas: number,
  valorTotal: number,
  dataInicio: Date
): string {
  // Usar a função auxiliar global formatarValor

  if (numeroParcelas === 1) {
    return `Pagamento à vista via ${metodo.toUpperCase()} no valor de ${formatarValor(valorTotal)}`;
  }

  const valorParcela = valorTotal / numeroParcelas;
  const vencimentos: string[] = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);
    const dataFormatada = dataVencimento.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
    vencimentos.push(dataFormatada);
  }

  return `Pagamento parcelado em ${numeroParcelas}x de ${formatarValor(valorParcela)}, vencimentos: ${vencimentos.join(', ')} (via ${metodo.toUpperCase()})`;
}

function gerarDetalhesParcelas(
  numeroParcelas: number,
  valorTotal: number,
  dataInicio: Date
): Array<{ parcela: number; valor: number; vencimento: string }> {
  const parcelas = [];
  const valorParcela = valorTotal / numeroParcelas;

  for (let i = 0; i < numeroParcelas; i++) {
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);

    parcelas.push({
      parcela: i + 1,
      valor: parseFloat(valorParcela.toFixed(2)),
      vencimento: dataVencimento.toISOString().split('T')[0],
    });
  }

  return parcelas;
}

export async function POST(request: NextRequest) {
  try {
    const body: GerarReciboRequest = await request.json();
    const {
      contrato_id,
      pagamento_id,
      parcela_numero,
      tipo_recibo = 'contratacao',
      emitido_por_cpf,
    } = body;

    // Validações
    if (!pagamento_id) {
      return NextResponse.json(
        { error: 'ID do pagamento é obrigatório' },
        { status: 400 }
      );
    }

    if (tipo_recibo === 'parcela' && !parcela_numero) {
      return NextResponse.json(
        { error: 'Número da parcela é obrigatório para recibo de parcela' },
        { status: 400 }
      );
    }

    // Verificar se recibo já existe para este contrato/pagamento
    const reciboExistente = await query(
      `SELECT id, numero_recibo FROM recibos 
       WHERE contrato_id = $1 AND pagamento_id = $2 AND ativo = true`,
      [contrato_id, pagamento_id]
    );

    if (reciboExistente.rows.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Recibo já foi gerado anteriormente',
          recibo: reciboExistente.rows[0],
        },
        { status: 200 }
      );
    }

    // Buscar dados completos do contrato, pagamento e contratante
    // Detectar colunas de preço disponíveis para planos
    let planColsRes;
    try {
      planColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'planos' AND column_name IN ('preco','valor_por_funcionario','valor_base','valor_fixo_anual')`
      );
    } catch (error) {
      console.error('Erro ao detectar colunas do plano:', error);
      planColsRes = { rows: [] };
    }
    const availablePlanCols = planColsRes.rows.map((r: any) => r.column_name);

    const planSelect: string[] = [
      'pl.nome as plano_nome',
      'pl.tipo as plano_tipo',
    ];
    if (availablePlanCols.includes('preco')) planSelect.push('pl.preco');
    if (availablePlanCols.includes('valor_por_funcionario'))
      planSelect.push('pl.valor_por_funcionario');
    if (availablePlanCols.includes('valor_base'))
      planSelect.push('pl.valor_base');
    if (availablePlanCols.includes('valor_fixo_anual'))
      planSelect.push('pl.valor_fixo_anual');

    let dadosResult;

    if (contrato_id) {
      // Query com contrato existente
      dadosResult = await query(
        `SELECT 
          c.id as contrato_id,
          c.contratante_id,
          c.plano_id,
          c.valor_total as contrato_valor_total,
          c.numero_funcionarios,
          ct.nome as contratante_nome,
          ct.cnpj as contratante_cnpj,
          ct.numero_funcionarios_estimado,
          p.valor as pagamento_valor,
          p.metodo as pagamento_metodo,
          p.data_pagamento,
          p.numero_parcelas,
          ${planSelect.join(',\n          ')}
        FROM contratos c
        INNER JOIN contratantes ct ON c.contratante_id = ct.id
        INNER JOIN pagamentos p ON p.contrato_id = c.id AND p.id = $2
        INNER JOIN planos pl ON c.plano_id = pl.id
        WHERE c.id = $1`,
        [contrato_id, pagamento_id]
      );
    } else {
      // Query sem contrato (fluxo legado)
      dadosResult = await query(
        `SELECT 
          p.contratante_id,
          p.valor as pagamento_valor,
          p.metodo as pagamento_metodo,
          p.data_pagamento,
          p.numero_parcelas,
          p.numero_funcionarios,
          p.valor_por_funcionario,
          ct.nome as contratante_nome,
          ct.cnpj as contratante_cnpj,
        ct.numero_funcionarios_estimado,
        ct.plano_id as contratante_plano_id
        FROM pagamentos p
        INNER JOIN contratantes ct ON p.contratante_id = ct.id
        WHERE p.id = $1`,
        [pagamento_id]
      );
    }

    if (dadosResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: contrato_id
            ? 'Contrato ou pagamento não encontrado'
            : 'Pagamento não encontrado',
        },
        { status: 404 }
      );
    }

    const dados = dadosResult.rows[0];

    // Validar se pagamento está confirmado
    const pagamentoStatus = await query(
      `SELECT status FROM pagamentos WHERE id = $1`,
      [pagamento_id]
    );

    if (
      pagamentoStatus.rows.length === 0 ||
      pagamentoStatus.rows[0].status !== 'pago'
    ) {
      return NextResponse.json(
        { error: 'Pagamento ainda não foi confirmado' },
        { status: 400 }
      );
    }

    // Calcular vigência (364 dias a partir da data do pagamento)
    const dataPagamento = new Date(dados.data_pagamento);
    const vigenciaInicio = dataPagamento;
    const vigenciaFim = new Date(dataPagamento);
    vigenciaFim.setDate(vigenciaFim.getDate() + 364);

    // Determinar número de funcionários cobertos
    const numeroFuncionarios =
      dados.numero_funcionarios || dados.numero_funcionarios_estimado || 0;

    // Calcular valores baseado no tipo de recibo
    let valorTotalAnual: number;
    let valorPorFuncionario: number | null = null;
    let numeroParcelasEfetivo = dados.numero_parcelas || 1;

    if (
      tipo_recibo === 'parcela' &&
      parcela_numero &&
      dados.detalhes_parcelas
    ) {
      // Para recibo de parcela, buscar valor específico da parcela
      const parcelas = dados.detalhes_parcelas as Array<{
        parcela: number;
        valor: number;
        vencimento: string;
      }>;
      const parcela = parcelas.find((p) => p.parcela === parcela_numero);
      if (!parcela) {
        return NextResponse.json(
          { error: `Parcela ${parcela_numero} não encontrada` },
          { status: 404 }
        );
      }
      valorTotalAnual = parcela.valor;
      numeroParcelasEfetivo = 1; // Recibo de parcela individual
    } else {
      // Recibo de contratação completa ou parcela sem detalhes específicos
      // Preferir valor_por_funcionario quando disponível (multiplica pelo número de funcionários)
      if (dados.valor_por_funcionario && numeroFuncionarios > 0) {
        valorPorFuncionario = parseFloat(String(dados.valor_por_funcionario));
        valorTotalAnual = valorPorFuncionario * numeroFuncionarios;
      } else {
        valorTotalAnual = parseFloat(dados.pagamento_valor) || 0;
        if (
          tipo_recibo === 'parcela' &&
          parcela_numero &&
          numeroParcelasEfetivo > 1
        ) {
          // Para parcela sem detalhes_parcelas, dividir valor total pelas parcelas
          valorTotalAnual = valorTotalAnual / numeroParcelasEfetivo;
        }
        valorPorFuncionario =
          dados.valor_por_funcionario ||
          (numeroFuncionarios > 0
            ? parseFloat((valorTotalAnual / numeroFuncionarios).toFixed(2))
            : null);
      }
    }

    // Determinar forma de pagamento e gerar descrição
    const numeroParcelas = numeroParcelasEfetivo;
    const formaPagamento = determinarFormaPagamento(
      dados.pagamento_metodo,
      numeroParcelas
    );

    // Gerar descrição detalhada do pagamento
    let descricaoPagamento: string;
    if (tipo_recibo === 'parcela') {
      descricaoPagamento = `Recibo de quitação da ${parcela_numero}ª parcela no valor de ${formatarValor(valorTotalAnual)} (via ${dados.pagamento_metodo.toUpperCase()})`;
    } else {
      descricaoPagamento = gerarDescricaoPagamento(
        dados.pagamento_metodo,
        numeroParcelas,
        valorTotalAnual,
        vigenciaInicio
      );
    }

    // Gerar detalhes das parcelas (JSON)
    let detalhesParcelas: any;
    if (
      tipo_recibo === 'parcela' &&
      parcela_numero &&
      dados.detalhes_parcelas
    ) {
      // Para recibo de parcela, incluir apenas a parcela específica
      const parcelas = dados.detalhes_parcelas as Array<{
        parcela: number;
        valor: number;
        vencimento: string;
      }>;
      detalhesParcelas = parcelas.filter((p) => p.parcela === parcela_numero);
    } else if (
      tipo_recibo === 'parcela' &&
      parcela_numero &&
      numeroParcelas > 1
    ) {
      // Para parcela sem detalhes_parcelas, gerar parcela específica
      detalhesParcelas = [
        {
          parcela: parcela_numero,
          valor: valorTotalAnual,
          vencimento: new Date(
            vigenciaInicio.getTime() +
              (parcela_numero - 1) * 30 * 24 * 60 * 60 * 1000
          )
            .toISOString()
            .split('T')[0],
        },
      ];
    } else {
      // Para recibo de contratação, incluir todas as parcelas
      detalhesParcelas = gerarDetalhesParcelas(
        numeroParcelas,
        valorTotalAnual,
        vigenciaInicio
      );
    }

    let reciboColsRes;
    try {
      reciboColsRes = await query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'recibos' AND column_name IN ('tipo_recibo','emitido_por_cpf')`
      );
    } catch (err) {
      console.error('Erro ao detectar colunas da tabela recibos:', err);
      reciboColsRes = { rows: [] };
    }

    const reciboColsAvailable = reciboColsRes.rows.map(
      (r: any) => r.column_name
    );

    const baseValues: any[] = [
      contrato_id,
      pagamento_id,
      dados.contratante_id,
      vigenciaInicio.toISOString().split('T')[0],
      vigenciaFim.toISOString().split('T')[0],
      numeroFuncionarios,
      valorTotalAnual,
      valorPorFuncionario,
      formaPagamento,
      numeroParcelas,
      numeroParcelas > 1 ? valorTotalAnual / numeroParcelas : valorTotalAnual,
      JSON.stringify(detalhesParcelas),
      descricaoPagamento,
    ];

    const hasTipo = reciboColsAvailable.includes('tipo_recibo');
    const hasEmit = reciboColsAvailable.includes('emitido_por_cpf');

    // Se contrato_id não foi informado, tentar obter contrato existente ACEITO para o contratante
    let effectiveContratoId = contrato_id;
    if (!effectiveContratoId) {
      const existingContr = await query(
        `SELECT id, aceito, status FROM contratos WHERE contratante_id = $1 AND aceito = true ORDER BY id DESC LIMIT 1`,
        [dados.contratante_id]
      );
      if (existingContr.rows.length > 0) {
        effectiveContratoId = existingContr.rows[0].id;
      } else {
        // POLÍTICA: Recibos só podem ser gerados com contrato pré-existente e aceito
        console.error(
          `[RECIBO/GERAR] Contrato não encontrado ou não aceito para contratante ${dados.contratante_id}`
        );
        return NextResponse.json(
          {
            error:
              'Contrato não encontrado ou não aceito. É necessário aceitar um contrato antes de gerar recibos.',
          },
          { status: 400 }
        );
      }
    }

    // Validar que o contrato existe e está aceito
    const contratoValidation = await query(
      `SELECT id, aceito, status FROM contratos WHERE id = $1`,
      [effectiveContratoId]
    );
    if (contratoValidation.rows.length === 0) {
      return NextResponse.json(
        { error: 'Contrato não encontrado' },
        { status: 404 }
      );
    }
    if (!contratoValidation.rows[0].aceito) {
      return NextResponse.json(
        {
          error:
            'Contrato não foi aceito. Aceite o contrato antes de gerar recibos.',
        },
        { status: 400 }
      );
    }

    // Ajustar o primeiro valor (contracto_id) para usar valor efetivo
    const valuesWithEffectiveContract = [
      effectiveContratoId,
      ...baseValues.slice(1),
    ];

    let reciboResult;

    if (hasTipo && hasEmit) {
      // ambos presentes
      reciboResult = await query(
        `INSERT INTO recibos (
          contrato_id, pagamento_id, contratante_id, vigencia_inicio, vigencia_fim,
          numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento,
          numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, tipo_recibo, emitido_por_cpf, ativo
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,true
        ) RETURNING id, numero_recibo`,
        [...valuesWithEffectiveContract, tipo_recibo, emitido_por_cpf || null]
      );
    } else if (hasTipo && !hasEmit) {
      // apenas tipo_recibo
      reciboResult = await query(
        `INSERT INTO recibos (
          contrato_id, pagamento_id, contratante_id, vigencia_inicio, vigencia_fim,
          numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento,
          numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, tipo_recibo, ativo
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true
        ) RETURNING id, numero_recibo`,
        [...valuesWithEffectiveContract, tipo_recibo]
      );
    } else if (!hasTipo && hasEmit) {
      // apenas emitido_por_cpf
      reciboResult = await query(
        `INSERT INTO recibos (
          contrato_id, pagamento_id, contratante_id, vigencia_inicio, vigencia_fim,
          numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento,
          numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, emitido_por_cpf, ativo
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true
        ) RETURNING id, numero_recibo`,
        [...valuesWithEffectiveContract, emitido_por_cpf || null]
      );
    } else {
      // nenhum dos dois
      reciboResult = await query(
        `INSERT INTO recibos (
          contrato_id, pagamento_id, contratante_id, vigencia_inicio, vigencia_fim,
          numero_funcionarios_cobertos, valor_total_anual, valor_por_funcionario, forma_pagamento,
          numero_parcelas, valor_parcela, detalhes_parcelas, descricao_pagamento, ativo
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true
        ) RETURNING id, numero_recibo`,
        valuesWithEffectiveContract
      );
    }

    const recibo = reciboResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Recibo gerado com sucesso',
      recibo: {
        id: recibo.id,
        numero_recibo: recibo.numero_recibo,
        vigencia_inicio: vigenciaInicio.toISOString().split('T')[0],
        vigencia_fim: vigenciaFim.toISOString().split('T')[0],
        numero_funcionarios_cobertos: numeroFuncionarios,
        valor_total_anual: valorTotalAnual,
        valor_por_funcionario: valorPorFuncionario,
        forma_pagamento: formaPagamento,
        numero_parcelas: numeroParcelas,
        parcela_numero: parcela_numero,
        tipo_recibo: tipo_recibo,
        descricao_pagamento: descricaoPagamento,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar recibo:', error);
    console.error(error instanceof Error ? error.stack : JSON.stringify(error));
    return NextResponse.json(
      {
        error: 'Erro ao gerar recibo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

// GET: Buscar recibo por ID ou por contrato/pagamento
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reciboId = searchParams.get('id');
    const contratoId = searchParams.get('contrato_id');
    const pagamentoId = searchParams.get('pagamento_id');

    let reciboResult;

    if (reciboId) {
      // Tentar primeiro como ID numérico
      let reciboResultNumeric;
      try {
        reciboResultNumeric = await query(
          `SELECT * FROM vw_recibos_completos WHERE id = $1`,
          [parseInt(reciboId)]
        );
      } catch {
        // Se falhar, tentar como numero_recibo
        reciboResultNumeric = null;
      }

      if (reciboResultNumeric && reciboResultNumeric.rows.length > 0) {
        reciboResult = reciboResultNumeric;
      } else {
        // Tentar como numero_recibo
        reciboResult = await query(
          `SELECT * FROM vw_recibos_completos WHERE numero_recibo = $1`,
          [reciboId]
        );
      }
    } else if (contratoId && pagamentoId) {
      reciboResult = await query(
        `SELECT * FROM vw_recibos_completos 
         WHERE contrato_id = $1 AND pagamento_id = $2`,
        [contratoId, pagamentoId]
      );
    } else if (contratoId) {
      reciboResult = await query(
        `SELECT * FROM vw_recibos_completos WHERE contrato_id = $1`,
        [contratoId]
      );
    } else {
      return NextResponse.json(
        {
          error:
            'Parâmetros insuficientes. Forneça id, contrato_id ou contrato_id+pagamento_id',
        },
        { status: 400 }
      );
    }

    if (reciboResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Recibo não encontrado' },
        { status: 404 }
      );
    }

    const r = reciboResult.rows[0];
    const valorParcela =
      r.valor_parcela ??
      (r.valor_total_anual
        ? parseFloat(String(r.valor_total_anual)) / (r.numero_parcelas || 1)
        : null);

    return NextResponse.json({
      success: true,
      recibo: {
        ...r,
        valor_parcela: valorParcela,
      },
    });
  } catch (error) {
    console.error('Erro ao buscar recibo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar recibo' },
      { status: 500 }
    );
  }
}

// Exportar funções auxiliares para testes
export {
  determinarFormaPagamento,
  gerarDescricaoPagamento,
  gerarDetalhesParcelas,
};
