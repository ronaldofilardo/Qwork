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
  entidade_id?: number;
  valor_total?: number;
  numero_funcionarios?: number;
}

// Endpoint para simular valores de pagamento com diferentes métodos/parcelas
export async function POST(request: NextRequest) {
  try {
    const body: SimularPagamentoRequest = await request.json();
    const { entidade_id, valor_total, numero_funcionarios } = body;

    let valorCalculado = 0;
    let entidadeInfo = null;

    if (entidade_id) {
      const entidadeResult = await query(
        `SELECT id, nome, tipo, numero_funcionarios_estimado FROM entidades WHERE id = $1`,
        [entidade_id]
      );

      if (entidadeResult.rows.length === 0) {
        return NextResponse.json(
          { error: 'Entidade não encontrada' },
          { status: 404 }
        );
      }

      entidadeInfo = entidadeResult.rows[0];

      // Calcular valor: R$20 por funcionário como padrão
      const qtdFunc =
        numero_funcionarios || entidadeInfo.numero_funcionarios_estimado || 1;
      valorCalculado = valor_total || 20.0 * qtdFunc;
    } else if (valor_total) {
      valorCalculado = valor_total;
    } else {
      return NextResponse.json(
        {
          error: 'Parâmetros insuficientes. Forneça entidade_id ou valor_total',
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
      entidade: entidadeInfo,
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
