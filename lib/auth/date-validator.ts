/**
 * Validador de Data - Valida datas reais (incluindo leap years)
 *
 * Função auxiliar para garantir que a data fornecida é válida
 * Rejeita datas impossíveis como 31/02/1990, 31/04/1990, etc.
 */

/**
 * Valida se uma data é realmente válida (existe no calendário)
 * @param dia - Dia do mês (1-31)
 * @param mes - Mês (1-12)
 * @param ano - Ano (1900 até hoje)
 * @returns true se a data é válida, false caso contrário
 */
export function isDataValida(dia: number, mes: number, ano: number): boolean {
  // Validación rápida de limites
  if (dia < 1 || dia > 31 || mes < 1 || mes > 12) {
    return false;
  }

  // Usar o construtor de Date do JavaScript para validar
  // Se a data criada for diferente da data fornecida, é inválida
  const data = new Date(ano, mes - 1, dia);

  // Verificar se a data construída corresponde à data fornecida
  // Isso rejeita datas impossíveis como 31/02/1990
  return (
    data.getFullYear() === ano &&
    data.getMonth() === mes - 1 &&
    data.getDate() === dia
  );
}

/**
 * Testa leap year (ano bissexto)
 * @param ano - Ano a verificar
 * @returns true se é bissexto
 */
export function isBissexto(ano: number): boolean {
  return (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
}

/**
 * Exemplo de uso:
 *
 * isDataValida(31, 2, 1990)  // false - fevereiro não tem 31 dias
 * isDataValida(29, 2, 2000)  // true  - 2000 é bissexto
 * isDataValida(29, 2, 1900)  // false - 1900 não é bissexto
 * isDataValida(31, 4, 1990)  // false - abril tem 30 dias
 * isDataValida(31, 1, 1990)  // true  - janeiro tem 31 dias
 * isDataValida(28, 2, 1990)  // true  - sempre válido
 */
