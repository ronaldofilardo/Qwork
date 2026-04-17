/**
 * Testes unitários para lib/asaas/subconta.ts
 *
 * Cobre:
 * - calcularSplit(): modelo percentual e custo_fixo
 * - montarSplitAsaas(): payloads para Asaas
 * - CUSTO_MINIMO e PERCENTUAL_MAXIMO_COMISSAO constantes
 *
 * @see lib/asaas/subconta.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  calcularSplit,
  montarSplitAsaas,
  CUSTO_MINIMO,
  PERCENTUAL_MAXIMO_COMISSAO,
} from '@/lib/asaas/subconta';

// ─── Constantes ──────────────────────────────────────────────────────────────

describe('Constantes de negócio', () => {
  it('CUSTO_MINIMO.entidade deve ser 12', () => {
    expect(CUSTO_MINIMO.entidade).toBe(12);
  });

  it('CUSTO_MINIMO.clinica deve ser 5', () => {
    expect(CUSTO_MINIMO.clinica).toBe(5);
  });

  it('PERCENTUAL_MAXIMO_COMISSAO deve ser 40', () => {
    expect(PERCENTUAL_MAXIMO_COMISSAO).toBe(40);
  });
});

// ─── calcularSplit — modelo percentual ────────────────────────────────────────

describe('calcularSplit() — modelo percentual', () => {
  it('deve calcular corretamente (entidade, 20%)', () => {
    const res = calcularSplit('percentual', 100, 'entidade', 20);
    expect(res.modelo).toBe('percentual');
    expect(res.valorRepresentante).toBe(20);
    expect(res.valorQWork).toBe(80);
    expect(res.percentualAplicado).toBe(20);
    expect(res.viavel).toBe(true);
  });

  it('deve calcular corretamente (clinica, 10%)', () => {
    const res = calcularSplit('percentual', 50, 'clinica', 10);
    expect(res.valorRepresentante).toBe(5);
    expect(res.valorQWork).toBe(45);
    expect(res.viavel).toBe(true);
  });

  it('deve marcar inviável quando valorQWork < CUSTO_MINIMO.entidade', () => {
    // valor=20, 80% → valorRep=16, valorQWork=4 < 12 → inviável
    const res = calcularSplit('percentual', 20, 'entidade', 80);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando valorQWork < CUSTO_MINIMO.clinica', () => {
    // valor=6, 30% → valorRep=1.8, valorQWork=4.2 < 5 → inviável
    const res = calcularSplit('percentual', 6, 'clinica', 30);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando percentual > PERCENTUAL_MAXIMO_COMISSAO', () => {
    const res = calcularSplit('percentual', 1000, 'entidade', 41);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando percentual é undefined', () => {
    const res = calcularSplit('percentual', 100, 'entidade', undefined);
    expect(res.viavel).toBe(false);
    expect(res.valorRepresentante).toBe(0);
  });

  it('deve arredondar para 2 casas decimais', () => {
    // 100 * 33.33% = 33.33; valorQWork = 66.67
    const res = calcularSplit('percentual', 100, 'entidade', 33.33);
    expect(res.valorRepresentante).toBe(33.33);
    expect(res.valorQWork).toBe(66.67);
  });

  it('percentual máximo (40%) deve ser viável para entidade com valor > 25', () => {
    // valor=30, 40% → valorRep=12, valorQWork=18 > 12 → viável
    const res = calcularSplit('percentual', 30, 'entidade', 40);
    expect(res.viavel).toBe(true);
  });
});

// ─── calcularSplit — modelo custo_fixo ───────────────────────────────────────

describe('calcularSplit() — modelo custo_fixo', () => {
  it('deve calcular corretamente (entidade)', () => {
    const res = calcularSplit('custo_fixo', 100, 'entidade');
    expect(res.modelo).toBe('custo_fixo');
    expect(res.valorQWork).toBe(12);
    expect(res.valorRepresentante).toBe(88);
    expect(res.viavel).toBe(true);
  });

  it('deve calcular corretamente (clinica)', () => {
    const res = calcularSplit('custo_fixo', 20, 'clinica');
    expect(res.valorQWork).toBe(5);
    expect(res.valorRepresentante).toBe(15);
    expect(res.viavel).toBe(true);
  });

  it('deve ser viável quando valorLaudo === CUSTO_MINIMO (zero para representante)', () => {
    // valorRep = 0, viavel porque valorRep >= 0
    const res = calcularSplit('custo_fixo', 12, 'entidade');
    expect(res.valorRepresentante).toBe(0);
    expect(res.viavel).toBe(true);
  });

  it('deve marcar inviável quando valorLaudo < CUSTO_MINIMO (representante ficaria negativo)', () => {
    const res = calcularSplit('custo_fixo', 10, 'entidade');
    expect(res.viavel).toBe(false);
    expect(res.valorRepresentante).toBeLessThan(0);
  });

  it('percentual não é usado no custo_fixo — percentualAplicado deve ser undefined', () => {
    const res = calcularSplit('custo_fixo', 100, 'entidade', 20);
    expect(res.percentualAplicado).toBeUndefined();
  });
});

// ─── montarSplitAsaas ────────────────────────────────────────────────────────

describe('montarSplitAsaas()', () => {
  it('deve retornar null se walletId for null', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    expect(montarSplitAsaas(null, split)).toBeNull();
  });

  it('deve retornar null se walletId for undefined', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    expect(montarSplitAsaas(undefined, split)).toBeNull();
  });

  it('deve retornar null se split for inviável', () => {
    const split = calcularSplit('percentual', 20, 'entidade', 80);
    expect(split.viavel).toBe(false);
    expect(montarSplitAsaas('wallet_123', split)).toBeNull();
  });

  it('deve retornar null se valorRepresentante <= 0', () => {
    const split = calcularSplit('custo_fixo', 12, 'entidade');
    // valorRepresentante = 0
    expect(montarSplitAsaas('wallet_123', split)).toBeNull();
  });

  it('deve retornar array com um item para split viável', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    const result = montarSplitAsaas('wallet_abc', split);
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(1);
    expect(result![0].walletId).toBe('wallet_abc');
  });

  it('deve usar fixedValue para modelo custo_fixo', () => {
    const split = calcularSplit('custo_fixo', 100, 'entidade');
    const result = montarSplitAsaas('wallet_xyz', split);
    expect(result).not.toBeNull();
    expect(result![0].fixedValue).toBeDefined();
    expect(result![0].fixedValue).toBe(split.valorRepresentante);
    expect(result![0].percentualValue).toBeUndefined();
  });

  it('deve usar fixedValue para modelo percentual (Asaas usa fixedValue para exatidão)', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 25);
    const result = montarSplitAsaas('wallet_xyz', split);
    expect(result).not.toBeNull();
    expect(result![0].fixedValue).toBe(split.valorRepresentante);
    expect(result![0].fixedValue).toBe(25);
  });
});
