import {
  calcularComissaoCustoFixo,
  calcularValoresComissao,
  calcularRequerAprovacao,
  valorMinimoCustoFixoTotal,
  CUSTO_POR_AVALIACAO,
} from '@/lib/leads-config';

describe('calcularComissaoCustoFixo — modelo custo_fixo', () => {
  it('deve calcular margem corretamente', () => {
    const result = calcularComissaoCustoFixo(100, 50);

    expect(result.valorRep).toBe(50); // margem = 100 - 50
    expect(result.valorQWork).toBe(50);
    expect(result.abaixoMinimo).toBe(false);
  });

  it('deve marcar abaixoMinimo=true quando valorNegociado < valorCustoFixo', () => {
    const result = calcularComissaoCustoFixo(30, 50);

    expect(result.valorRep).toBe(0);
    expect(result.abaixoMinimo).toBe(true);
  });

  it('deve retornar zeros quando valorNegociado <= 0', () => {
    const result = calcularComissaoCustoFixo(0, 50);

    expect(result.valorRep).toBe(0);
    expect(result.abaixoMinimo).toBe(true);
  });

  it('deve marcar abaixoMinimo=true quando margem < custoMinimoQWork', () => {
    // negociado=15, custoFixo=12 → margem=3; custoMinimoQWork=12 → abaixoMinimo
    const result = calcularComissaoCustoFixo(15, 12, 12);

    expect(result.abaixoMinimo).toBe(true);
    expect(result.valorRep).toBe(3);
  });

  it('deve passar quando margem == custoMinimoQWork (exatamente no limite)', () => {
    // negociado=24, custoFixo=12 → margem=12 == custoMinimoQWork=12
    const result = calcularComissaoCustoFixo(24, 12, 12);

    expect(result.abaixoMinimo).toBe(false);
  });

  it('deve manter compatibilidade legada quando custoMinimoQWork=0 (default)', () => {
    const result = calcularComissaoCustoFixo(15, 12);

    expect(result.abaixoMinimo).toBe(false);
    expect(result.valorRep).toBe(3);
  });
});

describe('calcularValoresComissao — modelo percentual', () => {
  it('deve calcular corretamente com percentual_rep', () => {
    const result = calcularValoresComissao(200, 10, 'clinica');

    expect(result.valorRep).toBe(20); // 10% de 200
    expect(result.valorQWork).toBe(180); // 200 - 20
    expect(result.percentualTotal).toBe(10);
  });

  it('deve marcar abaixoCusto=false para clínica quando valorQWork == R$5 (limite exato)', () => {
    // clínica: custo_min = R$5; valorNegociado=10, rep=50% → qwork=5
    const result = calcularValoresComissao(10, 50, 'clinica');

    expect(result.abaixoCusto).toBe(false);
    expect(result.valorQWork).toBe(5);
  });

  it('deve marcar abaixoCusto=true para clínica quando valorQWork < R$5', () => {
    // 9.99, rep=50% → qwork=4.995 < 5
    const result = calcularValoresComissao(9.99, 50, 'clinica');

    expect(result.abaixoCusto).toBe(true);
    expect(result.valorQWork).toBeLessThan(CUSTO_POR_AVALIACAO['clinica']);
  });

  it('deve marcar abaixoCusto corretamente para entidade quando valorQWork < R$12', () => {
    // entidade: custo_min = R$12; valorNegociado=20, rep=40% → qwork=12 (exato)
    const abaixo = calcularValoresComissao(20, 40, 'entidade');
    expect(abaixo.abaixoCusto).toBe(false);

    // valorNegociado=19, rep=40% → qwork=11.4 < 12
    const abaixoMenor = calcularValoresComissao(19, 40, 'entidade');
    expect(abaixoMenor.abaixoCusto).toBe(true);
    expect(abaixoMenor.valorQWork).toBeLessThan(
      CUSTO_POR_AVALIACAO['entidade']
    );
  });
});

describe('calcularRequerAprovacao', () => {
  it('deve retornar false quando valorQWork >= custo mínimo', () => {
    // clínica custo=5, valorNegociado=20, percRep=0 → qwork=20 ≥ 5
    expect(calcularRequerAprovacao(20, 0, 'clinica')).toBe(false);
  });

  it('deve retornar true quando valorQWork < custo mínimo', () => {
    // clínica custo=5, valorNegociado=10, percRep=60 → qwork=4 < 5
    expect(calcularRequerAprovacao(10, 60, 'clinica')).toBe(true);
  });

  it('deve retornar false quando valorNegociado <= 0', () => {
    expect(calcularRequerAprovacao(0, 10, 'entidade')).toBe(false);
  });
});

describe('valorMinimoCustoFixoTotal', () => {
  it('deve retornar custoFixoRep + CUSTO_POR_AVALIACAO[entidade] (R$12)', () => {
    expect(valorMinimoCustoFixoTotal('entidade', 12)).toBe(24);
    expect(valorMinimoCustoFixoTotal('entidade', 10)).toBe(22);
    expect(valorMinimoCustoFixoTotal('entidade', 0)).toBe(
      CUSTO_POR_AVALIACAO['entidade']
    );
  });

  it('deve retornar custoFixoRep + CUSTO_POR_AVALIACAO[clinica] (R$5)', () => {
    expect(valorMinimoCustoFixoTotal('clinica', 8)).toBe(13);
    expect(valorMinimoCustoFixoTotal('clinica', 0)).toBe(
      CUSTO_POR_AVALIACAO['clinica']
    );
  });

  it('deve ser consistente com a validação de abaixoMinimo', () => {
    const custoFixoRep = 12;
    const tipo = 'entidade' as const;
    const minimo = valorMinimoCustoFixoTotal(tipo, custoFixoRep); // 24

    const noLimite = calcularComissaoCustoFixo(
      minimo,
      custoFixoRep,
      CUSTO_POR_AVALIACAO[tipo]
    );
    expect(noLimite.abaixoMinimo).toBe(false);

    const abaixo = calcularComissaoCustoFixo(
      minimo - 0.01,
      custoFixoRep,
      CUSTO_POR_AVALIACAO[tipo]
    );
    expect(abaixo.abaixoMinimo).toBe(true);
  });
});
