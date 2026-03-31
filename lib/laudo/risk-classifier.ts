/**
 * lib/laudo/risk-classifier.ts
 *
 * Funções puras de classificação de risco COPSOQ III.
 * Separadas das queries de banco para facilitar testes unitários.
 */

import type { CategoriaRisco, ClassificacaoSemaforo } from '../laudo-tipos';

// Função para calcular média
export function calcularMedia(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Função para calcular desvio padrão
export function calcularDesvioPadrao(arr: number[], media: number): number {
  if (arr.length <= 1) return 0;
  const variance =
    arr.reduce((sum, val) => sum + Math.pow(val - media, 2), 0) /
    (arr.length - 1);
  return Math.sqrt(variance);
}

// Função para determinar categoria de risco
// Metodologia: Tercis fixos de 33% e 66% da escala 0-100
//
// Grupos Positivos (maior é melhor):
// - >66% = Baixo Risco (Excelente/Verde)
// - 33-66% = Médio Risco (Monitorar/Amarelo)
// - <33% = Alto Risco (Atenção Necessária/Vermelho)
//
// Grupos Negativos (menor é melhor):
// - <33% = Baixo Risco (Excelente/Verde)
// - 33-66% = Médio Risco (Monitorar/Amarelo)
// - >66% = Alto Risco (Atenção Necessária/Vermelho)
export function determinarCategoriaRisco(
  media: number,
  tipo: 'positiva' | 'negativa'
): CategoriaRisco {
  if (tipo === 'positiva') {
    // Para escalas positivas: quanto maior, melhor
    if (media > 66) return 'baixo';
    if (media >= 33) return 'medio';
    return 'alto';
  } else {
    // Para escalas negativas: quanto menor, melhor
    if (media < 33) return 'baixo';
    if (media <= 66) return 'medio';
    return 'alto';
  }
}

// Função para determinar classificação semáforo
export function determinarClassificacaoSemaforo(
  categoriaRisco: CategoriaRisco
): ClassificacaoSemaforo {
  switch (categoriaRisco) {
    case 'baixo':
      return 'verde';
    case 'medio':
      return 'amarelo';
    case 'alto':
      return 'vermelho';
  }
}

// Função para determinar ação recomendada
export function determinarAcaoRecomendada(
  classificacao: ClassificacaoSemaforo
): string {
  switch (classificacao) {
    case 'verde':
      return 'Manter; monitorar anualmente';
    case 'amarelo':
      return 'Atenção; intervenções preventivas (treinamentos)';
    case 'vermelho':
      return 'Ação imediata; plano de mitigação (PGR/NR-1)';
  }
}
