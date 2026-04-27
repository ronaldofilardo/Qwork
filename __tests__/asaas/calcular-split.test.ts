/**
 * Testes unitários para lib/asaas/subconta.ts
 *
 * Cobre:
 * - calcularSplit(): modelo percentual e custo_fixo
 * - montarSplitAsaas(): payloads para Asaas
 * - CUSTO_MINIMO e PERCENTUAL_MAXIMO_COMISSAO constantes
 *
 * @see lib/asaas/subconta.ts
 */

import { describe, it, expect } from '@jest/globals';
import {
  calcularSplit,
  montarSplitAsaas,
  CUSTO_MINIMO,
  PERCENTUAL_MAXIMO_COMISSAO,
} from '@/lib/asaas/subconta';

// ─── Constantes ──────────────────────────────────────────────────────────────

describe('Constantes de negócio', () => {
  it('CUSTO_MINIMO.entidade deve ser 12', () => {
    expect(CUSTO_MINIMO.entidade).toBe(12);
  });

  it('CUSTO_MINIMO.clinica deve ser 5', () => {
    expect(CUSTO_MINIMO.clinica).toBe(5);
  });

  it('PERCENTUAL_MAXIMO_COMISSAO deve ser 40', () => {
    expect(PERCENTUAL_MAXIMO_COMISSAO).toBe(40);
  });
});

// ─── calcularSplit — modelo percentual ────────────────────────────────────────

describe('calcularSplit() — modelo percentual', () => {
  it('deve calcular corretamente no modelo percentual após impostos', () => {
    const res = calcularSplit('percentual', 100, 'entidade', 20);
    expect(res.modelo).toBe('percentual');
    expect(res.valorRepresentante).toBe(18.6);
    expect(res.valorQWork).toBe(74.4);
    expect(res.percentualAplicado).toBe(20);
    expect(res.viavel).toBe(true);
  });

  it('deve calcular corretamente para clínica com base líquida', () => {
    const res = calcularSplit('percentual', 50, 'clinica', 10);
    expect(res.valorRepresentante).toBe(4.65);
    expect(res.valorQWork).toBe(41.85);
    expect(res.viavel).toBe(true);
  });

  it('deve marcar inviável quando valorQWork < CUSTO_MINIMO.entidade', () => {
    // valor=20, 80% → valorRep=16, valorQWork=4 < 12 → inviável
    const res = calcularSplit('percentual', 20, 'entidade', 80);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando valorQWork < CUSTO_MINIMO.clinica', () => {
    // valor=6, 30% → valorRep=1.8, valorQWork=4.2 < 5 → inviável
    const res = calcularSplit('percentual', 6, 'clinica', 30);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando percentual > PERCENTUAL_MAXIMO_COMISSAO', () => {
    const res = calcularSplit('percentual', 1000, 'entidade', 41);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando percentual é undefined', () => {
    const res = calcularSplit('percentual', 100, 'entidade', undefined);
    expect(res.viavel).toBe(false);
    expect(res.valorRepresentante).toBe(0);
  });

  it('deve arredondar para 2 casas decimais na base líquida', () => {
    const res = calcularSplit('percentual', 100, 'entidade', 33.33);
    expect(res.valorRepresentante).toBe(31);
    expect(res.valorQWork).toBe(62);
  });

  it('percentual máximo (40%) deve ser viável para entidade com valor > 25', () => {
    // valor=30, 40% → valorRep=12, valorQWork=18 > 12 → viável
    const res = calcularSplit('percentual', 30, 'entidade', 40);
    expect(res.viavel).toBe(true);
  });
});

// ─── calcularSplit — modelo custo_fixo ───────────────────────────────────────

describe('calcularSplit() — modelo custo_fixo', () => {
  it('deve calcular corretamente custo fixo de entidade após impostos', () => {
    const res = calcularSplit('custo_fixo', 100, 'entidade');
    expect(res.modelo).toBe('custo_fixo');
    expect(res.valorQWork).toBe(81);
    expect(res.valorRepresentante).toBe(12);
    expect(res.viavel).toBe(true);
  });

  it('deve calcular corretamente custo fixo de clínica após impostos', () => {
    const res = calcularSplit('custo_fixo', 20, 'clinica');
    expect(res.valorQWork).toBe(13.6);
    expect(res.valorRepresentante).toBe(5);
    expect(res.viavel).toBe(true);
  });

  it('deve ficar inviável quando o bruto não cobre impostos mais custo fixo', () => {
    const res = calcularSplit('custo_fixo', 12, 'entidade');
    expect(res.valorRepresentante).toBe(12);
    expect(res.viavel).toBe(false);
  });

  it('deve marcar inviável quando o bruto fica insuficiente para o custo fixo', () => {
    const res = calcularSplit('custo_fixo', 10, 'entidade');
    expect(res.viavel).toBe(false);
    expect(res.valorRepresentante).toBe(12);
  });

  it('percentual não é usado no custo_fixo — percentualAplicado deve ser undefined', () => {
    const res = calcularSplit('custo_fixo', 100, 'entidade', 20);
    expect(res.percentualAplicado).toBeUndefined();
  });
});

