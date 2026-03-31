/**
 * @file __tests__/lib/lote/types.test.ts
 * Testes para lib/lote/types.ts — constantes e tipos exportados
 *
 * Valida:
 *  - FILTROS_COLUNA_VAZIO tem todas as chaves esperadas com arrays vazios
 *  - Inclui chaves g1-g10 no FiltrosColuna
 */

import { FILTROS_COLUNA_VAZIO } from '@/lib/lote/types';
import type { FiltrosColuna, LotePageVariant } from '@/lib/lote/types';

describe('FILTROS_COLUNA_VAZIO', () => {
  it('deve ter chaves base: nome, cpf, nivel_cargo, status', () => {
    expect(FILTROS_COLUNA_VAZIO).toHaveProperty('nome', []);
    expect(FILTROS_COLUNA_VAZIO).toHaveProperty('cpf', []);
    expect(FILTROS_COLUNA_VAZIO).toHaveProperty('nivel_cargo', []);
    expect(FILTROS_COLUNA_VAZIO).toHaveProperty('status', []);
  });

  it('deve ter chaves de grupos g1 a g10 todos vazios', () => {
    for (let i = 1; i <= 10; i++) {
      const key = `g${i}` as keyof FiltrosColuna;
      expect(FILTROS_COLUNA_VAZIO[key]).toEqual([]);
    }
  });

  it('deve ter exatamente 14 chaves (4 base + 10 grupos)', () => {
    expect(Object.keys(FILTROS_COLUNA_VAZIO)).toHaveLength(14);
  });

  it('deve ser imutável por referência — não compartilhar estado entre usos', () => {
    // Arrange
    const copia = { ...FILTROS_COLUNA_VAZIO };

    // Act — mutação na cópia não deve afetar o original
    copia.nome = ['teste'];

    // Assert
    expect(FILTROS_COLUNA_VAZIO.nome).toEqual([]);
  });
});

describe('LotePageVariant type (compile-time)', () => {
  it('deve aceitar "entidade" como valor válido', () => {
    const variant: LotePageVariant = 'entidade';
    expect(variant).toBe('entidade');
  });

  it('deve aceitar "rh" como valor válido', () => {
    const variant: LotePageVariant = 'rh';
    expect(variant).toBe('rh');
  });
});
