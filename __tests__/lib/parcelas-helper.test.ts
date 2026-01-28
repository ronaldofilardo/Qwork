import {
  calcularParcelas,
  isContratoQuitado,
  getStatusBadge,
  getResumoPagamento,
} from '@/lib/parcelas-helper';

describe('parcelas-helper', () => {
  test('calcula parcelas mantendo dia do primeiro pagamento e marca primeira como paga', () => {
    const dataInicial = new Date('2025-12-27T10:00:00Z');
    const parcelas = calcularParcelas({
      valorTotal: 2000,
      numeroParcelas: 4,
      dataInicial,
    });

    expect(parcelas).toHaveLength(4);

    // Primeira parcela
    expect(parcelas[0].numero).toBe(1);
    expect(parcelas[0].pago).toBe(true);
    expect(parcelas[0].data_vencimento).toBe('2025-12-27');

    // Parcelas subsequentes mantêm o dia (27) nos meses seguintes
    expect(parcelas[1].data_vencimento).toBe('2026-01-27');
    expect(parcelas[2].data_vencimento).toBe('2026-02-27');
    expect(parcelas[3].data_vencimento).toBe('2026-03-27');
  });

  test('calcula parcelas com ajuste de fim de mês corretamente', () => {
    const dataInicial = new Date('2026-01-31T12:00:00Z');
    const parcelas = calcularParcelas({
      valorTotal: 900,
      numeroParcelas: 3,
      dataInicial,
    });

    expect(parcelas).toHaveLength(3);
    expect(parcelas[0].data_vencimento).toBe('2026-01-31');
    // Fevereiro de 2026 não tem 31, deve ajustar para 28
    expect(parcelas[1].data_vencimento).toBe('2026-02-28');
    expect(parcelas[2].data_vencimento).toBe('2026-03-31');
  });

  test('isContratoQuitado e getStatusBadge e getResumoPagamento', () => {
    const parcelas = [
      {
        numero: 1,
        valor: 100,
        data_vencimento: '2025-12-01',
        pago: true,
        data_pagamento: '2025-12-01T10:00:00Z',
        status: 'pago' as const,
      },
      {
        numero: 2,
        valor: 100,
        data_vencimento: '2026-01-01',
        pago: false,
        data_pagamento: null,
        status: 'pendente' as const,
      },
    ];

    expect(isContratoQuitado(parcelas)).toBe(false);
    const badge = getStatusBadge(parcelas);
    expect(badge.label).toBe('Em Aberto');

    const resumo = getResumoPagamento(parcelas);
    expect(resumo.totalParcelas).toBe(2);
    expect(resumo.parcelasPagas).toBe(1);
    expect(resumo.parcelasPendentes).toBe(1);
    expect(resumo.statusGeral).toBe('em_aberto');

    // Quando todas pagas
    const todasPagas = parcelas.map((p) => ({
      ...p,
      pago: true,
      status: 'pago' as const,
    }));
    expect(isContratoQuitado(todasPagas)).toBe(true);
    expect(getStatusBadge(todasPagas).label).toBe('Quitado');
  });
});
