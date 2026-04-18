/**
 * Funções puras de cálculo de comissões.
 *
 * Extraído de comissoes.ts para isolar a lógica de cálculo (custo fixo vs percentual)
 * da lógica de persistência (queries DB, auditoria).
 */

import {
  CUSTO_POR_AVALIACAO,
  calcularComissaoCustoFixo,
  type TipoCliente,
} from '../../leads-config';
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
  percentual_comissao_comercial: string | number | null;
}

export interface ResultadoCalculoComissao {
  valorComissao: number;
  percentualRep: number;
  percComercialVinculo: number;
  valorComissaoComercial: number;
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
}): { resultado: ResultadoCalculoComissao } | { erro: string } {
  const { rep, vinculoPerc, entidadeId, valorLaudo, totalParcelas } = params;

  const modeloRep: string = rep.modelo_comissionamento ?? 'percentual';
  const isCustoFixo = modeloRep === 'custo_fixo';

  const percVinculo = vinculoPerc.percentual_comissao_representante;
  const valorNegociadoVinculo: number | null =
    vinculoPerc.valor_negociado != null
      ? parseFloat(String(vinculoPerc.valor_negociado))
      : null;
  const percComercialVinculo: number =
    vinculoPerc.percentual_comissao_comercial != null
      ? parseFloat(String(vinculoPerc.percentual_comissao_comercial))
      : 0;

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

    const negociado = valorNegociadoVinculo ?? valorLaudo;
    const { valorRep, abaixoMinimo } = calcularComissaoCustoFixo(
      negociado,
      custoFixoRep,
      percComercialVinculo
    );
    if (abaixoMinimo) {
      return {
        erro: `Valor negociado (R$ ${negociado.toFixed(2)}) é inferior ao custo fixo por avaliação (R$ ${custoFixoRep.toFixed(2)}).`,
      };
    }
    const brutoPerParcel = valorLaudo / totalParcelas;
    const ratioRep = negociado > 0 ? valorRep / negociado : 0;
    valorComissao = Math.round(ratioRep * brutoPerParcel * 100) / 100;
    percentualRep = 0;
    baseCalculoFinal = Math.max(0, valorComissao);
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

    const brutoPerParcel = valorLaudo / totalParcelas;
    valorComissao =
      Math.round(((brutoPerParcel * percentualRep) / 100) * 100) / 100;
    baseCalculoFinal = brutoPerParcel;
  }

  const valorComissaoComercial: number =
    percComercialVinculo > 0
      ? Math.round(((baseCalculoFinal * percComercialVinculo) / 100) * 100) /
        100
      : 0;

  return {
    resultado: {
      valorComissao,
      percentualRep,
      percComercialVinculo,
      valorComissaoComercial,
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
  const parcelaEfetivamentePaga =
    !forcarRetida && parcelaConfirmadaEm != null;
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
