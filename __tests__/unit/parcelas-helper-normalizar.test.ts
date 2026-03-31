/**
 * Testes unitários para normalizarDetalhesParcelas
 * Cobre o cenário de dados stale: lote pago mas detalhes_parcelas
 * nunca atualizado pelo webhook (webhook processou antes do fix).
 */

import {
  normalizarDetalhesParcelas,
  type Parcela,
} from '@/lib/parcelas-helper';

const makeParcelas = (n: number, override: Partial<Parcela> = {}): Parcela[] =>
  Array.from({ length: n }, (_, i) => ({
    numero: i + 1,
    valor: 20,
    data_vencimento: `2026-0${i + 3}-18`,
    pago: false,
    data_pagamento: null,
    status: 'pendente' as const,
    ...override,
  }));

describe('normalizarDetalhesParcelas', () => {
  describe('quando pagamentoStatus não é pago', () => {
    it('retorna parcelas sem alteração se status=pendente', () => {
      const parcelas = makeParcelas(3);
      const resultado = normalizarDetalhesParcelas(parcelas, 'pendente', null);
      expect(resultado).toEqual(parcelas);
    });

    it('retorna parcelas sem alteração se status=processando', () => {
      const parcelas = makeParcelas(2);
      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'processando',
        null
      );
      expect(resultado).toEqual(parcelas);
    });
  });

  describe('quando pagamentoStatus é pago e alguma parcela já está paga', () => {
    it('não modifica parcelas já corretas', () => {
      const parcelas = makeParcelas(5);
      parcelas[0].pago = true;
      parcelas[0].status = 'pago';
      parcelas[0].data_pagamento = '2026-03-18';

      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18'
      );
      expect(resultado).toEqual(parcelas);
    });

    it('é idempotente: chamadas repetidas não alteram o resultado', () => {
      const parcelas = makeParcelas(3);
      const primeira = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18'
      );
      const segunda = normalizarDetalhesParcelas(
        primeira,
        'pago',
        '2026-03-18'
      );
      expect(segunda).toEqual(primeira);
    });
  });

  describe('quando pagamentoStatus é pago e nenhuma parcela está paga (stale)', () => {
    it('marca a parcela 1 como paga com a dataPagamento fornecida', () => {
      const parcelas = makeParcelas(5);
      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18T22:24:00Z'
      );

      expect(resultado[0].pago).toBe(true);
      expect(resultado[0].status).toBe('pago');
      expect(resultado[0].data_pagamento).toBe('2026-03-18T22:24:00Z');
    });

    it('não altera as outras parcelas além da 1ª', () => {
      const parcelas = makeParcelas(5);
      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18'
      );

      for (let i = 1; i < resultado.length; i++) {
        expect(resultado[i].pago).toBe(false);
        expect(resultado[i].status).toBe('pendente');
        expect(resultado[i].data_pagamento).toBeNull();
      }
    });

    it('marca o elemento com menor número quando numeração não começa em 1', () => {
      // Cenário improvável mas defensivo: array sem parcela 1
      const parcelas: Parcela[] = [
        {
          numero: 2,
          valor: 20,
          data_vencimento: '2026-04-18',
          pago: false,
          data_pagamento: null,
          status: 'pendente',
        },
        {
          numero: 3,
          valor: 20,
          data_vencimento: '2026-05-18',
          pago: false,
          data_pagamento: null,
          status: 'pendente',
        },
      ];
      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18'
      );
      expect(resultado[0].pago).toBe(true); // numero=2, o menor
      expect(resultado[1].pago).toBe(false);
    });

    it('usa data atual quando dataPagamento é null', () => {
      const antes = Date.now();
      const parcelas = makeParcelas(2);
      const resultado = normalizarDetalhesParcelas(parcelas, 'pago', null);
      const depois = Date.now();

      expect(resultado[0].pago).toBe(true);
      const dataPag = new Date(resultado[0].data_pagamento).getTime();
      expect(dataPag).toBeGreaterThanOrEqual(antes);
      expect(dataPag).toBeLessThanOrEqual(depois);
    });

    it('não muta o array original (imutabilidade)', () => {
      const parcelas = makeParcelas(3);
      const copiaProfunda = JSON.parse(JSON.stringify(parcelas));
      normalizarDetalhesParcelas(parcelas, 'pago', '2026-03-18');
      expect(parcelas).toEqual(copiaProfunda);
    });
  });

  describe('casos edge', () => {
    it('retorna array vazio sem modificação', () => {
      expect(normalizarDetalhesParcelas([], 'pago', null)).toEqual([]);
    });

    it('funciona com pagamento de 1 parcela', () => {
      const parcelas = makeParcelas(1);
      const resultado = normalizarDetalhesParcelas(
        parcelas,
        'pago',
        '2026-03-18'
      );
      expect(resultado[0].pago).toBe(true);
    });
  });
});
