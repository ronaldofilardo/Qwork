import {
  calcularComissaoCustoFixo,
  calcularValoresComissao,
  calcularRequerAprovacao,
  valorMinimoCustoFixoTotal,
  CUSTO_POR_AVALIACAO,
} from '@/lib/leads-config';

describe('calcularComissaoCustoFixo — modelo custo_fixo', () => {
  it('deve calcular sem percentual_comercial (retrocompatível, default=0)', () => {
    // Arrange
    const valorNegociado = 100;
    const valorCustoFixo = 50;

    // Act — percComercial omitido (default=0)
    const result = calcularComissaoCustoFixo(valorNegociado, valorCustoFixo);

    // Assert — margem = 50; comercial=0; qwork=margem
    expect(result.valorRep).toBe(50); // margem = 100 - 50
    expect(result.valorComercial).toBe(0); // 0% da margem
    expect(result.valorQWork).toBe(50); // margem - 0
    expect(result.abaixoMinimo).toBe(false);
  });

  it('deve calcular com percentual_comercial=10: comercial recebe % da margem', () => {
    // Arrange — custo_fixo=100, negociado=150, margem=50, comercial pega 10% da margem
    const valorNegociado = 150;
    const valorCustoFixo = 100;
    const percComercial = 10;

    // Act
    const result = calcularComissaoCustoFixo(
      valorNegociado,
      valorCustoFixo,
      percComercial
    );

    // Assert
    expect(result.valorRep).toBe(50); // margem = 150 - 100
    expect(result.valorComercial).toBe(5); // 10% de 50 (margem)
    expect(result.valorQWork).toBe(45); // 50 - 5
    expect(result.abaixoMinimo).toBe(false);
  });

  it('deve marcar abaixoMinimo=true quando valorNegociado < valorCustoFixo', () => {
    // Arrange — negociado menor que custo_fixo (margem negativa)
    const valorNegociado = 30;
    const valorCustoFixo = 50;

    // Act
    const result = calcularComissaoCustoFixo(valorNegociado, valorCustoFixo, 5);

    // Assert — valorRep=0 (clamped), abaixoMinimo=true
    expect(result.valorRep).toBe(0);
    expect(result.abaixoMinimo).toBe(true);
  });

  it('deve clampear percComercial no máximo de 40%', () => {
    // Arrange — percComercial=50 deve ser reduzido para 40; margem=100
    const result = calcularComissaoCustoFixo(200, 100, 50);

    // Assert — 40% de margem(100) = 40
    expect(result.valorComercial).toBe(40);
    expect(result.valorQWork).toBe(60); // 100 - 40
  });

  it('deve retornar zeros quando valorNegociado <= 0', () => {
    // Arrange
    const result = calcularComissaoCustoFixo(0, 50, 10);

    // Assert
    expect(result.valorRep).toBe(0);
    expect(result.valorComercial).toBe(0);
    expect(result.abaixoMinimo).toBe(true);
  });

  it('deve marcar abaixoMinimo=true quando margem < custoMinimoQWork (bug fix)', () => {
    // Arrange — rep#42 case: negociado=15, custoFixo=12 → margem=3; custoMinimoQWork=12 → abaixoMinimo
    const result = calcularComissaoCustoFixo(15, 12, 20, 12);

    // Assert
    expect(result.abaixoMinimo).toBe(true);
    expect(result.valorRep).toBe(3); // margem = 15 - 12 (não bloqueado na lógica, apenas flag)
  });

  it('deve passar quando margem == custoMinimoQWork (exatamente no limite)', () => {
    // Arrange — negociado=24, custoFixo=12 → margem=12 == custoMinimoQWork=12
    const result = calcularComissaoCustoFixo(24, 12, 20, 12);

    // Assert
    expect(result.abaixoMinimo).toBe(false);
  });

  it('deve manter compatibilidade legada quando custoMinimoQWork=0 (default)', () => {
    // Arrange — sem custoMinimoQWork: qualquer margem positiva é válida
    const result = calcularComissaoCustoFixo(15, 12, 20);

    // Assert — legado: abaixoMinimo=false mesmo com margem pequena
    expect(result.abaixoMinimo).toBe(false);
    expect(result.valorRep).toBe(3);
  });
});

