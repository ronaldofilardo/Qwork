import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { calcularParcelas } from '@/lib/parcelas-helper';

/**
 * API POST /api/pagamento/simular
 *
 * Simula pagamento com cálculo detalhado de parcelas
 *
 * Fluxo atualizado de simulação:
 * - Exibe simulação com valor total e breakdown de parcelas
 * - Suporta PIX (1x), Cartão (1-12x), Boleto (1-12x), Transferência (1x)
 * - Retorna valor por parcela para cada opção
 * - Não cria contrato aqui - apenas simula valores
 */

interface SimularPagamentoRequest {
  contratante_id?: number;
  plano_id?: number;
  valor_total?: number; // Pode vir pré-definido
  numero_funcionarios?: number;
}

// Endpoint para simular valores de pagamento com diferentes métodos/parcelas
export async function POST(request: NextRequest) {
  try {
    const body: SimularPagamentoRequest = await request.json();
    const { contratante_id, plano_id, valor_total, numero_funcionarios } = body;

    let valorCalculado = 0;
    let planoInfo = null;
    let contratanteInfo = null;

    // Cenário único: Contratante e plano fornecidos diretamente
    if (contratante_id && plano_id) {
      const planoResult = await query(`SELECT * FROM planos WHERE id = $1`, [
        plano_id,
      ]);

      if (planoResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Plano não encontrado' },
          { status: 404 }
        );
      }

      const contratanteResult = await query(
        `SELECT id, nome, tipo, numero_funcionarios_estimado FROM entidades WHERE id = $1`,
        [contratante_id]
      );

      if (contratanteResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entidade n\u00e3o encontrada' },
          { status: 404 }
        );
      }

      planoInfo = planoResult.rows[0];
      contratanteInfo = contratanteResult.rows[0];

      // Calcular valor baseado no tipo de plano
      if (planoInfo.tipo === 'fixo') {
        const qtdFunc =
          numero_funcionarios ||
          contratanteInfo.numero_funcionarios_estimado ||
          1;
        valorCalculado = parseFloat(planoInfo.preco) * qtdFunc;
      } else {
        valorCalculado = valor_total || parseFloat(planoInfo.preco);
      }
    }
    // Cenário alternativo: Valor total fornecido diretamente
    else if (valor_total) {
      valorCalculado = valor_total;
    } else {
      return NextResponse.json(
        {
          error:
            'Parâmetros insuficientes. Forneça contratante_id + plano_id ou valor_total',
        },
        { status: 400 }
      );
    }

    // Gerar simulações de parcelas para cada método de pagamento
    const dataInicio = new Date();
    const simulacoes = {
      pix: {
        metodo: 'pix',
        nome: 'PIX',
        parcelas_opcoes: [
          {
            numero_parcelas: 1,
            valor_por_parcela: valorCalculado,
            valor_total: valorCalculado,
            descricao: 'Pagamento à vista via PIX',
          },
        ],
      },
      cartao: {
        metodo: 'cartao',
        nome: 'Cartão de Crédito',
        parcelas_opcoes: [] as any[],
      },
      boleto: {
        metodo: 'boleto',
        nome: 'Boleto Bancário',
        parcelas_opcoes: [] as any[],
      },
      transferencia: {
        metodo: 'transferencia',
        nome: 'Transferência Bancária',
        parcelas_opcoes: [
          {
            numero_parcelas: 1,
            valor_por_parcela: valorCalculado,
            valor_total: valorCalculado,
            descricao: 'Pagamento à vista via Transferência',
          },
        ],
      },
    };

    // Gerar opções de parcelamento para cartão e boleto (1x até 12x)
    for (let i = 1; i <= 12; i++) {
      const parcelasDetalhadas = calcularParcelas({
        valorTotal: valorCalculado,
        numeroParcelas: i,
        dataInicial: dataInicio,
      });

      const valorPorParcela = valorCalculado / i;

      const opcao = {
        numero_parcelas: i,
        valor_por_parcela: parseFloat(valorPorParcela.toFixed(2)),
        valor_total: valorCalculado,
        descricao: `${i}x de R$ ${valorPorParcela.toFixed(2)}`,
        detalhes_parcelas: parcelasDetalhadas,
      };

      simulacoes.cartao.parcelas_opcoes.push(opcao);
      simulacoes.boleto.parcelas_opcoes.push(opcao);
    }

    return NextResponse.json({
      success: true,
      valor_total: valorCalculado,
      contratante: contratanteInfo,
      plano: planoInfo,
      simulacoes,
      observacoes: {
        pix: 'Pagamento instantâneo, acesso liberado imediatamente',
        cartao: 'Parcelas sem juros, aprovação em minutos',
        boleto: 'Compensação em 1-3 dias úteis',
        transferencia: 'Confirmação manual, aguarde até 24h',
      },
    });
  } catch (error) {
    console.error('Erro ao simular pagamento:', error);
    return NextResponse.json(
      {
        error: 'Erro ao simular pagamento',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Manter a função original POST como fallback (renomear para executar confirmação)
// Movida para função separada
