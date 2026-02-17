/**
 * Helper para correção de timezone em PDFs
 * Problema: Em PROD, o sistema estava adicionando 3 horas aos horários
 *
 * Solução: Subtrair 3 horas das datas/timestamps antes de formatar
 * Isso garante que a hora exibida seja a correta (Brasil -3h UTC)
 */

/**
 * Corrige timestamp subtraindo 3 horas (ajuste de timezone PROD)
 * @param date Data ou string ISO para converter
 * @returns Data com 3 horas subtraídas
 */
export function corrigirTimezone(
  value: Date | string | null | undefined
): Date {
  if (!value) {
    return new Date();
  }

  const data = value instanceof Date ? value : new Date(value);

  // Subtrair 3 horas (3 * 60 * 60 * 1000 ms)
  const dataCorrigida = new Date(data.getTime() - 3 * 60 * 60 * 1000);

  return dataCorrigida;
}

/**
 * Formata data corrigida para exibição em relatórios
 * @param value Data ou string ISO
 * @returns String formatada "DD/MM/YYYY, HH:mm:ss"
 */
export function formatarDataCorrigida(
  value: Date | string | null | undefined
): string {
  const dataCorrigida = corrigirTimezone(value);

  return dataCorrigida.toLocaleString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata apenas a data (sem hora)
 * @param value Data ou string ISO
 * @returns String formatada "DD/MM/YYYY"
 */
export function formatarDataApenasData(
  value: Date | string | null | undefined
): string {
  const dataCorrigida = corrigirTimezone(value);

  return dataCorrigida.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formata apenas a hora
 * @param value Data ou string ISO
 * @returns String formatada "HH:mm:ss"
 */
export function formatarHora(value: Date | string | null | undefined): string {
  const dataCorrigida = corrigirTimezone(value);

  return dataCorrigida.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
