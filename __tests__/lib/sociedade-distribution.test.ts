import { calcularDistribuicaoSociedade } from '@/lib/financeiro/sociedade';

describe('calcularDistribuicaoSociedade', () => {
  it('desconta imposto e taxa do gateway antes da comissão percentual e dos sócios', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 40,
      percentualComercial: 0,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(3);
    expect(result.valorRepresentante).toBe(36);
    expect(result.valorComercial).toBe(0);
    expect(result.valorSocioRonaldo).toBe(27);
    expect(result.valorSocioAntonio).toBe(27);
    expect(result.totalDistribuido).toBe(100);
  });

  it('calcula corretamente custo fixo após imposto e taxa do gateway', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'custo_fixo',
      valorRepresentanteFixo: 60,
      percentualComercial: 30,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(3);
    expect(result.valorRepresentante).toBe(60);
    expect(result.margemLivre).toBe(30);
    expect(result.valorComercial).toBe(9);
    expect(result.valorSocioRonaldo).toBe(10.5);
    expect(result.valorSocioAntonio).toBe(10.5);
    expect(result.totalDistribuido).toBe(100);
  });

  it('suporta pagamento sem representante e sem comercial', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 2,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 0,
      percentualComercial: 0,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(2);
    expect(result.valorRepresentante).toBe(0);
    expect(result.valorComercial).toBe(0);
    expect(result.valorSocioRonaldo).toBe(45.5);
    expect(result.valorSocioAntonio).toBe(45.5);
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