// ─── montarSplitAsaas ────────────────────────────────────────────────────────

describe('montarSplitAsaas()', () => {
  it('deve retornar null se walletId for null', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    expect(montarSplitAsaas(null, split)).toBeNull();
  });

  it('deve retornar null se walletId for undefined', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    expect(montarSplitAsaas(undefined, split)).toBeNull();
  });

  it('deve retornar null se split for inviável', () => {
    const split = calcularSplit('percentual', 20, 'entidade', 80);
    expect(split.viavel).toBe(false);
    expect(montarSplitAsaas('wallet_123', split)).toBeNull();
  });

  it('deve retornar null se valorRepresentante <= 0', () => {
    const split = calcularSplit('custo_fixo', 12, 'entidade');
    // valorRepresentante = 0
    expect(montarSplitAsaas('wallet_123', split)).toBeNull();
  });

  it('deve retornar array com um item para split viável', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    const result = montarSplitAsaas('wallet_abc', split);
    expect(result).not.toBeNull();
    expect(Array.isArray(result)).toBe(true);
    expect(result!.length).toBe(1);
    expect(result![0].walletId).toBe('wallet_abc');
  });

  it('deve usar fixedValue para modelo custo_fixo', () => {
    const split = calcularSplit('custo_fixo', 100, 'entidade');
    const result = montarSplitAsaas('wallet_xyz', split);
    expect(result).not.toBeNull();
    expect(result![0].fixedValue).toBeDefined();
    expect(result![0].fixedValue).toBe(split.valorRepresentante);
    expect(result![0].percentualValue).toBeUndefined();
  });

  it('deve considerar taxa do gateway quando informada explicitamente', () => {
    const split = calcularSplit(
      'percentual',
      100,
      'entidade',
      20,
      0,
      undefined,
      { valorTaxaGateway: 3 }
    );

    expect(split.valorRepresentante).toBe(18);
    expect(split.valorQWork).toBe(72);
  });

  it('deve usar fixedValue para modelo percentual (Asaas usa fixedValue para exatidão)', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 25);
    const result = montarSplitAsaas('wallet_xyz', split);
    expect(result).not.toBeNull();
    expect(result![0].fixedValue).toBe(split.valorRepresentante);
    expect(result![0].fixedValue).toBe(23.25);
  });
});

// ─── calcularSplit — com configuracoes de gateway ────────────────────────────

describe('calcularSplit() — com configuracoes dinâmicas do gateway', () => {
  const configuracoesBoleto = [
    { codigo: 'boleto', tipo: 'taxa_fixa' as const, valor: 2.9, ativo: true, descricao: null },
    { codigo: 'taxa_transacao', tipo: 'taxa_fixa' as const, valor: 2.05, ativo: true, descricao: null },
    { codigo: 'impostos', tipo: 'percentual' as const, valor: 7.0, ativo: true, descricao: null },
  ];

  it('sem configuracoes: baseLiquida = bruto - 7% impostos', () => {
    const res = calcularSplit('percentual', 100, 'entidade', 20);
    // impostos=7, gateway=0 → baseLiquida=93
    expect(res.baseLiquida).toBe(93);
    expect(res.valorRepresentante).toBe(18.6);
  });

  it('com configuracoes boleto: baseLiquida reduzida pela taxa do gateway + taxa_transacao', () => {
    const res = calcularSplit('percentual', 100, 'entidade', 20, 0, undefined, {
      metodoPagamento: 'boleto',
      configuracoes: configuracoesBoleto,
    });
    // impostos=7, boleto=2.90, taxa_transacao=2.05 → gateway=4.95 → baseLiquida=88.05
    expect(res.baseLiquida).toBe(88.05);
    expect(res.valorRepresentante).toBe(17.61);
    expect(res.valorImpostos).toBe(7);
    expect(res.valorGateway).toBe(4.95);
    expect(res.viavel).toBe(true);
  });

  it('taxa_transacao = 0 (sem a config) resulta em gateway = só boleto', () => {
    const configSemTransacao = [
      { codigo: 'boleto', tipo: 'taxa_fixa' as const, valor: 2.9, ativo: true, descricao: null },
    ];
    const res = calcularSplit('percentual', 100, 'entidade', 20, 0, undefined, {
      metodoPagamento: 'boleto',
      configuracoes: configSemTransacao,
    });
    // sem taxa_transacao: gateway = 2.90 → baseLiquida = 100 - 7 - 2.90 = 90.10
    expect(res.baseLiquida).toBe(90.1);
    expect(res.valorGateway).toBe(2.9);
  });

  it('com configuracoes PIX: aplica percentual de 0.99%', () => {
    const configPix = [
      { codigo: 'pix', tipo: 'percentual' as const, valor: 0.99, ativo: true, descricao: null },
      { codigo: 'taxa_transacao', tipo: 'taxa_fixa' as const, valor: 2.05, ativo: true, descricao: null },
    ];
    const res = calcularSplit('percentual', 200, 'entidade', 20, 0, undefined, {
      metodoPagamento: 'pix',
      configuracoes: configPix,
    });
    // impostos = 14, pix = 200 * 0.99% = 1.98, taxa_transacao = 2.05 → gateway = 4.03
    // baseLiquida = 200 - 14 - 4.03 = 181.97
    expect(res.valorImpostos).toBe(14);
    expect(res.valorGateway).toBe(4.03);
    expect(res.baseLiquida).toBe(181.97);
  });
});

