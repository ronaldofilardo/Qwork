/**
 * Helper para formatação de datas/horas sempre no fuso horário de São Paulo (UTC-3)
 *
 * Solução: Usar timeZone: 'America/Sao_Paulo' em todas as funções de formatação.
 * Isso garante o horário correto de São Paulo independentemente de onde o código
 * executa (Vercel UTC, máquina local Brasil, CI, etc.).
 */

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';

/**
 * Parseia a data tratando strings sem indicador de fuso como UTC.
 * Isso corrige o comportamento do driver `pg` que retorna `timestamp without time zone`
 * sem sufixo 'Z', fazendo o JavaScript interpretar como hora local.
 */
export function parsearComoUTC(value: Date | string | null | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const str = String(value).trim();
  if (!str) return new Date();
  // Already has timezone info — parse as-is
  if (/Z$/i.test(str) || /[+-]\d{2}:?\d{2}$/.test(str)) {
    return new Date(str);
  }
  // Naive string: normalize space separator and append 'Z' to treat as UTC
  return new Date(str.replace(' ', 'T') + 'Z');
}

/**
 * @deprecated Use parsearComoUTC instead.
 */
export function corrigirTimezone(
  value: Date | string | null | undefined
): Date {
  return parsearComoUTC(value);
}

/**
 * Formata data para exibição em relatórios sempre no fuso de São Paulo
 * @param value Data ou string ISO
 * @returns String formatada "DD/MM/YYYY, HH:mm:ss"
 */
export function formatarDataCorrigida(
  value: Date | string | null | undefined
): string {
  const data = parsearComoUTC(value);

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
  const data = parsearComoUTC(value);

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
  const data = parsearComoUTC(value);

  return data.toLocaleTimeString('pt-BR', {
    timeZone: BRAZIL_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
