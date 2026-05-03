import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  query: {},
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => new URLSearchParams(),
}));

// Import do componente após o mock
import RhEmpresasPage from '@/app/rh/empresas/page';

// Mock das APIs
global.fetch = jest.fn();

describe('RhEmpresasPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays empresas correctly', async () => {
    // Mock da API para retornar empresas
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                nome: 'Empresa Teste 1',
                cnpj: '12.345.678/0001-90',
                funcionarios_count: 50,
                lotes_count: 3,
                ultima_avaliacao: '2024-12-01',
              },
            ]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<RhEmpresasPage />);

    // Verifica que o header aparece
    await waitFor(() => {
      expect(screen.getByText('Gerenciar Empresas')).toBeInTheDocument();
    });

    // Verifica que as empresas são exibidas
    expect(screen.getByText('Empresa Teste 1')).toBeInTheDocument();
    expect(screen.getByText('CNPJ: 12.345.678/0001-90')).toBeInTheDocument();
  });

  it('shows empty state when no empresas', async () => {
    // Mock da API para retornar empresas vazias
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<RhEmpresasPage />);

    await waitFor(() => {
      expect(
        screen.getByText('Nenhuma empresa cadastrada')
      ).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    // Mock para retornar erro
    (global.fetch as jest.Mock).mockImplementationOnce((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Erro ao carregar empresas' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<RhEmpresasPage />);

    await waitFor(() => {
      // Quando há erro, deve mostrar o estado vazio
      expect(
        screen.getByText('Nenhuma empresa cadastrada')
      ).toBeInTheDocument();
    });
  });

  it('handles 403 error (no clinica_id)', async () => {
    // Mock para retornar erro 403
    (global.fetch as jest.Mock).mockImplementationOnce((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: () =>
            Promise.resolve({ error: 'Você não está vinculado a uma clínica' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    render(<RhEmpresasPage />);

    await waitFor(() => {
      // Deve mostrar mensagem de erro de configuração
      expect(screen.getByText('Erro de Configuração')).toBeInTheDocument();
    });
  });
});
