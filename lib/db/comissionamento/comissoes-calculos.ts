/**
 * Funções puras de cálculo de comissões.
 *
 * Extraído de comissoes.ts para isolar a lógica de cálculo (custo fixo vs percentual)
 * da lógica de persistência (queries DB, auditoria).
 */

import { CUSTO_POR_AVALIACAO, type TipoCliente } from '../../leads-config';
import { PERCENTUAL_IMPOSTOS_PADRAO } from '../../financeiro/sociedade';
import type { StatusComissao } from '../../types/comissionamento';
import { calcularPrevisaoPagamento } from './utils';

export interface DadosRepresentante {
  percentual_comissao: string | number | null;
  modelo_comissionamento: string | null;
  valor_custo_fixo_entidade: string | number | null;
  valor_custo_fixo_clinica: string | number | null;
  asaas_wallet_id: string | null;
  status: string;
}

export interface DadosVinculoCalculo {
  percentual_comissao_representante: string | number | null;
  valor_negociado: string | number | null;
}

export interface ResultadoCalculoComissao {
  valorComissao: number;
  percentualRep: number;
  baseCalculoFinal: number;
}

/**
 * Calcula o valor da comissão (custo fixo ou percentual) e o valor da comissão comercial.
 *
 * @returns null se há erro de validação (retorna string de erro via segundo elemento da tupla)
 */
export function calcularValoresComissao(params: {
  rep: DadosRepresentante;
  vinculoPerc: DadosVinculoCalculo;
  entidadeId: number | null;
  valorLaudo: number;
  totalParcelas: number;
  valorParcela?: number | null;
  percentualImpostos?: number | null;
  /**
   * Número real de avaliações liberadas no lote.
   * Obrigatório para modelo custo_fixo: comissão = custoFixo × numAvaliacoes / totalParcelas.
   * Para modelo percentual é ignorado.
   * Fallback: 1 (se não informado).
   */
  numAvaliacoes?: number | null;
}): { resultado: ResultadoCalculoComissao } | { erro: string } {
  const {
    rep,
    vinculoPerc,
    entidadeId,
    valorLaudo,
    totalParcelas,
    valorParcela = null,
    percentualImpostos = PERCENTUAL_IMPOSTOS_PADRAO,
    numAvaliacoes = null,
  } = params;

  const modeloRep: string = rep.modelo_comissionamento ?? 'percentual';
  const isCustoFixo = modeloRep === 'custo_fixo';

  const percVinculo = vinculoPerc.percentual_comissao_representante;

  const brutoPerParcel = valorLaudo / totalParcelas;
  const valorLiquidoGateway =
    valorParcela != null && valorParcela > 0 ? Number(valorParcela) : null;
  const valorGateway =
    valorLiquidoGateway != null && valorLiquidoGateway < brutoPerParcel
      ? Math.max(0, brutoPerParcel - valorLiquidoGateway)
      : 0;
  const valorImpostos =
    Math.round(
      brutoPerParcel * (Math.max(0, Number(percentualImpostos)) / 100) * 100
    ) / 100;
  const baseRecebidaLiquida = Math.max(
    0,
    Math.round((brutoPerParcel - valorImpostos - valorGateway) * 100) / 100
  );

  let percentualRep: number;
  let valorComissao: number;
  let baseCalculoFinal = 0;

  if (isCustoFixo) {
    const tipoCliente: TipoCliente = entidadeId ? 'entidade' : 'clinica';
    const custoFixoRep: number =
      (entidadeId
        ? rep.valor_custo_fixo_entidade != null
          ? parseFloat(String(rep.valor_custo_fixo_entidade))
          : null
        : rep.valor_custo_fixo_clinica != null
          ? parseFloat(String(rep.valor_custo_fixo_clinica))
          : null) ?? CUSTO_POR_AVALIACAO[tipoCliente];

    // Comissão custo_fixo = custoFixo × numAvaliacoes / totalParcelas
    // Ex: R$5 × 10 avaliações / 1 parcela = R$50
    // Ex: R$5 × 10 avaliações / 3 parcelas = R$16.67 por parcela
    const numAval =
      numAvaliacoes != null && numAvaliacoes > 0 ? numAvaliacoes : 1;
    const totalParc = totalParcelas > 0 ? totalParcelas : 1;
    const totalCustoFixoLote = custoFixoRep * numAval;
    valorComissao = Math.round((totalCustoFixoLote / totalParc) * 100) / 100;

    // Verificar viabilidade: QWork deve receber pelo menos CUSTO_MINIMO por avaliação
    // baseRecebidaLiquida já é o total da parcela após impostos e gateway
    const margemQWork = baseRecebidaLiquida - valorComissao;
    const minimoQWorkParcela =
      (CUSTO_POR_AVALIACAO[tipoCliente] * numAval) / totalParc;
    if (
      margemQWork < 0 ||
      (minimoQWorkParcela > 0 && margemQWork < minimoQWorkParcela * 0.5)
    ) {
      // Aviso apenas — não bloqueia comissão se custo_fixo foi aprovado pelo comercial
      console.warn(
        `[Comissionamento] custo_fixo: margem QWork (R$${margemQWork.toFixed(2)}) abaixo do mínimo esperado (R$${minimoQWorkParcela.toFixed(2)}) — lote com ${numAval} avaliações, parcela ${totalParc}`
      );
    }

    percentualRep = 0;
    baseCalculoFinal = baseRecebidaLiquida;
  } else {
    percentualRep =
      percVinculo != null
        ? parseFloat(String(percVinculo))
        : rep.percentual_comissao != null
          ? parseFloat(String(rep.percentual_comissao))
          : NaN;
    if (isNaN(percentualRep)) {
      return {
        erro: 'Percentual de comissão não definido para este vínculo/representante.',
      };
    }

    valorComissao =
      Math.round(((baseRecebidaLiquida * percentualRep) / 100) * 100) / 100;
    baseCalculoFinal = baseRecebidaLiquida;
  }

  // Derivar percentual do comercial via regra central QWork (40 − rep% se zerado)
  return {
    resultado: {
      valorComissao,
      percentualRep,
      baseCalculoFinal,
    },
  };
}

/**
 * Determina o status inicial de uma comissão ao ser criada.
 */
export function determinarStatusInicialComissao(params: {
  forcarRetida: boolean;
  parcelaConfirmadaEm: Date | null | undefined;
  repApto: boolean;
}): StatusComissao {
  const { forcarRetida, parcelaConfirmadaEm, repApto } = params;
  const parcelaEfetivamentePaga = !forcarRetida && parcelaConfirmadaEm != null;
  return parcelaEfetivamentePaga && repApto ? 'paga' : 'retida';
}

/**
 * Calcula mês de emissão e mês de pagamento previsto para uma parcela.
 */
export function calcularMesesComissao(parcelaNum: number): {
  mesEmissao: string;
  mesPagamento: string;
} {
  const agora = new Date();
  const mesEmissao = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-01`;
  const { mes_pagamento: mesPagBase } = calcularPrevisaoPagamento(agora);
  const mesPagDate = new Date(mesPagBase + 'T00:00:00Z');
  mesPagDate.setUTCMonth(mesPagDate.getUTCMonth() + (parcelaNum - 1));
  const mesPagamento = `${mesPagDate.getUTCFullYear()}-${String(mesPagDate.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { mesEmissao, mesPagamento };
}
