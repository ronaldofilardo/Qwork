import { calcularDistribuicaoSociedade } from '@/lib/financeiro/sociedade';

describe('calcularDistribuicaoSociedade', () => {
  it('desconta imposto e taxa do gateway antes da comissão percentual e dos sócios', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 40,
    });

    // baseLiquida = 100 - 7 - 3 = 90
    // valorRep = 90 * 40% = 36
    // margemLivre = 90 - 36 = 54
    // sócios dividem 54: 27 + 27
    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(3);
    expect(result.valorRepresentante).toBe(36);
    expect(result.margemLivre).toBe(54);
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
    });

    // baseLiquida = 100 - 7 - 3 = 90
    // valorRep = 60 (fixo)
    // margemLivre = 90 - 60 = 30
    // sócios: 15 + 15
    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(3);
    expect(result.valorRepresentante).toBe(60);
    expect(result.margemLivre).toBe(30);
    expect(result.valorSocioRonaldo).toBe(15);
    expect(result.valorSocioAntonio).toBe(15);
    expect(result.totalDistribuido).toBe(100);
  });

  it('suporta pagamento sem representante', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 2,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 0,
    });

    // baseLiquida = 100 - 7 - 2 = 91
    // sócios: 45.5 + 45.5
    expect(result.viavel).toBe(true);
    expect(result.valorImpostos).toBe(7);
    expect(result.valorGateway).toBe(2);
    expect(result.valorRepresentante).toBe(0);
    expect(result.valorSocioRonaldo).toBe(45.5);
    expect(result.valorSocioAntonio).toBe(45.5);
  });

  it('marca como inviável quando custo fixo do representante supera a margem possível', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 50,
      modeloRepresentante: 'custo_fixo',
      valorRepresentanteFixo: 60,
    });

    expect(result.viavel).toBe(false);
    expect(result.margemLivre).toBeLessThan(0);
  });

  it('usa configuracao DB do gateway quando fornecida (boleto taxa_fixa)', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 0,
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

    expect(result.valorGateway).toBe(5);
    expect(result.baseLiquida).toBe(88);
  });

  it('toda a margem vai para os sócios (sem comercial)', () => {
    const result = calcularDistribuicaoSociedade({
      valorBruto: 100,
      valorTaxaGateway: 3,
      modeloRepresentante: 'percentual',
      percentualRepresentante: 20,
    });

    // baseLiquida = 90; rep = 18; margemLivre = 72; sócios = 72 (36+36)
    expect(result.margemLivre).toBe(72);
    expect(result.valorParaSocios).toBe(72);
    expect(result.valorSocioRonaldo).toBe(36);
    expect(result.valorSocioAntonio).toBe(36);
  });
});
