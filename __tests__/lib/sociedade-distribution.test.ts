import { calcularDistribuicaoSociedade } from '@/lib/financeiro/sociedade';

describe('calcularDistribuicaoSociedade', () => {
  it('calcula corretamente percentual 40% com comercial zerado', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 40,
      percentualComercial: 0,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorRepresentante).toBe(40);
    expect(result.valorComercial).toBe(0);
    expect(result.valorSocioRonaldo).toBe(26.5);
    expect(result.valorSocioAntonio).toBe(26.5);
    expect(result.totalDistribuido).toBe(100);
  });

  it('calcula corretamente custo fixo com comercial sobre a margem livre', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      modeloRepresentante: 'custo_fixo',
      valorRepresentanteFixo: 60,
      percentualComercial: 30,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorRepresentante).toBe(60);
    expect(result.margemLivre).toBe(33);
    expect(result.valorComercial).toBe(9.9);
    expect(result.valorSocioRonaldo).toBe(11.55);
    expect(result.valorSocioAntonio).toBe(11.55);
    expect(result.totalDistribuido).toBe(100);
  });

  it('suporta pagamento sem representante', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 0,
      percentualComercial: 0,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorRepresentante).toBe(0);
    expect(result.valorComercial).toBe(0);
    expect(result.valorSocioRonaldo).toBe(46.5);
    expect(result.valorSocioAntonio).toBe(46.5);
  });

  it('marca como inviável quando custo fixo do representante supera a margem possível', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 50,
      modeloRepresentante: 'custo_fixo',
      valorRepresentanteFixo: 60,
      percentualComercial: 0,
    });

    expect(result.viavel).toBe(false);
    expect(result.margemLivre).toBeLessThan(0);
  });
});
