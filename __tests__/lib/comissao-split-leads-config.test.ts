/**
 * Testes para comissão split em leads_representante
 *
 * Cobre:
 * - calcularValoresComissao (lib/leads-config.ts)
 * - calcularRequerAprovacao atualizado com percVendedor
 * - MAX_PERCENTUAL_COMISSAO = 40
 * - Validações em API routes (lógica replicada)
 */
import {
  calcularValoresComissao,
  calcularRequerAprovacao,
  MAX_PERCENTUAL_COMISSAO,
  CUSTO_POR_AVALIACAO,
} from '@/lib/leads-config';

// ─────────────────────────────────────────────────────────────────────────
// 1. Constantes
// ─────────────────────────────────────────────────────────────────────────

describe('Constantes de comissão split', () => {
  test('MAX_PERCENTUAL_COMISSAO deve ser 40', () => {
    expect(MAX_PERCENTUAL_COMISSAO).toBe(40);
  });

  test('CUSTO_POR_AVALIACAO entidade deve ser 15', () => {
    expect(CUSTO_POR_AVALIACAO.entidade).toBe(15);
  });

  test('CUSTO_POR_AVALIACAO clinica deve ser 5', () => {
    expect(CUSTO_POR_AVALIACAO.clinica).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. calcularRequerAprovacao com percentualComissaoVendedor
// ─────────────────────────────────────────────────────────────────────────

describe('calcularRequerAprovacao — com vendedor', () => {
  test('rep 20% + vendedor 0% — entidade R$100: não requer (QWork = R$80 > R$15)', () => {
    expect(calcularRequerAprovacao(100, 20, 'entidade', 0)).toBe(false);
  });

  test('rep 20% + vendedor 20% — entidade R$100: requer (QWork = R$60 > R$15, false)', () => {
    // 100 × (1 - 0.40) = 60, custo = 15 → 60 >= 15 → false
    expect(calcularRequerAprovacao(100, 20, 'entidade', 20)).toBe(false);
  });

  test('rep 15% + vendedor 25% — entidade R$20: requer (QWork = R$12 < R$15)', () => {
    // 20 × (1 - 0.40) = 12, custo = 15 → 12 < 15 → true
    expect(calcularRequerAprovacao(20, 15, 'entidade', 25)).toBe(true);
  });

  test('rep 10% + vendedor 5% — clinica R$10: não requer (QWork = R$8.5 > R$5)', () => {
    // 10 × (1 - 0.15) = 8.5, custo = 5 → false
    expect(calcularRequerAprovacao(10, 10, 'clinica', 5)).toBe(false);
  });

  test('rep 30% + vendedor 10% — clinica R$5: requer (QWork = R$3 < R$5)', () => {
    // 5 × (1 - 0.40) = 3, custo = 5 → true
    expect(calcularRequerAprovacao(5, 30, 'clinica', 10)).toBe(true);
  });

  test('valor_negociado 0 nunca requer aprovação', () => {
    expect(calcularRequerAprovacao(0, 30, 'entidade', 10)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. calcularValoresComissao — cenário normal (acima do custo)
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — cenário normal', () => {
  test('R$100, rep 20%, vendedor 0%, entidade', () => {
    const r = calcularValoresComissao(100, 20, 0, 'entidade');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(20);
    expect(r.valorVendedor).toBe(0);
    expect(r.valorQWork).toBe(80);
    expect(r.percentualTotal).toBe(20);
  });

  test('R$200, rep 15%, vendedor 10%, entidade', () => {
    const r = calcularValoresComissao(200, 15, 10, 'entidade');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(30);
    expect(r.valorVendedor).toBe(20);
    expect(r.valorQWork).toBe(150);
    expect(r.percentualTotal).toBe(25);
  });

  test('R$500, rep 20%, vendedor 20%, clinica', () => {
    const r = calcularValoresComissao(500, 20, 20, 'clinica');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(100);
    expect(r.valorVendedor).toBe(100);
    expect(r.valorQWork).toBe(300);
    expect(r.percentualTotal).toBe(40);
  });

  test('sem comissão — R$100, rep 0%, vendedor 0%, entidade', () => {
    const r = calcularValoresComissao(100, 0, 0, 'entidade');
    expect(r.valorRep).toBe(0);
    expect(r.valorVendedor).toBe(0);
    expect(r.valorQWork).toBe(100);
    expect(r.abaixoCusto).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. calcularValoresComissao — cenário below-cost
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — abaixo do custo (below-cost)', () => {
  test('R$20, rep 40%, vendedor 0%, entidade → abaixoCusto=true, pool=5', () => {
    // custo=15, valorQWork = 20 - 8 = 12 < 15 → abaixoCusto
    // fórmula direta: valorRep = 20×0.40 = 8, valorQWork = 12
    const r = calcularValoresComissao(20, 40, 0, 'entidade');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(5);
    expect(r.valorRep).toBe(8);
    expect(r.valorVendedor).toBe(0);
    expect(r.valorQWork).toBe(12);
  });

  test('R$20, rep 20%, vendedor 20%, entidade → abaixoCusto=true', () => {
    // valorRep=4, valorVend=4, valorQWork=12 < 15 → abaixoCusto
    const r = calcularValoresComissao(20, 20, 20, 'entidade');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(5);
    expect(r.valorRep).toBe(4);
    expect(r.valorVendedor).toBe(4);
    expect(r.valorQWork).toBe(12);
  });

  test('R$14, 40%, entidade — valorQWork < custo → abaixoCusto', () => {
    // valorRep = 14×0.40 = 5.6, valorQWork = 8.4 < 15 → abaixoCusto
    // poolDisponivel = max(0, 14-15) = 0
    const r = calcularValoresComissao(14, 40, 0, 'entidade');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(0);
    expect(r.valorRep).toBe(5.6);
    expect(r.valorVendedor).toBe(0);
    expect(r.valorQWork).toBeCloseTo(8.4, 2);
  });

  test('R$7, rep 30%, vendedor 10%, clinica → below-cost (custo=5)', () => {
    // valorRep = 2.1, valorVend = 0.7, valorQWork = 4.2 < 5 → abaixoCusto
    const r = calcularValoresComissao(7, 30, 10, 'clinica');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(2);
    expect(r.valorRep).toBeCloseTo(2.1, 2);
    expect(r.valorVendedor).toBeCloseTo(0.7, 2);
    expect(r.valorQWork).toBeCloseTo(4.2, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Validações de API (lógica replicada)
// ─────────────────────────────────────────────────────────────────────────

describe('Validações de API — regras de comissão split', () => {
  function validarComissao(percRep: number, percVend: number) {
    const max = MAX_PERCENTUAL_COMISSAO;
    if (percRep < 0 || percRep > max)
      return { ok: false, error: 'percRep fora do intervalo' };
    if (percVend < 0 || percVend > max)
      return { ok: false, error: 'percVend fora do intervalo' };
    if (percRep + percVend > max)
      return { ok: false, error: 'total excede máximo' };
    return { ok: true };
  }

  test('rep 20% + vendedor 10% = 30% ≤ 40% → válido', () => {
    expect(validarComissao(20, 10).ok).toBe(true);
  });

  test('rep 20% + vendedor 20% = 40% = máximo → válido', () => {
    expect(validarComissao(20, 20).ok).toBe(true);
  });

  test('rep 25% + vendedor 20% = 45% > 40% → inválido', () => {
    const v = validarComissao(25, 20);
    expect(v.ok).toBe(false);
    expect(v.error).toContain('total excede máximo');
  });

  test('rep 41% → inválido (excede máximo individual)', () => {
    const v = validarComissao(41, 0);
    expect(v.ok).toBe(false);
  });

  test('rep 0% + vendedor 0% → válido', () => {
    expect(validarComissao(0, 0).ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Interface ValoresComissao — shape check
// ─────────────────────────────────────────────────────────────────────────

describe('ValoresComissao — shape da interface', () => {
  test('resultado contém todos os campos esperados', () => {
    const r = calcularValoresComissao(100, 15, 5, 'entidade');
    expect(r).toHaveProperty('valorRep');
    expect(r).toHaveProperty('valorVendedor');
    expect(r).toHaveProperty('valorQWork');
    expect(r).toHaveProperty('abaixoCusto');
    expect(r).toHaveProperty('poolDisponivel');
    expect(r).toHaveProperty('percentualTotal');
  });

  test('percentualTotal = percRep + percVendedor', () => {
    const r = calcularValoresComissao(100, 15, 5, 'entidade');
    expect(r.percentualTotal).toBe(20);
  });

  test('valorRep + valorVendedor + valorQWork ≈ valorNegociado', () => {
    const r = calcularValoresComissao(100, 15, 5, 'entidade');
    const soma = r.valorRep + r.valorVendedor + r.valorQWork;
    expect(soma).toBeCloseTo(100, 2);
  });

  test('soma preserved no cenário below-cost', () => {
    const r = calcularValoresComissao(20, 20, 20, 'entidade');
    const soma = r.valorRep + r.valorVendedor + r.valorQWork;
    expect(soma).toBeCloseTo(20, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. Caso concreto da UI (screenshot): R$7, rep 10%, vend 10%, clínica
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — caso UI R$7 rep 10% vend 10% clínica', () => {
  let r: ReturnType<typeof calcularValoresComissao>;

  beforeAll(() => {
    r = calcularValoresComissao(7, 10, 10, 'clinica');
  });

  test('valorRep = R$0,70', () => {
    expect(r.valorRep).toBeCloseTo(0.7, 2);
  });

  test('valorVendedor = R$0,70', () => {
    expect(r.valorVendedor).toBeCloseTo(0.7, 2);
  });

  test('valorQWork = R$5,60', () => {
    expect(r.valorQWork).toBeCloseTo(5.6, 2);
  });

  test('total comissões = R$1,40', () => {
    expect(r.valorRep + r.valorVendedor).toBeCloseTo(1.4, 2);
  });

  test('valorRep + valorVendedor + valorQWork = R$7,00', () => {
    const soma = r.valorRep + r.valorVendedor + r.valorQWork;
    expect(soma).toBeCloseTo(7, 2);
  });

  test('não é abaixo do custo (5,60 ≥ 5,00)', () => {
    expect(r.abaixoCusto).toBe(false);
  });

  test('percentualTotal = 20%', () => {
    expect(r.percentualTotal).toBe(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. calcularValoresComissao — fórmula direta: sem redistribuição
//    Verifica que o valor QWork determina abaixoCusto (não redistribui)
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — fórmula direta (sem redistribuição)', () => {
  test('R$7, rep 12%, vend 28%, clínica → QWork=4,20, abaixoCusto=true', () => {
    // Antes: redistribuição dava QWork=6.20 mas abaixoCusto=true (inconsistente)
    // Agora: fórmula direta → 7 - 0.84 - 1.96 = 4.20 < 5.00 → abaixoCusto=true (consistente)
    const r = calcularValoresComissao(7, 12, 28, 'clinica');
    expect(r.valorRep).toBeCloseTo(0.84, 2);
    expect(r.valorVendedor).toBeCloseTo(1.96, 2);
    expect(r.valorQWork).toBeCloseTo(4.2, 2);
    expect(r.abaixoCusto).toBe(true); // 4.20 < 5.00
  });

  test('R$8, rep 12%, vend 28%, clínica → QWork=4,80, abaixoCusto=true', () => {
    const r = calcularValoresComissao(8, 12, 28, 'clinica');
    expect(r.valorQWork).toBeCloseTo(4.8, 2);
    expect(r.abaixoCusto).toBe(true); // 4.80 < 5.00
    const soma = r.valorRep + r.valorVendedor + r.valorQWork;
    expect(soma).toBeCloseTo(8, 2);
  });

  test('R$9, rep 12%, vend 28%, clínica → QWork=5,40, abaixoCusto=false', () => {
    const r = calcularValoresComissao(9, 12, 28, 'clinica');
    expect(r.valorQWork).toBeCloseTo(5.4, 2);
    expect(r.abaixoCusto).toBe(false); // 5.40 >= 5.00
    const soma = r.valorRep + r.valorVendedor + r.valorQWork;
    expect(soma).toBeCloseTo(9, 2);
  });

  test('soma sempre é igual ao valorNegociado independente de abaixoCusto', () => {
    const cases: [number, number, number, 'entidade' | 'clinica'][] = [
      [7, 12, 28, 'clinica'],
      [20, 40, 0, 'entidade'],
      [14, 40, 0, 'entidade'],
      [100, 15, 5, 'entidade'],
    ];
    for (const [v, rep, vend, tipo] of cases) {
      const r = calcularValoresComissao(v, rep, vend, tipo);
      const soma = r.valorRep + r.valorVendedor + r.valorQWork;
      expect(soma).toBeCloseTo(v, 1);
    }
  });

  test('calcularRequerAprovacao consistente com calcularValoresComissao', () => {
    // Ambas as funções devem concordar sobre abaixoCusto
    const cases: [number, number, number, 'entidade' | 'clinica'][] = [
      [7, 10, 10, 'clinica'],
      [7, 12, 28, 'clinica'],
      [100, 20, 10, 'entidade'],
      [20, 20, 20, 'entidade'],
    ];
    for (const [v, rep, vend, tipo] of cases) {
      const comissao = calcularValoresComissao(v, rep, vend, tipo);
      const requer = calcularRequerAprovacao(v, rep, tipo, vend);
      expect(requer).toBe(comissao.abaixoCusto);
    }
  });
});
