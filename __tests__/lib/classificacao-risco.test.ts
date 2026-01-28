/**
 * Testes para validar a classificação de risco baseada em faixas fixas
 * Metodologia: 33% e 66% da escala 0-100
 *
 * Grupos Positivos (maior é melhor):
 * - >66% = Baixo Risco (Excelente/Verde)
 * - 33-66% = Médio Risco (Monitorar/Amarelo)
 * - <33% = Alto Risco (Atenção Necessária/Vermelho)
 *
 * Grupos Negativos (menor é melhor):
 * - <33% = Baixo Risco (Excelente/Verde)
 * - 33-66% = Médio Risco (Monitorar/Amarelo)
 * - >66% = Alto Risco (Atenção Necessária/Vermelho)
 */

import { CategoriaRisco, ClassificacaoSemaforo } from '@/lib/laudo-tipos';

// Funções extraídas de laudo-calculos.ts para teste
function determinarCategoriaRisco(
  media: number,
  tipo: 'positiva' | 'negativa'
): CategoriaRisco {
  if (tipo === 'positiva') {
    if (media > 66) return 'baixo';
    if (media >= 33) return 'medio';
    return 'alto';
  } else {
    if (media < 33) return 'baixo';
    if (media <= 66) return 'medio';
    return 'alto';
  }
}

function determinarClassificacaoSemaforo(
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

describe('Classificação de Risco - Faixas Fixas (33% e 66%)', () => {
  describe('Grupos POSITIVOS (maior é melhor)', () => {
    test('Grupo 1 - Demandas no Trabalho (74.9%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(74.9, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 3 - Relações Sociais (75.4%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(75.4, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 5 - Valores Organizacionais (74.8%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(74.8, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 2 - Organização do Trabalho (18.6%) deve ser ALTO RISCO/VERMELHO (Atenção)', () => {
      const categoria = determinarCategoriaRisco(18.6, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Grupo 6 - Traços de Personalidade (18.8%) deve ser ALTO RISCO/VERMELHO (Atenção)', () => {
      const categoria = determinarCategoriaRisco(18.8, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Valor exatamente 66% deve ser MÉDIO RISCO/AMARELO', () => {
      const categoria = determinarCategoriaRisco(66, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('medio');
      expect(semaforo).toBe('amarelo');
    });

    test('Valor exatamente 33% deve ser MÉDIO RISCO/AMARELO', () => {
      const categoria = determinarCategoriaRisco(33, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('medio');
      expect(semaforo).toBe('amarelo');
    });

    test('Valor 32.9% deve ser ALTO RISCO/VERMELHO', () => {
      const categoria = determinarCategoriaRisco(32.9, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Valor 66.1% deve ser BAIXO RISCO/VERDE', () => {
      const categoria = determinarCategoriaRisco(66.1, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });
  });

  describe('Grupos NEGATIVOS (menor é melhor)', () => {
    test('Grupo 4 - Interface Trabalho-Indivíduo (18.2%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(18.2, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 7 - Saúde e Bem-Estar (20.5%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(20.5, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 8 - Comportamentos Ofensivos (20.9%) deve ser BAIXO RISCO/VERDE (Excelente)', () => {
      const categoria = determinarCategoriaRisco(20.9, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo 9 - Comportamento de Jogo (75.5%) deve ser ALTO RISCO/VERMELHO (Atenção)', () => {
      const categoria = determinarCategoriaRisco(75.5, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Grupo 10 - Endividamento Financeiro (75.0%) deve ser ALTO RISCO/VERMELHO (Atenção)', () => {
      const categoria = determinarCategoriaRisco(75.0, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Valor exatamente 33% deve ser MÉDIO RISCO/AMARELO (início da faixa)', () => {
      const categoria = determinarCategoriaRisco(33, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('medio');
      expect(semaforo).toBe('amarelo');
    });

    test('Valor 32.9% deve ser BAIXO RISCO/VERDE', () => {
      const categoria = determinarCategoriaRisco(32.9, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Valor exatamente 66% deve ser MÉDIO RISCO/AMARELO', () => {
      const categoria = determinarCategoriaRisco(66, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('medio');
      expect(semaforo).toBe('amarelo');
    });

    test('Valor 66.1% deve ser ALTO RISCO/VERMELHO', () => {
      const categoria = determinarCategoriaRisco(66.1, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });
  });

  describe('Casos extremos', () => {
    test('Grupo Positivo com 0% deve ser ALTO RISCO/VERMELHO', () => {
      const categoria = determinarCategoriaRisco(0, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });

    test('Grupo Positivo com 100% deve ser BAIXO RISCO/VERDE', () => {
      const categoria = determinarCategoriaRisco(100, 'positiva');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo Negativo com 0% deve ser BAIXO RISCO/VERDE', () => {
      const categoria = determinarCategoriaRisco(0, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('baixo');
      expect(semaforo).toBe('verde');
    });

    test('Grupo Negativo com 100% deve ser ALTO RISCO/VERMELHO', () => {
      const categoria = determinarCategoriaRisco(100, 'negativa');
      const semaforo = determinarClassificacaoSemaforo(categoria);

      expect(categoria).toBe('alto');
      expect(semaforo).toBe('vermelho');
    });
  });
});
