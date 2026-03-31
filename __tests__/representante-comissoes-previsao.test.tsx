/**
 * @file __tests__/representante-comissoes-previsao.test.tsx
 * Testes: Representante Comissões Page
 */

import { test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Page from '@/app/representante/(portal)/comissoes/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock do fetch global
global.fetch = vi.fn();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

describe('Representante Comissões Page', () => {
  it('deve renderizar a coluna Previsão na tabela de comissões', async () => {
    const mockComissoes = [
      {
        id: 1,
        entidade_nome: 'Cliente Teste',
        numero_laudo: 'L123',
        mes_emissao: '2026-02-01',
        mes_pagamento: '2026-03-01',
        valor_laudo: '100.00',
        valor_comissao: '10.00',
        status: 'liberada',
        data_pagamento: null,
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        comissoes: mockComissoes,
        total: 1,
        page: 1,
        limit: 30,
        resumo: {
          pendentes: '0',
          liberadas: '1',
          pagas: '0',
          valor_pendente: '0',
          valor_liberado: '10.00',
          valor_pago_total: '0',
        },
      }),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    );

    // Verifica se o cabeçalho da coluna existe
    const headerPrevisao = await screen.findByText(/Previsão/i);
    expect(headerPrevisao).toBeDefined();

    // Verifica se o valor da previsão está correto (mar. de 2026)
    const valorPrevisao = await screen.findByText(/mar\. de 2026/i);
    expect(valorPrevisao).toBeDefined();

    // Verifica se a estrutura está correta (Previsão ao lado de Status)
    const tableHeaders = screen.getAllByRole('columnheader');
    const statusIdx = tableHeaders.findIndex((h) => h.textContent === 'Status');
    const previsaoIdx = tableHeaders.findIndex(
      (h) => h.textContent === 'Previsão'
    );

    expect(previsaoIdx).toBe(statusIdx + 1);
  });
});
