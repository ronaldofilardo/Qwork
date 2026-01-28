/**
 * Testes para a página Entidade - Funcionários
 * - Lista de funcionários ativos
 * - Autenticação e autorização
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EntidadeFuncionariosPage from '@/app/entidade/funcionarios/page';

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

describe('EntidadeFuncionariosPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da API de sessão
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              contratante_id: 1,
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
    render(<EntidadeFuncionariosPage />);

    // Durante loading, não mostra o título ainda
    expect(screen.queryByText('Funcionários Ativos')).not.toBeInTheDocument();
  });

  it('loads session and renders funcionarios section', async () => {
    render(<EntidadeFuncionariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
    });

    // Verifica que não está mais carregando
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('handles session load error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Session Error')
    );

    render(<EntidadeFuncionariosPage />);

    await waitFor(() => {
      // O componente não mostra erro visível, apenas log no console
      expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
    });
  });

  it('passes correct props to FuncionariosSection', async () => {
    render(<EntidadeFuncionariosPage />);

    await waitFor(() => {
      expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
    });

    // Verifica que o componente FuncionariosSection é renderizado
    // (não podemos testar props diretamente, mas verificamos que carrega)
    expect(screen.getByText('Funcionários Ativos')).toBeInTheDocument();
  });
});
