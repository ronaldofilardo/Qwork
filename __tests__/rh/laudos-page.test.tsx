/**
 * Testes para a página RH - Laudos
 * - Lista de laudos emitidos
 * - Estatísticas de laudos
 * - Autenticação e autorização
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhLaudosPage from '@/app/rh/laudos/page';

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  query: {},
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock das APIs
global.fetch = jest.fn();

describe('RhLaudosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da API de laudos
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/rh/laudos') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              laudos: [
                {
                  id: 1,
                  lote_id: 101,
                  empresa_nome: 'Empresa Teste 1',
                  status: 'enviado',
                  data_emissao: '2024-12-15',
                  arquivos: {
                    relatorio_lote: '/api/download/laudo-1.pdf',
                  },
                },
                {
                  id: 2,
                  lote_id: 102,
                  empresa_nome: 'Empresa Teste 2',
                  status: 'pendente',
                  data_emissao: null,
                  arquivos: {},
                },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });
  });

  it('renders page title and loading state', () => {
    render(<RhLaudosPage />);

    // Durante loading, não mostra o título ainda
    expect(screen.queryByText('Laudos')).not.toBeInTheDocument();
  });

  it('loads and displays laudos correctly', async () => {
    render(<RhLaudosPage />);

    await waitFor(() => {
      expect(screen.getByText('Total de Laudos')).toBeInTheDocument();
    });

    // Verifica estatísticas
    expect(screen.getByText('Total de Laudos')).toBeInTheDocument();
    expect(screen.getByText('Laudos Emitidos')).toBeInTheDocument();
    // Rótulo atualizado para 'Laudos em Elaboração' no layout
    expect(screen.getByText('Laudos em Elaboração')).toBeInTheDocument();

    // Verifica dados dos laudos na tabela
    // O componente exibe 'Lote #<lote_id>' (não LOTE-001 / titulo)
    expect(screen.getByText('Lote #101')).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    expect(screen.getByText('enviado')).toBeInTheDocument();
  });

  it('handles download action', async () => {
    // Sobrescrever mock para usar status 'emitido' COM arquivo para testar o link de download
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          laudos: [
            {
              id: 1,
              lote_id: 101,
              empresa_nome: 'Empresa Teste 1',
              status: 'emitido',
              data_emissao: '2024-12-15',
              arquivos: {
                relatorio_lote: '/api/download/laudo-1.pdf',
              },
            },
          ],
        }),
    });

    render(<RhLaudosPage />);

    await waitFor(() => {
      expect(screen.getByText('Lote #101')).toBeInTheDocument();
    });

    // Verifica que o link de download está presente para laudo com status 'emitido'
    const downloadLinks = screen.getAllByText('Baixar');
    expect(downloadLinks.length).toBeGreaterThanOrEqual(1);
    expect(downloadLinks[0].closest('a')).toHaveAttribute(
      'href',
      '/api/download/laudo-1.pdf'
    );
  });

  it('shows empty state when no laudos', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          laudos: [],
        }),
    });

    render(<RhLaudosPage />);

    await waitFor(() => {
      expect(screen.getByText('Total de Laudos')).toBeInTheDocument();
    });

    // Verifica que o primeiro contador mostra 0 (Total de Laudos)
    const totalElement = screen.getByText('Total de Laudos').parentElement;
    expect(totalElement?.textContent).toContain('0');
  });
});
