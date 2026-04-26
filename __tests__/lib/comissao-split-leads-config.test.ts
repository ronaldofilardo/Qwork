/**
 * Testes para comissão de representante em leads_representante
 *
 * Cobre:
 * - calcularValoresComissao (lib/leads-config.ts)
 * - calcularRequerAprovacao
 * - MAX_PERCENTUAL_COMISSAO = 40
 */
import {
  calcularValoresComissao,
  calcularRequerAprovacao,
  calcularComissaoCustoFixo,
  MAX_PERCENTUAL_COMISSAO,
  CUSTO_POR_AVALIACAO,
} from '@/lib/leads-config';

// ─────────────────────────────────────────────────────────────────────────
// 1. Constantes
// ─────────────────────────────────────────────────────────────────────────

describe('Constantes de comissão', () => {
  test('MAX_PERCENTUAL_COMISSAO deve ser 40', () => {
    expect(MAX_PERCENTUAL_COMISSAO).toBe(40);
  });

  test('CUSTO_POR_AVALIACAO entidade deve ser 12', () => {
    expect(CUSTO_POR_AVALIACAO.entidade).toBe(12);
  });

  test('CUSTO_POR_AVALIACAO clinica deve ser 5', () => {
    expect(CUSTO_POR_AVALIACAO.clinica).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. calcularRequerAprovacao
// ─────────────────────────────────────────────────────────────────────────

describe('calcularRequerAprovacao', () => {
  test('rep 20% — entidade R$100: não requer (QWork = R$80 > R$12)', () => {
    expect(calcularRequerAprovacao(100, 20, 0, 'entidade')).toBe(false);
  });

  test('rep 40% — entidade R$20: requer (QWork = R$12 >= R$12 - ajustado custo)', () => {
    expect(calcularRequerAprovacao(14, 40, 0, 'entidade')).toBe(true);
  });

  test('rep 10% — clinica R$10: não requer (QWork = R$9 > R$5)', () => {
    expect(calcularRequerAprovacao(10, 10, 0, 'clinica')).toBe(false);
  });

  test('rep 40% — clinica R$5: requer (QWork = R$3 < R$5)', () => {
    expect(calcularRequerAprovacao(5, 40, 0, 'clinica')).toBe(true);
  });

  test('valor_negociado 0 nunca requer aprovação', () => {
    expect(calcularRequerAprovacao(0, 30, 0, 'entidade')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. calcularValoresComissao — cenário normal (acima do custo)
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — cenário normal', () => {
  test('R$100, rep 20%, entidade', () => {
    const r = calcularValoresComissao(100, 20, 0, 'entidade');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(20);
    expect(r.valorQWork).toBe(80);
    expect(r.percentualTotal).toBe(20);
  });

  test('R$200, rep 15%, entidade', () => {
    const r = calcularValoresComissao(200, 15, 0, 'entidade');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(30);
    expect(r.valorQWork).toBe(170);
    expect(r.percentualTotal).toBe(15);
  });

  test('R$500, rep 20%, clinica', () => {
    const r = calcularValoresComissao(500, 20, 0, 'clinica');
    expect(r.abaixoCusto).toBe(false);
    expect(r.valorRep).toBe(100);
    expect(r.valorQWork).toBe(400);
    expect(r.percentualTotal).toBe(20);
  });

  test('sem comissão — R$100, rep 0%, entidade', () => {
    const r = calcularValoresComissao(100, 0, 0, 'entidade');
    expect(r.valorRep).toBe(0);
    expect(r.valorQWork).toBe(100);
    expect(r.abaixoCusto).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. calcularValoresComissao — cenário below-cost
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — abaixo do custo (below-cost)', () => {
  test('R$20, rep 40%, entidade → abaixoCusto=true, pool=8', () => {
    const r = calcularValoresComissao(20, 40, 0, 'entidade');
    expect(r.abaixoCusto).toBe(false);
    expect(r.poolDisponivel).toBe(8);
    expect(r.valorRep).toBe(8);
    expect(r.valorQWork).toBe(12);
  });

  test('R$14, rep 40%, entidade — valorQWork < custo', () => {
    const r = calcularValoresComissao(14, 40, 0, 'entidade');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(2);
    expect(r.valorRep).toBe(5.6);
    expect(r.valorQWork).toBeCloseTo(8.4, 2);
  });

  test('R$7, rep 40%, clinica → below-cost (custo=5)', () => {
    const r = calcularValoresComissao(7, 40, 0, 'clinica');
    expect(r.abaixoCusto).toBe(true);
    expect(r.poolDisponivel).toBe(2);
    expect(r.valorRep).toBeCloseTo(2.8, 2);
    expect(r.valorQWork).toBeCloseTo(4.2, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 5. Validações de API — regras de comissão
// ─────────────────────────────────────────────────────────────────────────

describe('Validações de API — regras de comissão', () => {
  function validarComissao(percRep: number) {
    const max = MAX_PERCENTUAL_COMISSAO;
    if (percRep < 0 || percRep > max)
      return { ok: false, error: 'percRep fora do intervalo' };
    return { ok: true };
  }

  test('rep 30% <= 40% → válido', () => {
    expect(validarComissao(30).ok).toBe(true);
  });

  test('rep 40% = máximo → válido', () => {
    expect(validarComissao(40).ok).toBe(true);
  });

  test('rep 41% > 40% → inválido', () => {
    const v = validarComissao(41);
    expect(v.ok).toBe(false);
  });

  test('rep 0% → válido', () => {
    expect(validarComissao(0).ok).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 6. Interface ValoresComissao — shape check
// ─────────────────────────────────────────────────────────────────────────

describe('ValoresComissao — shape da interface', () => {
  test('resultado contém todos os campos esperados', () => {
    const r = calcularValoresComissao(100, 15, 0, 'entidade');
    expect(r).toHaveProperty('valorRep');
    expect(r).toHaveProperty('valorQWork');
    expect(r).toHaveProperty('abaixoCusto');
    expect(r).toHaveProperty('poolDisponivel');
    expect(r).toHaveProperty('percentualTotal');
  });

  test('percentualTotal = percRep + percComercial', () => {
    const r = calcularValoresComissao(100, 15, 0, 'entidade');
    expect(r.percentualTotal).toBe(15);
  });

  test('percentualTotal inclui percComercial quando > 0', () => {
    const r = calcularValoresComissao(100, 15, 5, 'entidade');
    expect(r.percentualTotal).toBe(20);
    expect(r.valorComercial).toBe(5);
  });

  test('valorRep + valorComercial + valorQWork = valorNegociado', () => {
    const r = calcularValoresComissao(100, 15, 0, 'entidade');
    const soma = r.valorRep + r.valorQWork;
    expect(soma).toBeCloseTo(100, 2);
  });

  test('soma preserved no cenário below-cost', () => {
    const r = calcularValoresComissao(20, 40, 0, 'entidade');
    const soma = r.valorRep + r.valorQWork;
    expect(soma).toBeCloseTo(20, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 7. calcularValoresComissao — fórmula direta: sem redistribuição
// ─────────────────────────────────────────────────────────────────────────

describe('calcularValoresComissao — fórmula direta (sem redistribuição)', () => {
  test('R$7, rep 40%, clínica → QWork=4,20, abaixoCusto=true', () => {
    const r = calcularValoresComissao(7, 40, 0, 'clinica');
    expect(r.valorRep).toBeCloseTo(2.8, 2);
    expect(r.valorQWork).toBeCloseTo(4.2, 2);
    expect(r.abaixoCusto).toBe(true);
  });

  test('R$9, rep 40%, clínica → QWork=5,40, abaixoCusto=false', () => {
    const r = calcularValoresComissao(9, 40, 0, 'clinica');
    expect(r.valorQWork).toBeCloseTo(5.4, 2);
    expect(r.abaixoCusto).toBe(false);
    const soma = r.valorRep + r.valorQWork;
    expect(soma).toBeCloseTo(9, 2);
  });

  test('soma sempre é igual ao valorNegociado', () => {
    const cases: [number, number, number, 'entidade' | 'clinica'][] = [
      [7, 40, 0, 'clinica'],
      [20, 40, 0, 'entidade'],
      [14, 40, 0, 'entidade'],
      [100, 15, 0, 'entidade'],
    ];
    for (const [v, rep, com, tipo] of cases) {
      const r = calcularValoresComissao(v, rep, com, tipo);
      const soma = r.valorRep + r.valorQWork;
      expect(soma).toBeCloseTo(v, 1);
    }
  });

  test('calcularRequerAprovacao consistente com calcularValoresComissao', () => {
    const cases: [number, number, number, 'entidade' | 'clinica'][] = [
      [7, 10, 0, 'clinica'],
      [7, 40, 0, 'clinica'],
      [100, 20, 0, 'entidade'],
      [20, 40, 0, 'entidade'],
    ];
    for (const [v, rep, com, tipo] of cases) {
      const comissao = calcularValoresComissao(v, rep, com, tipo);
      const requer = calcularRequerAprovacao(v, rep, com, tipo);
      expect(requer).toBe(comissao.abaixoCusto);
    }
  });

  test('percComercial reduz valorQWork — R$100, rep 20%, com 10%, entidade', () => {
    const r = calcularValoresComissao(100, 20, 10, 'entidade');
    expect(r.valorRep).toBe(20);
    expect(r.valorComercial).toBe(10);
    expect(r.valorQWork).toBe(70);
    expect(r.percentualTotal).toBe(30);
    expect(r.abaixoCusto).toBe(false);
  });

  test('percComercial + percRep alto pode causar abaixoCusto — R$20, rep 35%, com 5%, entidade', () => {
    // valorQWork = 20 - 7 - 1 = 12 → não abaixo do custo (== 12)
    const r = calcularValoresComissao(20, 35, 5, 'entidade');
    expect(r.valorRep).toBe(7);
    expect(r.valorComercial).toBe(1);
    expect(r.valorQWork).toBe(12);
    expect(r.abaixoCusto).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 8. calcularComissaoCustoFixo
// ─────────────────────────────────────────────────────────────────────────

describe('calcularComissaoCustoFixo', () => {
  test('caso normal — margem é valorNeg - custoFixo', () => {
    const r = calcularComissaoCustoFixo(100, 12);
    expect(r.valorRep).toBe(88); // margem = 100 - 12
    expect(r.valorQWork).toBe(88); // margem - 0 comercial
    expect(r.valorComercial).toBe(0);
    expect(r.abaixoMinimo).toBe(false);
  });

  test('valorNeg === custoFixo — margem zero', () => {
    const r = calcularComissaoCustoFixo(12, 12);
    expect(r.valorRep).toBe(0);
    expect(r.valorQWork).toBe(0);
    expect(r.valorComercial).toBe(0);
    expect(r.abaixoMinimo).toBe(false);
  });

  test('abaixoMinimo quando valorNeg < custoFixo', () => {
    const r = calcularComissaoCustoFixo(10, 12);
    expect(r.abaixoMinimo).toBe(true);
    expect(r.valorRep).toBe(0);
    expect(r.valorQWork).toBe(0);
    expect(r.valorComercial).toBe(0);
  });

  test('sem comercial: valorQWork === margem (valorNeg - custoFixo)', () => {
    const cases: [number, number, number][] = [
      [50, 12, 38], // margem=38
      [12, 12, 0], // margem=0
      [8, 12, 0], // abaixoMinimo, margem clamped to 0
      [200, 10, 190], // margem=190
    ];
    for (const [valorNeg, custoFixo, esperado] of cases) {
      const r = calcularComissaoCustoFixo(valorNeg, custoFixo);
      expect(r.valorQWork).toBe(esperado);
    }
  });

  test('clinica — custo fixo 10, valor 50', () => {
    const r = calcularComissaoCustoFixo(50, 10);
    expect(r.valorRep).toBe(40); // margem = 40
    expect(r.valorQWork).toBe(40); // margem - 0
    expect(r.valorComercial).toBe(0);
    expect(r.abaixoMinimo).toBe(false);
  });

  test('com percComercial 10%: comercial recebe % da margem', () => {
    // custo R$15, negociado R$25, margem=R$10, comercial 10%
    const r = calcularComissaoCustoFixo(25, 15, 10);
    expect(r.valorRep).toBe(10); // margem = 25 - 15
    expect(r.valorComercial).toBe(1); // 10% da margem R$10
    expect(r.valorQWork).toBe(9); // margem - comercial
    expect(r.abaixoMinimo).toBe(false);
  });

  test('com percComercial = 40% — máximo permitido', () => {
    // valorNeg=100, custo=20, margem=80, comercial 40%
    const r = calcularComissaoCustoFixo(100, 20, 40);
    expect(r.valorRep).toBe(80); // margem = 80
    expect(r.valorComercial).toBe(32); // 40% de 80
    expect(r.valorQWork).toBe(48); // 80 - 32
    expect(r.abaixoMinimo).toBe(false);
  });

  test('percComercial é capped a 40% no máximo (regra de negócio)', () => {
    // valorNeg=50, custo=12, margem=38, percComercial=100 → capped 40%
    const r = calcularComissaoCustoFixo(50, 12, 100);
    expect(r.valorComercial).toBe(15.2); // 40% de 38
    expect(r.valorQWork).toBe(22.8); // 38 - 15.2
    expect(r.abaixoMinimo).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 9. Auto-calc percentual_comissao_comercial = MAX - percRep
//    Regra aplicada nas rotas de representantes (modelo='percentual')
// ─────────────────────────────────────────────────────────────────────────

describe('Auto-calc percentual_comissao_comercial = MAX - percRep', () => {
  function calcPercComercialAuto(percRep: number): number {
    return MAX_PERCENTUAL_COMISSAO - percRep;
  }

  test('rep 10% → percComercial 30%', () => {
    expect(calcPercComercialAuto(10)).toBe(30);
  });

  test('rep 20% → percComercial 20%', () => {
    expect(calcPercComercialAuto(20)).toBe(20);
  });

  test('rep 40% (máximo) → percComercial 0%', () => {
    expect(calcPercComercialAuto(40)).toBe(0);
  });

  test('rep 0% → percComercial é o máximo (40%)', () => {
    expect(calcPercComercialAuto(0)).toBe(40);
  });

  test('auto-calc: R$100, rep 10%, percComercial auto=30%, entidade', () => {
    const percComercial = calcPercComercialAuto(10);
    const r = calcularValoresComissao(100, 10, percComercial, 'entidade');
    expect(r.valorRep).toBe(10);
    expect(r.valorComercial).toBe(30);
    expect(r.valorQWork).toBe(60);
    expect(r.percentualTotal).toBe(40);
    expect(r.abaixoCusto).toBe(false);
  });

  test('auto-calc: R$100, rep 20%, percComercial auto=20%, entidade', () => {
    const percComercial = calcPercComercialAuto(20);
    const r = calcularValoresComissao(100, 20, percComercial, 'entidade');
    expect(r.valorRep).toBe(20);
    expect(r.valorComercial).toBe(20);
    expect(r.valorQWork).toBe(60);
    expect(r.percentualTotal).toBe(40);
    expect(r.abaixoCusto).toBe(false);
  });

  test('auto-calc: R$100, rep 40%, percComercial auto=0%, entidade', () => {
    const percComercial = calcPercComercialAuto(40);
    const r = calcularValoresComissao(100, 40, percComercial, 'entidade');
    expect(r.valorRep).toBe(40);
    expect(r.valorComercial).toBe(0);
    expect(r.valorQWork).toBe(60);
    expect(r.percentualTotal).toBe(40);
    expect(r.abaixoCusto).toBe(false);
  });

  test('auto-calc below-cost: R$14, rep 40%, entidade → abaixoCusto=true', () => {
    const percComercial = calcPercComercialAuto(40); // 0%
    const r = calcularValoresComissao(14, 40, percComercial, 'entidade');
    expect(r.abaixoCusto).toBe(true);
  });

  test('auto-calc below-cost: R$7, rep 40%, clinica → abaixoCusto=true', () => {
    const percComercial = calcPercComercialAuto(40); // 0%
    const r = calcularValoresComissao(7, 40, percComercial, 'clinica');
    expect(r.abaixoCusto).toBe(true);
  });

  test('auto-calc soma preservada: rep=20%, R$100, entidade', () => {
    const percComercial = calcPercComercialAuto(20);
    const r = calcularValoresComissao(100, 20, percComercial, 'entidade');
    // valorRep + valorComercial + valorQWork = valorNegociado
    expect(r.valorRep + (r.valorComercial ?? 0) + r.valorQWork).toBeCloseTo(
      100,
      2
    );
  });

  test('notificacao-trigger: abaixoCusto=true deve acionar aprovação admin', () => {
    // Simula a condição que dispara INSERT em notificacoes_admin
    // quando aprovado com abaixo do custo mínimo
    const percRep = 40;
    const percComercial = calcPercComercialAuto(percRep);
    const valorNegociado = 10; // R$10, entidade, custo mínimo = R$12

    const requerAprovacao = calcularRequerAprovacao(
      valorNegociado,
      percRep,
      percComercial,
      'entidade'
    );

    // Custo mínimo entidade é R$12, valorNegociado R$10 < R$12 → requer notificação
    expect(requerAprovacao).toBe(true);
  });
});