// ─── montarSplitAsaas — split completo com impostos e sócios ─────────────────

describe('montarSplitAsaas() — split societário completo', () => {
  const configuracoesBoleto = [
    { codigo: 'boleto', tipo: 'taxa_fixa' as const, valor: 2.9, ativo: true, descricao: null },
    { codigo: 'taxa_transacao', tipo: 'taxa_fixa' as const, valor: 2.05, ativo: true, descricao: null },
  ];

  it('sem opcoes: retorna apenas item do representante (1 item — backward compat)', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    const result = montarSplitAsaas('wallet_rep', split);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(1);
    expect(result![0].walletId).toBe('wallet_rep');
  });

  it('com impostosWalletId: retorna rep + impostos (2 itens)', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    // sem gateway → valorImpostos=7, valorRep=18.6
    const result = montarSplitAsaas('wallet_rep', split, null, {
      impostosWalletId: 'wallet_qwork',
    });
    expect(result).not.toBeNull();
    expect(result!.length).toBe(2);
    expect(result![0]).toEqual({ walletId: 'wallet_rep', fixedValue: 18.6 });
    expect(result![1]).toEqual({ walletId: 'wallet_qwork', fixedValue: 7 });
  });

  it('com beneficiarios socios e impostos: retorna 4 itens na ordem correta', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20, 0, undefined, {
      metodoPagamento: 'boleto',
      configuracoes: configuracoesBoleto,
    });
    // baseLiquida=88.05, rep=17.61, impostos=7, socios=70.44 (ronaldo=35.22, antonio=35.22)

    const result = montarSplitAsaas('wallet_rep', split, null, {
      impostosWalletId: 'wallet_qwork',
      beneficiarios: [
        { walletId: 'wallet_ronaldo', percentual: 50 },
        { walletId: 'wallet_antonio', percentual: 50 },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.length).toBe(4);
    // 1. Representante
    expect(result![0]).toEqual({ walletId: 'wallet_rep', fixedValue: 17.61 });
    // 2. Impostos (7%)
    expect(result![1]).toEqual({ walletId: 'wallet_qwork', fixedValue: 7 });
    // 3. Sócios (50%/50% de valorQWork=70.44)
    expect(result![2]).toEqual({ walletId: 'wallet_ronaldo', fixedValue: 35.22 });
    expect(result![3]).toEqual({ walletId: 'wallet_antonio', fixedValue: 35.22 });
  });

  it('com comercial + socios + impostos: retorna 5 itens na ordem correta', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20, 10);
    // impostos=7, gateway=0, baseLiquida=93
    // rep = 93*20% = 18.6
    // comercial (percentual model) = 93*10% = 9.3
    // margemLivre = 93 - 18.6 = 74.4
    // valorParaSocios = 74.4 - 9.3 = 65.1

    const result = montarSplitAsaas('wallet_rep', split, 'wallet_comercial', {
      impostosWalletId: 'wallet_qwork',
      beneficiarios: [
        { walletId: 'wallet_ronaldo', percentual: 50 },
        { walletId: 'wallet_antonio', percentual: 50 },
      ],
    });

    expect(result).not.toBeNull();
    expect(result!.length).toBe(5);
    expect(result![0].walletId).toBe('wallet_rep');
    expect(result![1].walletId).toBe('wallet_comercial');
    expect(result![2].walletId).toBe('wallet_qwork');
    expect(result![3].walletId).toBe('wallet_ronaldo');
    expect(result![4].walletId).toBe('wallet_antonio');
  });

  it('beneficiario sem walletId é ignorado no split', () => {
    const split = calcularSplit('percentual', 100, 'entidade', 20);
    const result = montarSplitAsaas('wallet_rep', split, null, {
      beneficiarios: [
        { walletId: null, percentual: 50 },
        { walletId: 'wallet_antonio', percentual: 50 },
      ],
    });
    // apenas antonio é incluído (ronaldo sem walletId é filtrado)
    expect(result).not.toBeNull();
    const socios = result!.filter((i) => i.walletId === 'wallet_antonio');
    expect(socios.length).toBe(1);
    // antonio como único sócio recebe 100% do valorQWork (=74.4)
    expect(socios[0].fixedValue).toBe(74.4);
  });

  it('sem split viável: retorna null mesmo com opcoes completas', () => {
    const split = calcularSplit('percentual', 20, 'entidade', 80); // inviável
    const result = montarSplitAsaas('wallet_rep', split, null, {
      impostosWalletId: 'wallet_qwork',
      beneficiarios: [{ walletId: 'wallet_ronaldo', percentual: 100 }],
    });
    expect(result).toBeNull();
  });
});
