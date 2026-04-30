/**
 * Testes para o componente NivelCargoWarningModal
 * Modal de aviso (não bloqueante) exibido quando há funcionários sem nível de cargo
 * na planilha durante importação em massa (RH e Entidade).
 *
 * Comportamento esperado:
 * - Aparece quando validateData.avisos contém entradas com campo='nivel_cargo'
 * - Bloqueia a importação até o usuário decidir: classificar ou cancelar
 * - Exibe contagem correta (singular/plural)
 * - Callbacks onCancel e onConfirm são chamados corretamente
 */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NivelCargoWarningModal from '@/components/importacao/NivelCargoWarningModal';

describe('NivelCargoWarningModal', () => {
  const mockOnCancel = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Renderização
  // -------------------------------------------------------------------------
  describe('Renderização', () => {
    it('renderiza o modal com backdrop e role dialog', () => {
      render(
        <NivelCargoWarningModal
          count={3}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const dialog = document.querySelector('div[role="dialog"]');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveClass('bg-black/50');
    });

    it('exibe ícone de info (representado por SVG)', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const icon = document.querySelector('div[role="dialog"] svg');
      expect(icon).toBeInTheDocument();
    });

    it('renderiza título no plural para count > 1', () => {
      render(
        <NivelCargoWarningModal
          count={5}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText('5 funcionários sem nível de cargo')
      ).toBeInTheDocument();
    });

    it('renderiza título no singular para count = 1', () => {
      render(
        <NivelCargoWarningModal
          count={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText('1 funcionário sem nível de cargo')
      ).toBeInTheDocument();
    });

    it('exibe mensagem no plural para count > 1', () => {
      render(
        <NivelCargoWarningModal
          count={3}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/funcionários estão.*campo em branco na planilha/i)
      ).toBeInTheDocument();
    });

    it('exibe mensagem no singular para count = 1', () => {
      render(
        <NivelCargoWarningModal
          count={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/um funcionário está.*campo em branco na planilha/i)
      ).toBeInTheDocument();
    });

    it('exibe o texto sobre classificação manual no próximo passo', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText('gestao')
      ).toBeInTheDocument();
      expect(
        screen.getByText('operacional')
      ).toBeInTheDocument();
    });

    it('exibe pergunta de continuar ou voltar', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByText(/reenvie o arquivo preenchido/i)
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Botões
  // -------------------------------------------------------------------------
  describe('Botões', () => {
    it('renderiza botão "Voltar"', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByRole('button', { name: /cancelar importação/i })).toBeInTheDocument();
    });

    it('renderiza botão "Continuar assim mesmo"', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(
        screen.getByRole('button', { name: /continuar e classificar/i })
      ).toBeInTheDocument();
    });

    it('chama onCancel ao clicar em "Voltar"', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancelar importação/i }));
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('chama onConfirm ao clicar em "Continuar assim mesmo"', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      fireEvent.click(
        screen.getByRole('button', { name: /continuar e classificar/i })
      );
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('não chama callbacks antes de qualquer interação', () => {
      render(
        <NivelCargoWarningModal
          count={1}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      expect(mockOnCancel).not.toHaveBeenCalled();
      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // Acessibilidade
  // -------------------------------------------------------------------------
  describe('Acessibilidade', () => {
    it('tem aria-modal="true"', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('tem aria-labelledby apontando para o título', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const dialog = document.querySelector('[role="dialog"]');
      const labelledById = dialog?.getAttribute('aria-labelledby');
      expect(labelledById).toBeTruthy();

      const titleEl = document.getElementById(labelledById!);
      expect(titleEl).toBeInTheDocument();
      expect(titleEl?.textContent).toMatch(/sem nível de cargo/i);
    });
  });

  // -------------------------------------------------------------------------
  // Estilo visual
  // -------------------------------------------------------------------------
  describe('Estilo visual', () => {
    it('botão "Continuar assim mesmo" tem cor âmbar (bg-amber-600)', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const confirmBtn = screen.getByRole('button', {
        name: /continuar e classificar/i,
      });
      expect(confirmBtn).toHaveClass('bg-amber-600');
    });

    it('botão "Voltar" tem estilo secundário (border-gray)', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelBtn = screen.getByRole('button', { name: /cancelar importação/i });
      expect(cancelBtn).toHaveClass('border-gray-300');
    });

    it('ícone de info tem cor âmbar (text-amber-600)', () => {
      render(
        <NivelCargoWarningModal
          count={2}
          onCancel={mockOnCancel}
          onConfirm={mockOnConfirm}
        />
      );

      const iconContainer = document.querySelector('.bg-amber-100');
      expect(iconContainer).toBeInTheDocument();
      const icon = iconContainer?.querySelector('svg');
      expect(icon).toHaveClass('text-amber-600');
    });
  });
});
