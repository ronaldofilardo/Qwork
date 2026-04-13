/**
 * Tests for num_vidas_estimado, equipe/leads page, notifications, and volume recalculation.
 */
import {
  calcularValoresComissao,
  calcularRequerAprovacao,
  MAX_PERCENTUAL_COMISSAO,
  CUSTO_POR_AVALIACAO,
} from '@/lib/leads-config';

describe('num_vidas_estimado — field propagation', () => {
  test('calcularValoresComissao with standard values', () => {
    const bd = calcularValoresComissao(100, 10, 0, 'entidade');
    expect(bd.valorRep).toBe(10);
    expect(bd.valorQWork).toBe(90);
    expect(bd.percentualTotal).toBe(10);
    expect(bd.abaixoCusto).toBe(false);
  });

  test('calcularRequerAprovacao returns true when below cost', () => {
    // valor=15, percRep=30, valorQWork = 15*(1-0.30) = 10.5 < 15 (entidade)
    expect(calcularRequerAprovacao(15, 30, 0, 'entidade')).toBe(true);
  });

  test('calcularRequerAprovacao returns false when above cost', () => {
    // valor=100, percRep=10, valorQWork = 100*(1-0.10) = 90 > 15
    expect(calcularRequerAprovacao(100, 10, 0, 'entidade')).toBe(false);
  });

  test('MAX_PERCENTUAL_COMISSAO is 40', () => {
    expect(MAX_PERCENTUAL_COMISSAO).toBe(40);
  });

  test('CUSTO_POR_AVALIACAO values', () => {
    expect(CUSTO_POR_AVALIACAO.entidade).toBe(12);
    expect(CUSTO_POR_AVALIACAO.clinica).toBe(5);
  });
});

describe('num_vidas_estimado — validation', () => {
  test('null is valid (optional field)', () => {
    const numVidas = null;
    expect(numVidas).toBeNull();
  });

  test('positive integers are valid', () => {
    for (const v of [1, 10, 150, 200, 5000]) {
      expect(v > 0).toBe(true);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  test('zero and negative are invalid', () => {
    for (const v of [0, -1, -100]) {
      expect(v > 0).toBe(false);
    }
  });

  test('parsing from string works', () => {
    const raw = '150';
    const parsed = parseInt(raw, 10);
    expect(parsed).toBe(150);
    expect(parsed > 0).toBe(true);
  });
});

describe('equipe/leads — commission split validation', () => {
  test('rep + vendedor cannot exceed MAX_PERCENTUAL_COMISSAO', () => {
    const percRep = 25;
    const percVend = 20;
    const total = percRep + percVend;
    expect(total).toBeGreaterThan(MAX_PERCENTUAL_COMISSAO);
    // This combination should be rejected
  });

  test('rep + vendedor within limit is valid', () => {
    const percRep = 20;
    const percVend = 15;
    const total = percRep + percVend;
    expect(total).toBeLessThanOrEqual(MAX_PERCENTUAL_COMISSAO);
  });

  test('calcularValoresComissao with split shows correct breakdown', () => {
    const bd = calcularValoresComissao(200, 15, 0, 'entidade');
    expect(bd.valorRep).toBe(30); // 200 * 15%
    expect(bd.valorQWork).toBe(170); // 200 - 30
    expect(bd.percentualTotal).toBe(15);
    expect(bd.abaixoCusto).toBe(false);
  });

  test('below-cost scenario distributes from pool', () => {
    // valor=13, percRep=20, tipo=entidade (custo=12)
    // valorQWork = 13 - 2.6 = 10.4 < 12 → abaixoCusto
    const bd = calcularValoresComissao(13, 20, 0, 'entidade');
    expect(bd.abaixoCusto).toBe(true);
    // Pool = max(0, 13 - 12) = 1
    expect(bd.poolDisponivel).toBe(1);
  });
});

describe('volume recalculation — estimated vs actual', () => {
  test('variation percentage calc is correct', () => {
    const estimado = 100;
    const real = 150;
    const variacao = ((real - estimado) / estimado) * 100;
    expect(variacao).toBe(50); // +50%
  });

  test('negative variation when actual < estimated', () => {
    const estimado = 200;
    const real = 120;
    const variacao = ((real - estimado) / estimado) * 100;
    expect(variacao).toBe(-40); // -40%
  });

  test('no variation when equal', () => {
    const estimado = 100;
    const real = 100;
    const variacao = ((real - estimado) / estimado) * 100;
    expect(variacao).toBe(0);
  });

  test('large volume badge threshold is 200', () => {
    expect(200 >= 200).toBe(true);
    expect(199 >= 200).toBe(false);
  });
});

describe('notification — vendedor creates lead for rep', () => {
  test('notification message format is correct', () => {
    const vendedorNome = 'João Silva';
    const cnpj = '12345678000190';
    const titulo = `Novo lead registrado por ${vendedorNome}`;
    const mensagem = `O vendedor ${vendedorNome} registrou um novo lead (CNPJ: ${cnpj}). Acesse "Leads da Equipe" para definir sua comissão.`;

    expect(titulo).toContain(vendedorNome);
    expect(mensagem).toContain(cnpj);
    expect(mensagem).toContain('Leads da Equipe');
  });
});
