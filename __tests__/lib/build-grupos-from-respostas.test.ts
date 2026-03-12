/**
 * @file __tests__/lib/build-grupos-from-respostas.test.ts
 * Testes: buildGruposFromRespostas
 */

import { buildGruposFromRespostas } from '@/lib/pdf/relatorio-individual';

describe('buildGruposFromRespostas', () => {
  it('deve filtrar respostas inválidas e criar grupos corretamente', () => {
    const respostas = [
      { grupo: 1, item: 'Q1', valor: 75 }, // válido
      { grupo: 1, item: 'Q999', valor: 50 }, // item inexistente -> deve ser ignorado
      { grupo: 2, item: 'Q13', valor: -1 }, // valor inválido -> ignorado
      { grupo: 2, item: 'Q17', valor: 50 }, // válido
    ];

    const grupos = buildGruposFromRespostas(respostas as any);

    // Deve conter apenas grupos 1 e 2
    expect(grupos.map((g) => g.id).sort()).toEqual([1, 2]);

    const g1 = grupos.find((g) => g.id === 1)!;
    expect(g1.respostas.map((r) => r.item)).toEqual(['Q1']);

    const g2 = grupos.find((g) => g.id === 2)!;
    expect(g2.respostas.map((r) => r.item)).toEqual(['Q17']);
  });
});
