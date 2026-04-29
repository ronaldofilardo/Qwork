/**
 * @fileoverview Testes unitários para comissoes-calculos.ts (funções puras extraídas)
 */

import {
  calcularValoresComissao,
  determinarStatusInicialComissao,
  calcularMesesComissao,
  type DadosRepresentante,
  type DadosVinculoCalculo,
} from '@/lib/db/comissionamento/comissoes-calculos';

// ── calcularValoresComissao ───────────────────────────────────────────────────

describe('calcularValoresComissao', () => {
  const repBase: DadosRepresentante = {
    percentual_comissao: '10.00',
    modelo_comissionamento: 'percentual',
    valor_custo_fixo_entidade: null,
    valor_custo_fixo_clinica: null,
    asaas_wallet_id: 'wal_123',
    status: 'apto',
  };

  const vinculoBase: DadosVinculoCalculo = {
    percentual_comissao_representante: '10.00',
    valor_negociado: null,
  };

  it('calcula comissão percentual corretamente sobre a base líquida', () => {
    const result = calcularValoresComissao({
      rep: repBase,
      vinculoPerc: vinculoBase,
      entidadeId: 1,
      valorLaudo: 100,
      totalParcelas: 1,
      valorParcela: 97,
    });

    expect('resultado' in result).toBe(true);
    if ('resultado' in result) {
      expect(result.resultado.valorComissao).toBe(9);
      expect(result.resultado.percentualRep).toBe(10);
      expect(result.resultado.baseCalculoFinal).toBe(90);
    }
  });

  it('calcula comissão percentual com múltiplas parcelas na base líquida', () => {
    const result = calcularValoresComissao({
      rep: repBase,
      vinculoPerc: vinculoBase,
      entidadeId: 1,
      valorLaudo: 100,
      totalParcelas: 2,
      valorParcela: 48.5,
    });

    if ('resultado' in result) {
      expect(result.resultado.valorComissao).toBe(4.5);
      expect(result.resultado.baseCalculoFinal).toBe(45);
    }
  });

  it('retorna erro se percentual não definido em modelo percentual', () => {
    const repSemPerc: DadosRepresentante = {
      ...repBase,
      percentual_comissao: null,
    };
    const vinculoSemPerc: DadosVinculoCalculo = {
      ...vinculoBase,
      percentual_comissao_representante: null,
    };

    const result = calcularValoresComissao({
      rep: repSemPerc,
      vinculoPerc: vinculoSemPerc,
      entidadeId: 1,
      valorLaudo: 100,
      totalParcelas: 1,
    });

    expect('erro' in result).toBe(true);
  });

  it('retorna resultado mesmo sem percentual comercial', () => {
    const result = calcularValoresComissao({
      rep: repBase,
      vinculoPerc: vinculoBase,
      entidadeId: 1,
      valorLaudo: 100,
      totalParcelas: 1,
      valorParcela: 97,
    });

    expect('resultado' in result).toBe(true);
  });

  it('modelo custo_fixo usa cálculo diferente', () => {
    const repCustoFixo: DadosRepresentante = {
      ...repBase,
      modelo_comissionamento: 'custo_fixo',
      valor_custo_fixo_entidade: '20',
    };

    const result = calcularValoresComissao({
      rep: repCustoFixo,
      vinculoPerc: vinculoBase,
      entidadeId: 1,
      valorLaudo: 100,
      totalParcelas: 1,
    });

    expect('resultado' in result).toBe(true);
    if ('resultado' in result) {
      expect(result.resultado.percentualRep).toBe(0);
    }
  });
});

// ── determinarStatusInicialComissao ──────────────────────────────────────────

describe('determinarStatusInicialComissao', () => {
  it('retorna "retida" por padrão (sem parcela confirmada)', () => {
    const status = determinarStatusInicialComissao({
      forcarRetida: false,
      parcelaConfirmadaEm: null,
      repApto: true,
    });
    expect(status).toBe('retida');
  });

  it('retorna "paga" quando rep apto + parcela confirmada + não forçar retida', () => {
    const status = determinarStatusInicialComissao({
      forcarRetida: false,
      parcelaConfirmadaEm: new Date(),
      repApto: true,
    });
    expect(status).toBe('paga');
  });

  it('retorna "retida" quando forcar_retida=true mesmo com parcela confirmada', () => {
    const status = determinarStatusInicialComissao({
      forcarRetida: true,
      parcelaConfirmadaEm: new Date(),
      repApto: true,
    });
    expect(status).toBe('retida');
  });

  it('retorna "retida" quando rep não apto', () => {
    const status = determinarStatusInicialComissao({
      forcarRetida: false,
      parcelaConfirmadaEm: new Date(),
      repApto: false,
    });
    expect(status).toBe('retida');
  });
});

// ── calcularMesesComissao ────────────────────────────────────────────────────

describe('calcularMesesComissao', () => {
  it('retorna mesEmissao no formato YYYY-MM-01', () => {
    const { mesEmissao } = calcularMesesComissao(1);
    expect(mesEmissao).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('retorna mesPagamento no formato YYYY-MM-01', () => {
    const { mesPagamento } = calcularMesesComissao(1);
    expect(mesPagamento).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('parcela 2 tem mesPagamento posterior à parcela 1', () => {
    const p1 = calcularMesesComissao(1);
    const p2 = calcularMesesComissao(2);
    expect(new Date(p2.mesPagamento).getTime()).toBeGreaterThan(
      new Date(p1.mesPagamento).getTime()
    );
  });
});
