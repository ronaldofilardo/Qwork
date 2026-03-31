/**
 * lib/xlsx/uniqueness-validator.ts
 *
 * Factory genérica para validação de unicidade em rows de importação.
 * Elimina duplicação entre validarCPFsUnicos, validarEmailsUnicos,
 * validarCPFsUnicosDetalhado, validarEmailsUnicosDetalhado e validarMatriculasUnicasDetalhado.
 */

/**
 * Modo simples: retorna array de valores duplicados.
 */
export function validarUnicidadeSimples<T>(
  rows: T[],
  extractFn: (row: T) => string | null
): { valido: boolean; duplicados: string[] } {
  const seen = new Set<string>();
  const duplicados: string[] = [];

  for (const row of rows) {
    const val = extractFn(row);
    if (val == null) continue;
    if (seen.has(val)) {
      duplicados.push(val);
    } else {
      seen.add(val);
    }
  }

  return { valido: duplicados.length === 0, duplicados };
}

/**
 * Modo detalhado: retorna mensagens indicando linhas duplicadas.
 */
export function validarUnicidadeDetalhado<T>(
  rows: T[],
  extractFn: (row: T) => string | null,
  labelFn: (valor: string) => string
): { valido: boolean; details: string[] } {
  const linhasPorValor = new Map<string, number[]>();

  rows.forEach((row, i) => {
    const val = extractFn(row);
    if (val == null) return;
    const existing = linhasPorValor.get(val) ?? [];
    existing.push(i + 2); // +2: header + 0-indexed
    linhasPorValor.set(val, existing);
  });

  const details: string[] = [];
  linhasPorValor.forEach((linhas, valor) => {
    if (linhas.length > 1) {
      details.push(
        `Linha ${linhas[0]}: ${labelFn(valor)} (também nas linhas ${linhas.slice(1).join(', ')})`
      );
    }
  });

  return { valido: details.length === 0, details };
}
