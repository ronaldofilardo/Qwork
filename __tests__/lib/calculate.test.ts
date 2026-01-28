import {
  calcularScoreGrupo,
  categorizarScore,
  getCorSemaforo,
  getTextoCategoria,
  detectarAnomalias,
  calcularResultados,
} from '@/lib/calculate';

describe('lib/calculate', () => {
  describe('calcularScoreGrupo', () => {
    it('deve calcular score corretamente para respostas normais', () => {
      const respostas = [
        { item: 'Q1', valor: 75 },
        { item: 'Q2', valor: 50 },
        { item: 'Q3', valor: 100 },
      ];

      const score = calcularScoreGrupo(respostas, 'positiva');
      expect(score).toBe(75); // (75 + 50 + 100) / 3 = 75
    });

    it('deve retornar 0 para array vazio', () => {
      const score = calcularScoreGrupo([], 'positiva');
      expect(score).toBe(0);
    });

    it('deve lidar com scores decimais', () => {
      const respostas = [
        { item: 'Q1', valor: 66 },
        { item: 'Q2', valor: 67 },
      ];

      const score = calcularScoreGrupo(respostas, 'positiva');
      expect(score).toBe(66.5); // (66 + 67) / 2 = 66.5
    });

    it('deve detectar e corrigir anomalias', () => {
      // Score de 100 (todas respostas "Sempre") deve ser detectado como anomalia
      const respostas = [
        { item: 'Q1', valor: 100 },
        { item: 'Q2', valor: 100 },
        { item: 'Q3', valor: 100 },
      ];

      const score = calcularScoreGrupo(respostas, 'positiva', 1);
      expect(score).toBe(100); // Mantém o valor mas detecta a anomalia
    });

    it('deve tratar grupos específicos corretamente', () => {
      const respostasNegativas = [{ item: 'Q1', valor: -10 }];

      // Grupo 2 (Organização) com score negativo deve ser ajustado para 0
      const score = calcularScoreGrupo(respostasNegativas, 'positiva', 2);
      expect(score).toBe(0);
    });
  });

  describe('categorizarScore', () => {
    it('deve categorizar scores de grupos positivos corretamente', () => {
      expect(categorizarScore(80, 'positiva')).toBe('alto'); // > 66
      expect(categorizarScore(50, 'positiva')).toBe('medio'); // >= 33 e <= 66
      expect(categorizarScore(20, 'positiva')).toBe('baixo'); // < 33
    });

    it('deve categorizar scores de grupos negativos corretamente', () => {
      expect(categorizarScore(80, 'negativa')).toBe('alto'); // > 66 (problema)
      expect(categorizarScore(50, 'negativa')).toBe('medio'); // >= 33 e <= 66
      expect(categorizarScore(20, 'negativa')).toBe('baixo'); // < 33 (bom)
    });

    it('deve tratar scores negativos como alto risco', () => {
      expect(categorizarScore(-10, 'positiva')).toBe('alto');
      expect(categorizarScore(-5, 'negativa')).toBe('alto');
    });
  });

  describe('getCorSemaforo', () => {
    it('deve retornar cores corretas para grupos positivos', () => {
      expect(getCorSemaforo('alto', 'positiva')).toBe('#10B981'); // verde
      expect(getCorSemaforo('medio', 'positiva')).toBe('#F59E0B'); // amarelo
      expect(getCorSemaforo('baixo', 'positiva')).toBe('#EF4444'); // vermelho
    });

    it('deve retornar cores corretas para grupos negativos', () => {
      expect(getCorSemaforo('alto', 'negativa')).toBe('#EF4444'); // vermelho
      expect(getCorSemaforo('medio', 'negativa')).toBe('#F59E0B'); // amarelo
      expect(getCorSemaforo('baixo', 'negativa')).toBe('#10B981'); // verde
    });
  });

  describe('getTextoCategoria', () => {
    it('deve retornar textos corretos para grupos positivos', () => {
      expect(getTextoCategoria('alto', 'positiva')).toBe('Excelente');
      expect(getTextoCategoria('medio', 'positiva')).toBe('Adequado');
      expect(getTextoCategoria('baixo', 'positiva')).toBe('Precisa Melhorar');
    });

    it('deve retornar textos corretos para grupos negativos', () => {
      expect(getTextoCategoria('alto', 'negativa')).toBe('Atenção Necessária');
      expect(getTextoCategoria('medio', 'negativa')).toBe('Monitorar');
      expect(getTextoCategoria('baixo', 'negativa')).toBe('Adequado');
    });
  });

  describe('detectarAnomalias', () => {
    it('deve detectar scores fora do intervalo válido', () => {
      const anomalia1 = detectarAnomalias(-150, 'positiva');
      expect(anomalia1.isAnomalous).toBe(true);
      expect(anomalia1.adjustedScore).toBe(0);

      const anomalia2 = detectarAnomalias(150, 'positiva');
      expect(anomalia2.isAnomalous).toBe(true);
      expect(anomalia2.adjustedScore).toBe(100);
    });

    it('deve detectar scores negativos em escalas positivas', () => {
      const anomalia = detectarAnomalias(-25, 'positiva');
      expect(anomalia.isAnomalous).toBe(true);
      expect(anomalia.adjustedScore).toBe(0);
    });

    it('deve detectar padrões de resposta uniformes', () => {
      const padrões = [0, 25, 50, 75, 100];

      padrões.forEach((score) => {
        const anomalia = detectarAnomalias(score, 'positiva');
        expect(anomalia.isAnomalous).toBe(true);
        expect(anomalia.reason).toBe('Possível padrão de resposta uniforme');
      });
    });

    it('não deve detectar anomalia em scores normais', () => {
      const anomalia = detectarAnomalias(67.3, 'positiva');
      expect(anomalia.isAnomalous).toBe(false);
    });
  });

  describe('calcularResultados', () => {
    it('deve calcular resultados para múltiplos grupos', () => {
      const respostasPorGrupo = new Map([
        [
          1,
          [
            { item: 'Q1', valor: 75 },
            { item: 'Q2', valor: 80 },
          ],
        ],
        [
          2,
          [
            { item: 'Q3', valor: 40 },
            { item: 'Q13', valor: 60 },
          ],
        ],
      ]);

      const gruposTipo = new Map([
        [1, { dominio: 'Demandas', tipo: 'negativa' as const }],
        [2, { dominio: 'Organização', tipo: 'positiva' as const }],
      ]);

      const resultados = calcularResultados(respostasPorGrupo, gruposTipo);

      expect(resultados).toHaveLength(2);

      const resultado1 = resultados.find((r) => r.grupo === 1);
      expect(resultado1?.score).toBe(77.5); // (75 + 80) / 2
      expect(resultado1?.categoria).toBe('alto'); // negativa: score > 50 = problema

      const resultado2 = resultados.find((r) => r.grupo === 2);
      expect(resultado2?.score).toBe(50); // (40 + 60) / 2
      expect(resultado2?.categoria).toBe('medio'); // positiva: 50 >= 50 e <= 75 = médio
    });

    it('deve ignorar grupos sem informações de tipo', () => {
      const respostasPorGrupo = new Map([
        [1, [{ item: 'Q1', valor: 75 }]],
        [999, [{ item: 'Q2', valor: 50 }]], // Grupo inexistente
      ]);

      const gruposTipo = new Map([
        [1, { dominio: 'Demandas', tipo: 'negativa' as const }],
      ]);

      const resultados = calcularResultados(respostasPorGrupo, gruposTipo);

      expect(resultados).toHaveLength(1);
      expect(resultados[0].grupo).toBe(1);
    });
  });
});
