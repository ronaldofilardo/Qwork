import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ContratosTable } from '@/components/shared/ContratosTable';

jest.mock('@/components/comercial/contratos/VincularRepDrawer', () => ({
  VincularRepDrawer: () => null,
}));

describe('ContratosTable', () => {
  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        contratos: [
          {
            contratante_nome: 'Tomador Isento SA',
            contratante_cnpj: '11222333000100',
            contratante_id: 10,
            vinculo_id: 1,
            tipo_contratante: 'entidade',
            rep_nome: 'Maria Rep',
            rep_codigo: 'REP123',
            rep_cpf: '11122233344',
            lead_data: '2026-04-01T00:00:00.000Z',
            contrato_data: '2026-04-02',
            tempo_dias: '1',
            tipo_comissionamento: 'percentual',
            percentual_comissao: '10.00',
            valor_custo_fixo: null,
            valor_negociado: '1200.00',
            total_laudos: '2',
            total_lotes: '1',
            avaliacoes_concluidas: '4',
            valor_avaliacao: '25.00',
            valor_total: '100.00',
            perc_comercial: '3.00',
            valor_comercial: '3.00',
            perc_rep: '10.00',
            valor_rep: '10.00',
            valor_qwork: '87.00',
            isento_pagamento: true,
          },
        ],
      }),
    } as Response);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exibe selo visual e mensagem para tomador isento', async () => {
    render(<ContratosTable endpoint="/api/admin/contratos" showQWork />);

    await waitFor(() => {
      expect(screen.getByText('Tomador Isento SA')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Tomador isento')).toBeInTheDocument();
    expect(
      screen.getByText('Cobrança dispensada para este tomador')
    ).toBeInTheDocument();
  });
});