describe('calcularValoresComissao — modelo percentual', () => {
  it('deve calcular corretamente com percentual_rep e percentual_comercial', () => {
    // Arrange — R$200, rep=10%, comercial=5%
    const result = calcularValoresComissao(200, 10, 5, 'clinica');

    // Assert
    expect(result.valorRep).toBe(20); // 10% de 200
    expect(result.valorComercial).toBe(10); // 5% de 200
    expect(result.valorQWork).toBe(170); // 200 - 20 - 10
    expect(result.percentualTotal).toBe(15);
  });

  it('deve marcar abaixoCusto=true para clínica quando valorQWork < R$5', () => {
    // Arrange — clínica: custo_min = R$5
    // valorNegociado=10, rep=50%, comercial=0% → qwork=5 (limite exato)
    const result = calcularValoresComissao(10, 50, 0, 'clinica');

    // Assert — qwork = 5 = exatamente o custo mínimo (não abaixo)
    expect(result.abaixoCusto).toBe(false);
    expect(result.valorQWork).toBe(5);
  });

  it('deve marcar abaixoCusto=true para clínica quando valorQWork < R$5', () => {
    // Arrange — 9.99, rep=50% → qwork=4.995 < 5
    const result = calcularValoresComissao(9.99, 50, 0, 'clinica');

    // Assert
    expect(result.abaixoCusto).toBe(true);
    expect(result.valorQWork).toBeLessThan(CUSTO_POR_AVALIACAO['clinica']);
  });

  it('deve marcar abaixoCusto=true para entidade quando valorQWork < R$12', () => {
    // Arrange — entidade: custo_min = R$12
    // valorNegociado=20, rep=40%, comercial=0% → qwork=12 (exato)
    const abaixo = calcularValoresComissao(20, 40, 0, 'entidade');
    expect(abaixo.abaixoCusto).toBe(false);

    // valorNegociado=19, rep=40% → qwork=11.4 < 12
    const abaixoMenor = calcularValoresComissao(19, 40, 0, 'entidade');
    expect(abaixoMenor.abaixoCusto).toBe(true);
    expect(abaixoMenor.valorQWork).toBeLessThan(
      CUSTO_POR_AVALIACAO['entidade']
    );
  });
});

describe('calcularRequerAprovacao', () => {
  it('deve retornar false quando valorQWork >= custo mínimo', () => {
    // clínica custo=5, valorNegociado=20, percRep=0, percComercial=0 → qwork=20 ≥ 5
    expect(calcularRequerAprovacao(20, 0, 0, 'clinica')).toBe(false);
  });

  it('deve retornar true quando valorQWork < custo mínimo', () => {
    // clínica custo=5, valorNegociado=10, percRep=60 → qwork=4 < 5
    expect(calcularRequerAprovacao(10, 60, 0, 'clinica')).toBe(true);
  });

  it('deve retornar false quando valorNegociado <= 0', () => {
    expect(calcularRequerAprovacao(0, 10, 5, 'entidade')).toBe(false);
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

    // Valor exato no limite → não é abaixo do mínimo
    const noLimite = calcularComissaoCustoFixo(
      minimo,
      custoFixoRep,
      20,
      CUSTO_POR_AVALIACAO[tipo]
    );
    expect(noLimite.abaixoMinimo).toBe(false);

    // Um centavo abaixo → é abaixo do mínimo
    const abaixo = calcularComissaoCustoFixo(
      minimo - 0.01,
      custoFixoRep,
      20,
      CUSTO_POR_AVALIACAO[tipo]
    );
    expect(abaixo.abaixoMinimo).toBe(true);
  });
});
