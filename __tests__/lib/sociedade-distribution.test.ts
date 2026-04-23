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

  it('modelo percentual: comercial incide sobre baseLiquida, não sobre margemLivre', () => {
    // baseLiquida = 100 - 7 (impostos) - 3 (gateway) = 90
    // valorRepresentante = 90 × 40% = 36
    // margemLivre = 90 - 36 = 54
    // valorComercial = 90 × 10% = 9  (e NÃO 54 × 10% = 5.4)
    // valorParaSocios = 54 - 9 = 45
    // total = 7 + 3 + 36 + 9 + 22.5 + 22.5 = 100
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 40,
      percentualComercial: 10,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(3);
    expect(result.valorRepresentante).toBe(36);
    expect(result.margemLivre).toBe(54);
    expect(result.valorComercial).toBe(9);
    expect(result.valorSocioRonaldo).toBe(22.5);
    expect(result.valorSocioAntonio).toBe(22.5);
    expect(result.totalDistribuido).toBe(100);
  });

  it('modelo custo_fixo: comercial incide sobre margemLivre', () => {
    // baseLiquida = 100 - 7 - 3 = 90
    // valorRepresentante = 40 (fixo)
    // margemLivre = 90 - 40 = 50
    // valorComercial = 50 × 10% = 5
    // valorParaSocios = 50 - 5 = 45
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'custo_fixo',
      valorRepresentanteFixo: 40,
      percentualComercial: 10,
    });

    expect(result.viavel).toBe(true);
    expect(result.valorRepresentante).toBe(40);
    expect(result.margemLivre).toBe(50);
    expect(result.valorComercial).toBe(5);
    expect(result.valorParaSocios).toBe(45);
    expect(result.totalDistribuido).toBe(100);
  });

  it('usa configuracao DB do gateway quando fornecida (boleto taxa_fixa)', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 0,
      percentualComercial: 0,
      metodoPagamento: 'boleto',
      configuracoes: [
        {
          codigo: 'boleto',
          descricao: 'Boleto',
          tipo: 'taxa_fixa',
          valor: 5,
          ativo: true,
        },
      ],
    });

    // gateway = R$5 fixo
    expect(result.valorGateway).toBe(5);
    // baseLiquida = 100 - 7 - 5 = 88
    expect(result.baseLiquida).toBe(88);
  });
});
