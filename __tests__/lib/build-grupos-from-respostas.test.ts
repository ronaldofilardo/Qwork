/**
 * @file __tests__/lib/build-grupos-from-respostas.test.ts
 * Testes: buildGruposFromRespostas
 */

import { buildGruposFromRespostas } from '@/lib/pdf/relatorio-individual';

describe('buildGruposFromRespostas', () => {
  it('deve filtrar respostas inválidas e criar grupos corretamente', () => {
    const respostas = [
      { grupo: 1, item: 'Q1', valor: 75 }, // grupo 1
      { grupo: 1, item: 'Q2', valor: 50 }, // grupo 1
      { grupo: 2, item: 'Q17', valor: 50 }, // grupo 2
    ];

    const grupos = buildGruposFromRespostas(respostas as any);

    // Deve conter apenas grupos 1 e 2
    expect(grupos.map((g) => g.grupoId).sort()).toEqual([1, 2]);

    const g1 = grupos.find((g) => g.grupoId === 1)!;
    expect(g1).toBeDefined();
    expect(g1.media).toBe(62.5); // (75 + 50) / 2

    const g2 = grupos.find((g) => g.grupoId === 2)!;
    expect(g2).toBeDefined();
    expect(g2.media).toBe(50);
  });
});
