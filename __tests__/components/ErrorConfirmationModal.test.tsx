/**
 * Testes para o componente ErrorConfirmationModal
 * Modal de confirmação que aparece quando há erros bloqueantes na validação de importação
 * - Scopo: Apenas RH por enquanto
 * - Trigger: Ao clicar "Continuar" com erros na step 'validacao'
 * - Ações: "Encerrar importação" (reset) ou "Continuar assim mesmo" (prosseguir)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorConfirmationModal from '@/components/importacao/ErrorConfirmationModal';

describe('ErrorConfirmationModal', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('renderiza a modal com backdrop', () => {
      render(
        <ErrorConfirmationModal
          totalErros={3}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const backdrop = document.querySelector('div[role="dialog"]');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop).toHaveClass('bg-black/50');
    });

    it('exibe ícone de alerta', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const alertIcon = screen.getByRole('dialog').querySelector('svg');
      expect(alertIcon).toBeInTheDocument();
    });

    it('renderiza título com contagem singular (1 erro)', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText('1 erro encontrado na planilha')
      ).toBeInTheDocument();
    });

    it('renderiza título com contagem plural (múltiplos erros)', () => {
      render(
        <ErrorConfirmationModal
          totalErros={46}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText('46 erros encontrados na planilha')
      ).toBeInTheDocument();
    });

    it('exibe mensagem de aviso correto', () => {
      render(
        <ErrorConfirmationModal
          totalErros={5}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(
          /Os erros encontrados impedirão a importação das linhas com problemas/
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/As demais linhas serão processadas normalmente/)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Deseja continuar ou encerrar e corrigir a planilha\?/)
      ).toBeInTheDocument();
    });
  });

  describe('Botões', () => {
    it('renderiza botão "Encerrar importação"', () => {
      render(
        <ErrorConfirmationModal
          totalErros={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelBtn = screen.getByRole('button', {
        name: /Encerrar importação/i,
      });
      expect(cancelBtn).toBeInTheDocument();
      expect(cancelBtn).toHaveClass('bg-red-600');
    });

    it('renderiza botão "Continuar assim mesmo"', () => {
      render(
        <ErrorConfirmationModal
          totalErros={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', {
        name: /Continuar assim mesmo/i,
      });
      expect(confirmBtn).toBeInTheDocument();
      expect(confirmBtn).toHaveClass('bg-white');
    });
  });

  describe('Interações', () => {
    it('chama onCancel ao clicar "Encerrar importação"', () => {
      render(
        <ErrorConfirmationModal
          totalErros={3}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelBtn = screen.getByRole('button', {
        name: /Encerrar importação/i,
      });
      fireEvent.click(cancelBtn);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('chama onConfirm ao clicar "Continuar assim mesmo"', () => {
      render(
        <ErrorConfirmationModal
          totalErros={3}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', {
        name: /Continuar assim mesmo/i,
      });
      fireEvent.click(confirmBtn);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Acessibilidade', () => {
    it('define role="dialog" e aria-modal="true"', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('associa aria-labelledby ao título', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const title = screen.getByText('1 erro encontrado na planilha');
      expect(title).toHaveAttribute('id', 'error-modal-title');

      const modal = screen.getByRole('dialog');
      expect(modal).toHaveAttribute('aria-labelledby', 'error-modal-title');
    });
  });

  describe('Estilos e estados visuais', () => {
    it('botão "Encerrar" tem hover state com bg-red-700', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelBtn = screen.getByRole('button', {
        name: /Encerrar importação/i,
      });
      expect(cancelBtn).toHaveClass('hover:bg-red-700');
    });

    it('botão "Continuar" tem hover state com bg-gray-50', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', {
        name: /Continuar assim mesmo/i,
      });
      expect(confirmBtn).toHaveClass('hover:bg-gray-50');
    });

    it('modal tem z-50 para sobreposição', () => {
      render(
        <ErrorConfirmationModal
          totalErros={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const backdrop = screen.getByRole('dialog');
      expect(backdrop).toHaveClass('z-50');
    });
  });
});
