/**
 * Constantes e lógica de negócio compartilhada para Leads
 * Usado tanto no frontend quanto no backend.
 */

export type TipoCliente = 'entidade' | 'clinica';

export const TIPOS_CLIENTE: TipoCliente[] = ['entidade', 'clinica'];

export const TIPO_CLIENTE_LABEL: Record<TipoCliente, string> = {
  entidade: 'Entidade',
  clinica: 'Clínica',
};

/** Custo por avaliação por tipo de cliente (R$): entidade=R$12, clínica=R$5 */
export const CUSTO_POR_AVALIACAO: Record<TipoCliente, number> = {
  entidade: 12,
  clinica: 5,
} as const;

/** @deprecated use CUSTO_POR_AVALIACAO */
export const CUSTO_PRODUTO = CUSTO_POR_AVALIACAO;

/** Percentual máximo de comissão do representante */
export const MAX_PERCENTUAL_COMISSAO = 40;

/**
 * Calcula se um lead requer aprovação do Comercial.
 * A aprovação é necessária quando o valor que sobra para a QWork
 * (valor × (1 − (percRep + percComercial)/100)) é inferior ao custo mínimo do tipo.
 */
export function calcularRequerAprovacao(
  valorNegociado: number,
  percRep: number,
  percComercial: number,
  tipoCliente: TipoCliente
): boolean {
  if (valorNegociado <= 0) return false;
  const valorQWork = valorNegociado * (1 - (percRep + percComercial) / 100);
  return valorQWork < CUSTO_POR_AVALIACAO[tipoCliente];
}

/** Resultado do cálculo de valores de comissão */
export interface ValoresComissao {
  /** Valor da comissão do representante (R$) */
  valorRep: number;
  /** Valor da comissão do comercial (R$) */
  valorComercial: number;
  /** Valor que fica para o QWork (R$) */
  valorQWork: number;
  /** Se o valor QWork ficou abaixo do custo mínimo (requer aprovação comercial) */
  abaixoCusto: boolean;
  /** Pool disponível para comissão quando abaixo do custo: max(0, valor - custo_min) */
  poolDisponivel: number;
  /** Percentual total aplicado (rep + comercial) */
  percentualTotal: number;
}

/**
 * Calcula os valores de comissão do representante e do comercial.
 *
 * percentualRep e percComercial são aplicados diretamente sobre o valor negociado.
 * Se valorQWork < custo por avaliação → abaixoCusto=true (requer aprovação comercial).
 */
export function calcularValoresComissao(
  valorNegociado: number,
  percRep: number,
  percComercial: number,
  tipoCliente: TipoCliente
): ValoresComissao {
  const custoMinimo = CUSTO_POR_AVALIACAO[tipoCliente];

  if (valorNegociado <= 0) {
    return {
      valorRep: 0,
      valorComercial: 0,
      valorQWork: valorNegociado,
      abaixoCusto: valorNegociado < custoMinimo,
      poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
      percentualTotal: percRep + percComercial,
    };
  }

  const valorRep = Math.round(((valorNegociado * percRep) / 100) * 100) / 100;
  const valorComercial =
    Math.round(((valorNegociado * percComercial) / 100) * 100) / 100;
  const valorQWork =
    Math.round((valorNegociado - valorRep - valorComercial) * 100) / 100;

  return {
    valorRep,
    valorComercial,
    valorQWork,
    abaixoCusto: valorQWork < custoMinimo,
    poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
    percentualTotal: percRep + percComercial,
  };
}

/** Resultado do cálculo de comissão no modelo custo_fixo */
export interface ValoresComissaoCustoFixo {
  /** Margem do representante (R$): valorNegociado − valorCustoFixo. Usado para cálculo proporcional nas parcelas. */
  valorRep: number;
  /** Valor da comissão do comercial (R$): percComercial% da margem (valorNeg − custoFixo) */
  valorComercial: number;
  /** Valor líquido que fica para o QWork (R$): margem − valorComercial */
  valorQWork: number;
  /** true quando valorNegociado ≤ valorCustoFixo (margem ≤ 0) */
  abaixoMinimo: boolean;
}

/**
 * Retorna a margem mínima por avaliação necessária para que o QWork receba
 * ao menos CUSTO_POR_AVALIACAO[tipo] após pagar a comissão do comercial.
 *
 * Fórmula usada: margem_mín = custo_mín × (1 + percComercial/100)
 * Exemplo: R$12 × 1,20 = R$14,40 (entidade, 20% comercial)
 */
export function minimoCustoFixoPorEval(
  tipoCliente: TipoCliente,
  percComercial: number
): number {
  const min = CUSTO_POR_AVALIACAO[tipoCliente];
  const perc = Math.max(0, Math.min(40, percComercial));
  return Math.round(min * (1 + perc / 100) * 100) / 100;
}

/**
 * Calcula comissão no modelo custo_fixo.
 *
 * Distribuição:
 * - **Representante** recebe via split Asaas: custoFixo × numAvaliacoes (não rastreado aqui).
 *   `valorRep` retornado = margem (valorNeg − custoFixo), usado para cálculo proporcional de parcelas.
 * - **Comercial** recebe: `percComercial% × margem` (percComercial% da diferença negociado−custo).
 * - **QWork** recebe (líquido): `margem − valorComercial`.
 *
 * Se valorNegociado ≤ valorCustoFixo, abaixoMinimo=true e valorRep=0.
 *
 * @param percComercial Percentual do comercial sobre a margem (0–40). Default = 0.
 * @param custoMinimoQWork Mínimo que o QWork deve receber por avaliação (CUSTO_POR_AVALIACAO[tipo]). 0 = comportamento legado.
 */
export function calcularComissaoCustoFixo(
  valorNegociado: number,
  valorCustoFixo: number,
  percComercial = 0,
  custoMinimoQWork = 0
): ValoresComissaoCustoFixo {
  if (valorNegociado <= 0 || valorCustoFixo <= 0) {
    return {
      valorRep: 0,
      valorComercial: 0,
      valorQWork: 0,
      abaixoMinimo: true,
    };
  }
  const percCom = Math.max(0, Math.min(40, percComercial));
  const valorRep = Math.round((valorNegociado - valorCustoFixo) * 100) / 100;
  const margem = Math.max(0, valorRep);
  const valorComercial = Math.round(((margem * percCom) / 100) * 100) / 100;
  const valorQWork = Math.round((margem - valorComercial) * 100) / 100;
  return {
    valorRep: margem,
    valorComercial,
    valorQWork,
    abaixoMinimo:
      valorRep < 0 || (custoMinimoQWork > 0 && margem < custoMinimoQWork),
  };
}

/**
 * Retorna o valor mínimo total de venda por avaliação no modelo custo_fixo.
 *
 * Fórmula: custoFixoRep + CUSTO_POR_AVALIACAO[tipo]
 * Exemplo: R$12 (rep) + R$12 (QWork entidade) = R$24
 *
 * O custo do QWork (CUSTO_POR_AVALIACAO) inclui a comissão do comercial,
 * que é paga da parte do QWork, não adicionada ao total.
 */
export function valorMinimoCustoFixoTotal(
  tipo: TipoCliente,
  custoFixoRep: number
): number {
  return custoFixoRep + CUSTO_POR_AVALIACAO[tipo];
}
