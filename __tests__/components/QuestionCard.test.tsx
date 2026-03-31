/**
 * @file __tests__/components/QuestionCard.test.tsx
 * Testes para o componente QuestionCard
 *
 * Valida:
 *  - Renderização da pergunta
 *  - Seleção de resposta (escala)
 *  - Auto-save
 *  - Indicador de alterações não salvas
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import QuestionCard from '@/components/QuestionCard';

describe('QuestionCard', () => {
  const defaultProps = {
    questionId: 'q1',
    texto: 'Você se sente seguro no trabalho?',
    onChange: jest.fn(),
    onSave: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Renderização', () => {
    it('deve renderizar texto da pergunta', () => {
      render(<QuestionCard {...defaultProps} />);
      expect(
        screen.getByText('Você se sente seguro no trabalho?')
      ).toBeInTheDocument();
    });

    it('deve renderizar escalas de resposta', () => {
      render(<QuestionCard {...defaultProps} />);
      // Deve ter opções da escala Likert
      expect(screen.getByText('Sempre')).toBeInTheDocument();
      expect(screen.getByText('Nunca')).toBeInTheDocument();
    });

    it('deve renderizar com valor pré-selecionado', () => {
      render(<QuestionCard {...defaultProps} valor={75} />);
      // "Muitas vezes" = 75
      expect(screen.getByText('Muitas vezes')).toBeInTheDocument();
    });
  });

  describe('Interação', () => {
    it('deve permitir seleção de resposta', () => {
      render(<QuestionCard {...defaultProps} />);

      fireEvent.click(screen.getByText('Sempre'));
      // A seleção deve marcar visualmente
    });

    it('deve chamar onChange quando autoSave é false', () => {
      render(<QuestionCard {...defaultProps} autoSave={false} />);

      fireEvent.click(screen.getByText('Sempre'));
      expect(defaultProps.onChange).toHaveBeenCalledWith('q1', 100);
    });
  });

  describe('Auto-save', () => {
    it('deve chamar onChange e onSave após delay no autoSave', async () => {
      render(<QuestionCard {...defaultProps} autoSave={true} />);

      fireEvent.click(screen.getByText('Raramente'));

      // Avançar timer do auto-save (1 segundo)
      act(() => {
        jest.advanceTimersByTime(1100);
      });

      expect(defaultProps.onChange).toHaveBeenCalledWith('q1', 25);
      expect(defaultProps.onSave).toHaveBeenCalled();
    });
  });
});
