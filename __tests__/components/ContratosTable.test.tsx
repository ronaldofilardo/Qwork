import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      expect(screen.getAllByText('Tomador Isento SA').length).toBeGreaterThan(
        0
      );
    });

    expect(screen.getByLabelText('Tomador isento')).toBeInTheDocument();
    expect(
      screen.getByText('Cobrança dispensada para este tomador')
    ).toBeInTheDocument();
  });

  it('exibe o botão de contrato no suporte mesmo quando o tomador não tem lead', async () => {
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = String(input);

      if (url === '/api/suporte/contratos') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            contratos: [
              {
                contratante_nome: 'Clínica Sem Lead',
                contratante_cnpj: '59396025000107',
                contratante_id: 77,
                vinculo_id: null,
                tipo_contratante: 'clinica',
                rep_nome: null,
                rep_codigo: null,
                rep_cpf: null,
                lead_data: null,
                contrato_data: null,
                tempo_dias: null,
                tipo_comissionamento: null,
                percentual_comissao: null,
                valor_custo_fixo: null,
                valor_negociado: null,
                total_laudos: '0',
                total_lotes: '0',
                avaliacoes_concluidas: '0',
                valor_avaliacao: null,
                valor_total: null,
                perc_comercial: null,
                valor_comercial: null,
                perc_rep: null,
                valor_rep: null,
                isento_pagamento: false,
              },
            ],
          }),
        } as Response);
      }

      return Promise.resolve({
        ok: true,
        blob: async () => new Blob(),
      } as Response);
    });

    render(
      <ContratosTable endpoint="/api/suporte/contratos" allowGerarContrato />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Clínica Sem Lead').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('Baixar contrato').length).toBeGreaterThan(0);
  });

  it('permite expandir clínica no suporte e listar suas empresas', async () => {
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const url = String(input);

      if (url === '/api/suporte/contratos') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            contratos: [
              {
                contratante_nome: 'Clínica Exemplo',
                contratante_cnpj: '59396025000107',
                contratante_id: 99,
                vinculo_id: null,
                tipo_contratante: 'clinica',
                rep_nome: null,
                rep_codigo: null,
                rep_cpf: null,
                lead_data: null,
                contrato_data: null,
                tempo_dias: null,
                tipo_comissionamento: null,
                percentual_comissao: null,
                valor_custo_fixo: null,
                valor_negociado: null,
                total_laudos: '0',
                total_lotes: '0',
                avaliacoes_concluidas: '0',
                valor_avaliacao: null,
                valor_total: null,
                perc_comercial: null,
                valor_comercial: null,
                perc_rep: null,
                valor_rep: null,
                isento_pagamento: false,
              },
            ],
          }),
        } as Response);
      }

      if (url === '/api/admin/clinicas/99/empresas') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            empresas: [
              {
                id: 1,
                nome: 'Empresa Alpha',
                cnpj: '12345678000199',
                ativa: true,
                total_funcionarios: 12,
                total_avaliacoes: 8,
                avaliacoes_concluidas: 7,
                avaliacoes_liberadas: 1,
              },
            ],
          }),
        } as Response);
      }

      return Promise.resolve({ ok: false } as Response);
    });

    render(
      <ContratosTable
        endpoint="/api/suporte/contratos"
        allowExpandClinicaEmpresas
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Clínica Exemplo').length).toBeGreaterThan(0);
    });

    fireEvent.click(
      screen.getAllByRole('button', { name: 'Ver empresas da clínica' })[0]
    );

    await waitFor(() => {
      expect(screen.getAllByText('Empresa Alpha').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText('CNPJ: 12345678000199').length).toBeGreaterThan(
      0
    );
  });

  it('modo suporte: exibe coluna Responsavel e omite Representante, Tempo e Com. Rep.', async () => {
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        contratos: [
          {
            contratante_nome: 'Entidade Suporte',
            contratante_cnpj: '22333444000155',
            contratante_id: 20,
            vinculo_id: 3,
            tipo_contratante: 'entidade',
            rep_nome: 'Joao Rep',
            rep_codigo: 'JR01',
            rep_cpf: '99988877766',
            lead_data: '2026-03-01T00:00:00.000Z',
            contrato_data: '2026-03-10',
            tempo_dias: '9',
            tipo_comissionamento: 'percentual',
            percentual_comissao: '12.00',
            valor_custo_fixo: null,
            valor_negociado: null,
            total_laudos: '3',
            total_lotes: '2',
            avaliacoes_concluidas: '6',
            valor_avaliacao: '30.00',
            valor_total: '180.00',
            perc_rep: '12.00',
            valor_rep: '21.60',
            isento_pagamento: false,
            responsavel_cpf: '11122233344',
          },
        ],
      }),
    } as Response);

    render(
      <ContratosTable
        endpoint="/api/suporte/contratos"
        allowGerarContrato
        allowExpandClinicaEmpresas
        suporte
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Entidade Suporte').length).toBeGreaterThan(0);
    });

    // Coluna Responsavel deve existir (pode aparecer no header e no mobile card)
    expect(screen.getAllByText('Responsável').length).toBeGreaterThan(0);

    // Header da tabela desktop nao deve conter "Representante", "Com. Rep.", "Tempo"
    const headers = screen.getAllByRole('columnheader');
    const headerTexts = headers.map((h) => h.textContent ?? '');
    expect(headerTexts.some((t) => t.includes('Representante'))).toBe(false);
    expect(headerTexts.some((t) => t.includes('Com. Rep.'))).toBe(false);
    expect(headerTexts.some((t) => t.includes('Tempo'))).toBe(false);

    // Tipo deve ser o nome completo
    expect(screen.getAllByText('Percentual').length).toBeGreaterThan(0);
  });

  it('modo suporte: exibe CPF do responsavel formatado', async () => {
    jest.restoreAllMocks();
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        contratos: [
          {
            contratante_nome: 'Clinica RH Test',
            contratante_cnpj: '55666777000188',
            contratante_id: 30,
            vinculo_id: null,
            tipo_contratante: 'clinica',
            rep_nome: null,
            rep_codigo: null,
            rep_cpf: null,
            lead_data: null,
            contrato_data: null,
            tempo_dias: null,
            tipo_comissionamento: 'custo_fixo',
            percentual_comissao: null,
            valor_custo_fixo: '40.00',
            valor_negociado: '50.00',
            total_laudos: '0',
            total_lotes: '0',
            avaliacoes_concluidas: '0',
            valor_avaliacao: null,
            valor_total: null,
            perc_rep: null,
            valor_rep: null,
            isento_pagamento: false,
            responsavel_cpf: '98765432100',
          },
        ],
      }),
    } as Response);

    render(
      <ContratosTable
        endpoint="/api/suporte/contratos"
        allowGerarContrato
        suporte
      />
    );

    await waitFor(() => {
      expect(screen.getAllByText('Clinica RH Test').length).toBeGreaterThan(0);
    });

    // CPF formatado do responsavel deve aparecer (mobile e desktop)
    expect(screen.getAllByText('987.654.321-00').length).toBeGreaterThan(0);

    // Tipo custo_fixo deve ser nome completo
    expect(screen.getAllByText('Custo Fixo').length).toBeGreaterThan(0);
  });
});
