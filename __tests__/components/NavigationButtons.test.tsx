/**
 * @file __tests__/components/NavigationButtons.test.tsx
 * Testes para o componente NavigationButtons
 *
 * Valida:
 *  - Renderização dos botões anterior/próximo/salvar
 *  - Estados desabilitados
 *  - Indicador de posição
 *  - Callbacks
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationButtons from '@/components/NavigationButtons';

describe('NavigationButtons', () => {
  const defaultProps = {
    onPrevious: jest.fn(),
    onNext: jest.fn(),
    onSave: jest.fn(),
    hasPrevious: true,
    hasNext: true,
    isLastQuestion: false,
    isSaving: false,
    canProceed: true,
    currentQuestion: 3,
    totalQuestions: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar botão anterior', () => {
      render(<NavigationButtons {...defaultProps} />);
      expect(screen.getByText('Anterior')).toBeInTheDocument();
    });

    it('deve renderizar indicador de posição', () => {
      render(<NavigationButtons {...defaultProps} />);
      expect(screen.getByText('3 de 10')).toBeInTheDocument();
    });

    it('deve renderizar sem indicador quando totalQuestions é 0', () => {
      render(<NavigationButtons {...defaultProps} totalQuestions={0} />);
      expect(screen.queryByText(/de/)).not.toBeInTheDocument();
    });
  });

  describe('Estados', () => {
    it('deve desabilitar anterior quando hasPrevious é false', () => {
      render(<NavigationButtons {...defaultProps} hasPrevious={false} />);
      const botaoAnterior = screen.getByText('Anterior').closest('button');
      expect(botaoAnterior).toBeDisabled();
    });

    it('deve desabilitar botões durante salvamento (isSaving)', () => {
      render(<NavigationButtons {...defaultProps} isSaving={true} />);
      const botaoAnterior = screen.getByText('Anterior').closest('button');
      expect(botaoAnterior).toBeDisabled();
    });
  });

  describe('Interações', () => {
    it('deve chamar onPrevious ao clicar em Anterior', () => {
      render(<NavigationButtons {...defaultProps} />);
      fireEvent.click(screen.getByText('Anterior'));
      expect(defaultProps.onPrevious).toHaveBeenCalledTimes(1);
    });
  });
});
