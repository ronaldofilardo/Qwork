/**
 * @fileoverview Testes de exibição do % de comissão
 * Cobre tanto a página /admin/representantes quanto o componente RepresentantesContent
 * (usado no dashboard /admin).
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock de módulos necessários
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/admin/representantes',
}));

global.fetch = jest.fn();
const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

const repBase = {
  id: 1,
  nome: 'Carlos Representante',
  email: 'carlos@rep.dev',
  codigo: 'AB12-CD34',
  status: 'ativo',
  tipo_pessoa: 'pf',
  criado_em: '2024-01-15T00:00:00Z',
  total_leads: '5',
  leads_convertidos: '2',
  vinculos_ativos: '3',
  valor_total_pago: '1500.00',
  comissoes_pendentes_pagamento: null,
};

function setupFetch(percentual_comissao: string | null) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      representantes: [{ ...repBase, percentual_comissao }],
      total: 1,
      page: 1,
      limit: 30,
    }),
  } as Response);
}

describe('Admin Representantes — coluna % Comissão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe a coluna "% Comissão" no cabeçalho da tabela', async () => {
    setupFetch('5.00');
    const Page = (await import('@/app/admin/representantes/page')).default;
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText(/% Comissão/i)).toBeInTheDocument();
    });
  });

  it('exibe o percentual formatado quando definido (ex: 7.50%)', async () => {
    setupFetch('7.50');
    const Page = (await import('@/app/admin/representantes/page')).default;
    render(<Page />);
    await waitFor(() => {
      expect(screen.getByText('7.50%')).toBeInTheDocument();
    });
  });

  it('exibe "—" quando percentual_comissao é null', async () => {
    setupFetch(null);
    const Page = (await import('@/app/admin/representantes/page')).default;
    render(<Page />);
    await waitFor(() => {
      // Busca a célula da coluna % Comissão usando role
      const cells = screen.getAllByRole('cell');
      const comissaoCell = cells.find((c) => c.textContent === '—');
      expect(comissaoCell).toBeDefined();
    });
  });

  it('exibe "—" quando percentual_comissao é string vazia', async () => {
    setupFetch('');
    const Page = (await import('@/app/admin/representantes/page')).default;
    render(<Page />);
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      const comissaoCell = cells.find((c) => c.textContent === '—');
      expect(comissaoCell).toBeDefined();
    });
  });
});

// ─── RepresentantesContent (componente usado no dashboard /admin) ────────────

describe('RepresentantesContent — coluna % Comissão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe a coluna "% Comissão" no cabeçalho', async () => {
    setupFetch('3.00');
    const { RepresentantesContent } =
      await import('@/components/admin/RepresentantesContent');
    render(<RepresentantesContent />);
    await waitFor(() => {
      expect(screen.getByText(/% Comissão/i)).toBeInTheDocument();
    });
  });

  it('exibe o percentual formatado quando definido', async () => {
    setupFetch('12.50');
    const { RepresentantesContent } =
      await import('@/components/admin/RepresentantesContent');
    render(<RepresentantesContent />);
    await waitFor(() => {
      expect(screen.getByText('12.50%')).toBeInTheDocument();
    });
  });

  it('exibe "—" quando percentual_comissao é null', async () => {
    setupFetch(null);
    const { RepresentantesContent } =
      await import('@/components/admin/RepresentantesContent');
    render(<RepresentantesContent />);
    await waitFor(() => {
      const cells = screen.getAllByRole('cell');
      const cell = cells.find((c) => c.textContent === '—');
      expect(cell).toBeDefined();
    });
  });
});
