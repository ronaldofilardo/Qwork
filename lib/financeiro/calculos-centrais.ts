/**
 * Módulo central de constantes e helpers de cálculo financeiro.
 *
 * Centraliza regras que antes estavam espalhadas entre:
 * - lib/financeiro/sociedade.ts
 * - lib/db/comissionamento/comissoes-calculos.ts
 * - lib/leads-config.ts
 *
 * Evita duplicação de fórmulas e garante consistência na derivação de comissões.
 */

export { PERCENTUAL_IMPOSTOS_PADRAO } from './sociedade';

/**
 * Calcula a base líquida após deduções de impostos e gateway.
 * Fórmula: max(0, round2(bruto − (bruto × percImpostos/100) − valorGateway))
 */
export function calcularBaseLiquida(
  bruto: number,
  percentualImpostos: number,
  valorGateway: number
): number {
  const impostos =
    Math.round(bruto * (Math.max(0, percentualImpostos) / 100) * 100) / 100;
  return Math.max(
    0,
    Math.round((bruto - impostos - Math.max(0, valorGateway)) * 100) / 100
  );
}
