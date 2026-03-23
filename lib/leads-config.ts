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

/** Custo mínimo por produto/vida para cada tipo de cliente (R$) */
export const CUSTO_PRODUTO: Record<TipoCliente, number> = {
  entidade: 15,
  clinica: 5,
} as const;

/**
 * Calcula se um lead requer aprovação do Comercial.
 * A aprovação é necessária quando o valor que sobra para a QWork
 * (valor × (1 − comissão/100)) é inferior ao custo mínimo do tipo.
 */
export function calcularRequerAprovacao(
  valorNegociado: number,
  percentualComissao: number,
  tipoCliente: TipoCliente
): boolean {
  if (valorNegociado <= 0) return false;
  const valorQWork = valorNegociado * (1 - percentualComissao / 100);
  return valorQWork < CUSTO_PRODUTO[tipoCliente];
}
