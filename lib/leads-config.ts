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

/** Custo por avaliação por tipo de cliente (R$): entidade=R$15, clínica=R$5 */
export const CUSTO_POR_AVALIACAO: Record<TipoCliente, number> = {
  entidade: 15,
  clinica: 5,
} as const;

/** @deprecated use CUSTO_POR_AVALIACAO */
export const CUSTO_PRODUTO = CUSTO_POR_AVALIACAO;

/** Percentual máximo total de comissão (representante + vendedor) */
export const MAX_PERCENTUAL_COMISSAO = 40;

/**
 * Calcula se um lead requer aprovação do Comercial.
 * A aprovação é necessária quando o valor que sobra para a QWork
 * (valor × (1 − comissãoTotal/100)) é inferior ao custo mínimo do tipo.
 *
 * @param percentualComissao - Percentual total (rep + vendedor). Para backward compat aceita só rep.
 * @param percentualComissaoVendedor - Percentual do vendedor (default 0).
 */
export function calcularRequerAprovacao(
  valorNegociado: number,
  percentualComissao: number,
  tipoCliente: TipoCliente,
  percentualComissaoVendedor: number = 0
): boolean {
  if (valorNegociado <= 0) return false;
  const totalPerc = percentualComissao + percentualComissaoVendedor;
  const valorQWork = valorNegociado * (1 - totalPerc / 100);
  return valorQWork < CUSTO_POR_AVALIACAO[tipoCliente];
}

/** Resultado do cálculo de valores de comissão */
export interface ValoresComissao {
  /** Valor da comissão do representante (R$) */
  valorRep: number;
  /** Valor da comissão do vendedor (R$) */
  valorVendedor: number;
  /** Valor que fica para o QWork (R$) */
  valorQWork: number;
  /** Se o valor QWork ficou abaixo do custo mínimo (requer aprovação comercial) */
  abaixoCusto: boolean;
  /** Pool disponível para comissão quando abaixo do custo: max(0, valor - custo_min) */
  poolDisponivel: number;
  /** Percentual total aplicado (rep + vendedor) */
  percentualTotal: number;
}

/**
 * Calcula os valores de comissão para rep e vendedor.
 *
 * Percentuais aplicados diretamente sobre o valor negociado.
 * Se valorQWork < custo por avaliação → abaixoCusto=true (requer aprovação comercial).
 * Sem redistribuição — o comercial aprova ciente do impacto.
 */
export function calcularValoresComissao(
  valorNegociado: number,
  percRep: number,
  percVendedor: number,
  tipoCliente: TipoCliente
): ValoresComissao {
  const custoMinimo = CUSTO_POR_AVALIACAO[tipoCliente];
  const percentualTotal = percRep + percVendedor;

  if (valorNegociado <= 0 || percentualTotal <= 0) {
    return {
      valorRep: 0,
      valorVendedor: 0,
      valorQWork: valorNegociado,
      abaixoCusto: valorNegociado < custoMinimo,
      poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
      percentualTotal,
    };
  }

  const valorRep = Math.round(((valorNegociado * percRep) / 100) * 100) / 100;
  const valorVendedor =
    Math.round(((valorNegociado * percVendedor) / 100) * 100) / 100;
  const valorQWork =
    Math.round((valorNegociado - valorRep - valorVendedor) * 100) / 100;

  return {
    valorRep,
    valorVendedor,
    valorQWork,
    abaixoCusto: valorQWork < custoMinimo,
    poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
    percentualTotal,
  };
}
