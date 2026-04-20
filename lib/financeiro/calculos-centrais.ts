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

export {
  PERCENTUAL_IMPOSTOS_PADRAO,
  PERCENTUAL_MAXIMO_COMERCIAL,
} from './sociedade';

/**
 * Deriva o percentual do comercial quando o vínculo não tem um valor explícito.
 *
 * Regra de negócio QWork:
 * - Modelo percentual: comercial = 40 − percentualRep (se explícito = 0 ou null)
 * - Modelo custo_fixo: usa o percentual explícito do vínculo (sem fallback)
 *
 * @param percentualRep Percentual do representante
 * @param percentualComercialExplicito Percentual armazenado no vínculo (pode ser 0 ou null)
 * @param modelo 'percentual' | 'custo_fixo'
 * @returns percentual efetivo do comercial
 */
export function derivarPercentualComercial(
  percentualRep: number,
  percentualComercialExplicito: number | null | undefined,
  modelo: string
): number {
  const explicito = Number(percentualComercialExplicito ?? 0);
  if (modelo === 'percentual' && explicito === 0 && percentualRep > 0) {
    return Math.max(0, 40 - percentualRep);
  }
  return Math.max(0, explicito);
}

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
