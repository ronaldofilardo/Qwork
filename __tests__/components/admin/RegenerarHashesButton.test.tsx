/**
 * Testes para Componente Admin - Regenerar Hashes Button
 *
 * Valida:
 * 1. Componente renderiza corretamente
 * 2. Botão inicia processo de regeneração
 * 3. Loading state é exibido durante processamento
 * 4. Resultados são exibidos após conclusão
 * 5. Erros são tratados adequadamente
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RegenerarHashesButton from '@/components/admin/RegenerarHashesButton';

// Mock do react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(() => 'loading-id'),
    dismiss: jest.fn(),
  },
}));

// Mock do fetch
global.fetch = jest.fn();

// Mock do window.confirm
global.confirm = jest.fn(() => true);

describe('Componente Admin - Regenerar Hashes Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  describe('Renderização', () => {
    it('deve renderizar botão de regenerar hashes', () => {
      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(/regenerar/i);
    });
  });

  describe('Interação e Loading State', () => {
    it('deve solicitar confirmação antes de iniciar', async () => {
      const user = userEvent.setup();
      (global.confirm as jest.Mock).mockReturnValue(false);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          processados: 0,
          atualizados: 0,
          erros: 0,
        }),
      });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      expect(global.confirm).toHaveBeenCalled();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('deve desabilitar botão durante processamento', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockImplementationOnce(
        () => new Promise(() => {}) // Promessa que nunca resolve
      );

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');

      await user.click(button);

      await waitFor(() => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Sucesso na Regeneração', () => {
    it('deve exibir resultados após processamento bem-sucedido', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        success: true,
        processados: 10,
        atualizados: 7,
        arquivosNaoEncontrados: 2,
        erros: 1,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText(/processados.*10/i)).toBeInTheDocument();
      });
    });

    it('deve chamar API correta', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          processados: 0,
          atualizados: 0,
          arquivosNaoEncontrados: 0,
          erros: 0,
        }),
      });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/laudos/regenerar-hashes',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve exibir mensagem de erro quando API falha', async () => {
      const user = userEvent.setup();
      const toast = require('react-hot-toast').default;

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Erro no servidor' }),
      });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(
          expect.stringContaining('Erro')
        );
      });
    });

    it('deve tratar erro de rede', async () => {
      const user = userEvent.setup();
      const toast = require('react-hot-toast').default;

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('deve reabilitar botão após erro', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Error'));

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Exibição de Estatísticas', () => {
    it('deve exibir estatísticas após regeneração', async () => {
      const user = userEvent.setup();

      const mockResponse = {
        success: true,
        processados: 15,
        atualizados: 10,
        arquivosNaoEncontrados: 3,
        erros: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        // Verificar que as estatísticas aparecem
        expect(screen.getByText(/processados/i)).toBeInTheDocument();
        expect(screen.getByText(/15/)).toBeInTheDocument();
      });
    });
  });

  describe('Múltiplas Execuções', () => {
    it('deve permitir nova execução após completar', async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            processados: 5,
            atualizados: 5,
            arquivosNaoEncontrados: 0,
            erros: 0,
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            processados: 3,
            atualizados: 3,
            arquivosNaoEncontrados: 0,
            erros: 0,
          }),
        });

      render(<RegenerarHashesButton />);

      const button = screen.getByRole('button');

      // Primeira execução
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText(/5/)).toBeInTheDocument();
      });

      // Segunda execução
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText(/3/)).toBeInTheDocument();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
