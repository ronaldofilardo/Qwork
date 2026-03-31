/**
 * @file __tests__/components/LiberarAvaliacoes.test.tsx
 * Testes para o componente LiberarAvaliacoes
 *
 * Valida:
 *  - Renderização do botão
 *  - Loading state durante requisição
 *  - Toast de sucesso com dados retornados
 *  - Toast de erro com mensagem da API
 *  - Toast de erro em falha de conexão
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock react-hot-toast
const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
};
jest.mock('react-hot-toast', () => ({
  toast: mockToast,
}));

import LiberarAvaliacoes from '@/components/LiberarAvaliacoes';

// Mock fetch
global.fetch = jest.fn();

describe('LiberarAvaliacoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Renderização', () => {
    it('deve renderizar botão de liberar', () => {
      render(<LiberarAvaliacoes />);
      expect(
        screen.getByText('Liberar Avaliações para Todos Funcionários Ativos')
      ).toBeInTheDocument();
    });

    it('botão deve estar habilitado inicialmente', () => {
      render(<LiberarAvaliacoes />);
      const btn = screen.getByRole('button');
      expect(btn).not.toBeDisabled();
    });
  });

  describe('Estado Loading', () => {
    it('deve exibir "Liberando..." durante requisição', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Nunca resolve
      );

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Liberando...')).toBeInTheDocument();
    });

    it('deve desabilitar botão durante loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Sucesso', () => {
    it('deve chamar toast.success com dados retornados', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ criadas: 5, total: 10 }),
      });

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith(
          expect.stringContaining('5'),
          expect.any(Object)
        );
      });
    });

    it('deve reabilitar botão após sucesso', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ criadas: 0, total: 5 }),
      });

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });

  describe('Erro API', () => {
    it('deve chamar toast.error com mensagem de erro da API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Nenhum lote ativo' }),
      });

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Nenhum lote ativo');
      });
    });

    it('deve exibir erro genérico quando API não retorna mensagem', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      });

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith('Erro ao liberar');
      });
    });
  });

  describe('Erro de Conexão', () => {
    it('deve exibir erro de conexão quando fetch falha', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          'Erro de conexão com o servidor'
        );
      });
    });
  });

  describe('Endpoint', () => {
    it('deve chamar /api/avaliacao/liberar-massa com POST', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ criadas: 0, total: 0 }),
      });

      render(<LiberarAvaliacoes />);
      await userEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/avaliacao/liberar-massa',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ forcarNova: true }),
          }
        );
      });
    });
  });
});
