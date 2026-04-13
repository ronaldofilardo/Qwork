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
  /** Valor que fica para o representante (R$) */
  valorRep: number;
  /** Valor que fica para o QWork = custo fixo negociado (R$) */
  valorQWork: number;
  /** true quando valorNegociado < valorCustoFixo (rep ficaria com valor negativo) */
  abaixoMinimo: boolean;
}

/**
 * Calcula comissão no modelo custo_fixo.
 * O QWork retém `valorCustoFixo` e o representante recebe o restante.
 * Se valorNegociado < valorCustoFixo, abaixoMinimo=true e valorRep=0.
 */
export function calcularComissaoCustoFixo(
  valorNegociado: number,
  valorCustoFixo: number
): ValoresComissaoCustoFixo {
  if (valorNegociado <= 0 || valorCustoFixo <= 0) {
    return { valorRep: 0, valorQWork: valorCustoFixo, abaixoMinimo: true };
  }
  const valorRep = Math.round((valorNegociado - valorCustoFixo) * 100) / 100;
  return {
    valorRep: Math.max(0, valorRep),
    valorQWork: valorCustoFixo,
    abaixoMinimo: valorRep < 0,
  };
}
