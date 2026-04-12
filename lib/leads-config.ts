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

/** Percentual máximo de comissão do representante */
export const MAX_PERCENTUAL_COMISSAO = 40;

/**
 * Calcula se um lead requer aprovação do Comercial.
 * A aprovação é necessária quando o valor que sobra para a QWork
 * (valor × (1 − percentualComissao/100)) é inferior ao custo mínimo do tipo.
 */
export function calcularRequerAprovacao(
  valorNegociado: number,
  percentualComissao: number,
  tipoCliente: TipoCliente
): boolean {
  if (valorNegociado <= 0) return false;
  const valorQWork = valorNegociado * (1 - percentualComissao / 100);
  return valorQWork < CUSTO_POR_AVALIACAO[tipoCliente];
}

/** Resultado do cálculo de valores de comissão */
export interface ValoresComissao {
  /** Valor da comissão do representante (R$) */
  valorRep: number;
  /** Valor que fica para o QWork (R$) */
  valorQWork: number;
  /** Se o valor QWork ficou abaixo do custo mínimo (requer aprovação comercial) */
  abaixoCusto: boolean;
  /** Pool disponível para comissão quando abaixo do custo: max(0, valor - custo_min) */
  poolDisponivel: number;
  /** Percentual aplicado pelo representante */
  percentualTotal: number;
}

/**
 * Calcula os valores de comissão do representante.
 *
 * Percentual aplicado diretamente sobre o valor negociado.
 * Se valorQWork < custo por avaliação → abaixoCusto=true (requer aprovação comercial).
 */
export function calcularValoresComissao(
  valorNegociado: number,
  percRep: number,
  tipoCliente: TipoCliente
): ValoresComissao {
  const custoMinimo = CUSTO_POR_AVALIACAO[tipoCliente];

  if (valorNegociado <= 0 || percRep <= 0) {
    return {
      valorRep: 0,
      valorQWork: valorNegociado,
      abaixoCusto: valorNegociado < custoMinimo,
      poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
      percentualTotal: percRep,
    };
  }

  const valorRep = Math.round(((valorNegociado * percRep) / 100) * 100) / 100;
  const valorQWork = Math.round((valorNegociado - valorRep) * 100) / 100;

  return {
    valorRep,
    valorQWork,
    abaixoCusto: valorQWork < custoMinimo,
    poolDisponivel: Math.max(0, valorNegociado - custoMinimo),
    percentualTotal: percRep,
  };
}
