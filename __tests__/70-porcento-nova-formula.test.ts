/**
 * Teste: Validação da nova fórmula de 70% (FLOOR, exclui inativadas)
 * 
 * Valida que:
 * 1. Arredondamento é para BAIXO (FLOOR, não CEIL)
 * 2. Inativadas NÃO contam no denominador
 * 3. Exemplos práticos funcionam conforme esperado
 */

describe('Nova Fórmula 70%: FLOOR + Exclui Inativadas', () => {
  /**
   * Função que simula a nova regra:
   * - total_liberadas_ativas = status NOT IN ('rascunho', 'inativada')
   * - threshold = FLOOR(0.7 * total_liberadas_ativas)
   * - libera se concluidas >= threshold
   */
  function pode70(
    concluidas: number,
    totalLiberadasAtivas: number
  ): boolean {
    if (totalLiberadasAtivas === 0) return false;
    const threshold = Math.floor(0.7 * totalLiberadasAtivas);
    return concluidas >= threshold;
  }

  describe('Exemplo principal (Lote #46 da tarefa)', () => {
    it('Liberou 10, inativou 4: 70% de (10-4) = 4.2 → FLOOR = 4', () => {
      const totalInicial = 10;
      const inativadas = 4;
      const totalLiberadasAtivas = totalInicial - inativadas; // 6
      const threshold = Math.floor(0.7 * totalLiberadasAtivas); // FLOOR(4.2) = 4

      expect(totalLiberadasAtivas).toBe(6);
      expect(threshold).toBe(4);
    });

    it('4 concluídas de 6 ativas → LIBERA (4 >= 4)', () => {
      expect(pode70(4, 6)).toBe(true);
    });

    it('3 concluídas de 6 ativas → NÃO libera (3 < 4)', () => {
      expect(pode70(3, 6)).toBe(false);
    });
  });

  describe('Cenários com FLOOR vs CEIL', () => {
    it('FLOOR(0.7 * 10) = 7 (não 7.0)', () => {
      expect(Math.floor(0.7 * 10)).toBe(7);
    });

    it('FLOOR(0.7 * 9) = 6 (não 7 que seria CEIL)', () => {
      expect(Math.floor(0.7 * 9)).toBe(6);
    });

    it('FLOOR(0.7 * 6) = 4 (não 5 que seria CEIL)', () => {
      expect(Math.floor(0.7 * 6)).toBe(4);
    });

    it('FLOOR(0.7 * 15) = 10 (não 11 que seria CEIL)', () => {
      expect(Math.floor(0.7 * 15)).toBe(10);
    });
  });

  describe('Inativadas não contam no denominador', () => {
    it('10 total com 1 inativada: denominador = 9', () => {
      const total = 10;
      const inativadas = 1;
      const denominador = total - inativadas;
      expect(denominador).toBe(9);
    });

    it('10 total com 4 inativadas: denominador = 6', () => {
      const total = 10;
      const inativadas = 4;
      const denominador = total - inativadas;
      expect(denominador).toBe(6);
    });

    it('100 total com 30 inativadas: denominador = 70, threshold = 49', () => {
      const total = 100;
      const inativadas = 30;
      const denominador = total - inativadas; // 70
      const threshold = Math.floor(0.7 * denominador); // FLOOR(49.0) = 49
      expect(denominador).toBe(70);
      expect(threshold).toBe(49);
    });
  });

  describe('Casos limites', () => {
    it('Sem inativadas (10 - 0): threshold = 7', () => {
      const threshold = Math.floor(0.7 * 10);
      expect(threshold).toBe(7);
    });

    it('Tudo inativado menos 1 (10 - 9 = 1): threshold = 0', () => {
      const threshold = Math.floor(0.7 * 1);
      expect(threshold).toBe(0);
    });

    it('Zero liberadas ativas: não libera (proteção contra divisão por zero)', () => {
      expect(pode70(0, 0)).toBe(false);
    });

    it('1 ativa, 0 concluídas: FLOOR(0.7 * 1) = 0 → libera', () => {
      expect(pode70(0, 1)).toBe(true); // threshold = 0, 0 >= 0
    });

    it('3 ativas, 2 concluídas: FLOOR(0.7 * 3) = 2 → libera', () => {
      expect(pode70(2, 3)).toBe(true); // threshold = 2, 2 >= 2
    });
  });

  describe('Tabela verdade (3 liberadas)', () => {
    it('1 concluída: não libera (threshold = 2)', () => {
      expect(pode70(1, 3)).toBe(false);
    });

    it('2 concluídas: libera (threshold = 2)', () => {
      expect(pode70(2, 3)).toBe(true);
    });

    it('3 concluídas: libera (threshold = 2)', () => {
      expect(pode70(3, 3)).toBe(true);
    });
  });

  describe('Exemplo realista: turma de 30 alunos', () => {
    const totalInicial = 30;

    it('Sem inativações: 21 concluídas de 30', () => {
      const threshold = Math.floor(0.7 * 30);
      expect(pode70(21, 30)).toBe(true);
      expect(threshold).toBe(21);
    });

    it('5 inativadas: 18 concluídas de 25', () => {
      const ativas = 30 - 5;
      const threshold = Math.floor(0.7 * ativas);
      expect(pode70(18, 25)).toBe(true);
      expect(threshold).toBe(17);
    });

    it('10 inativadas: 14 concluídas de 20', () => {
      const ativas = 30 - 10;
      const threshold = Math.floor(0.7 * ativas);
      expect(pode70(14, 20)).toBe(true);
      expect(threshold).toBe(14);
    });

    it('15 inativadas: 10 concluídas de 15', () => {
      const ativas = 30 - 15;
      const threshold = Math.floor(0.7 * ativas);
      expect(pode70(10, 15)).toBe(true);
      expect(threshold).toBe(10);
    });
  });
});
