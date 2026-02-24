/**
 * Helper para formatação de datas/horas sempre no fuso horário de São Paulo (UTC-3)
 *
 * Solução: Usar timeZone: 'America/Sao_Paulo' em todas as funções de formatação.
 * Isso garante o horário correto de São Paulo independentemente de onde o código
 * executa (Vercel UTC, máquina local Brasil, CI, etc.).
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Parseia o valor para um objeto Date sem modificar o horário.
 * @param value Data ou string ISO para converter
 * @returns Objeto Date correspondente
 */
export function corrigirTimezone(
  value: Date | string | null | undefined
): Date {
  if (!value) {
    return new Date();
  }
  return value instanceof Date ? value : new Date(value);
}

/**
 * Formata data para exibição em relatórios sempre no fuso de São Paulo
 * @param value Data ou string ISO
 * @returns String formatada "DD/MM/YYYY, HH:mm:ss"
 */
export function formatarDataCorrigida(
  value: Date | string | null | undefined
): string {
  const data =
    value instanceof Date ? value : value ? new Date(value) : new Date();

  return data.toLocaleString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Formata apenas a data (sem hora) no fuso de São Paulo
 * @param value Data ou string ISO
 * @returns String formatada "DD/MM/YYYY"
 */
export function formatarDataApenasData(
  value: Date | string | null | undefined
): string {
  const data =
    value instanceof Date ? value : value ? new Date(value) : new Date();

  return data.toLocaleDateString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formata apenas a hora no fuso de São Paulo
 * @param value Data ou string ISO
 * @returns String formatada "HH:mm:ss"
 */
export function formatarHora(value: Date | string | null | undefined): string {
  const data =
    value instanceof Date ? value : value ? new Date(value) : new Date();

  return data.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
