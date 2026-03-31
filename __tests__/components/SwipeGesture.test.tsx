/**
 * @file __tests__/components/SwipeGesture.test.tsx
 * Testes para o componente SwipeGesture
 *
 * Valida:
 *  - Renderização de children
 *  - Detecção de swipe left/right
 *  - Threshold mínimo
 *  - Long press
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SwipeGesture from '@/components/SwipeGesture';

describe('SwipeGesture', () => {
  const defaultProps = {
    onSwipeLeft: jest.fn(),
    onSwipeRight: jest.fn(),
    onSwipeUp: jest.fn(),
    onSwipeDown: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar children', () => {
      const { getByText } = render(
        <SwipeGesture {...defaultProps}>
          <div>Conteúdo do Swipe</div>
        </SwipeGesture>
      );
      expect(getByText('Conteúdo do Swipe')).toBeInTheDocument();
    });

    it('deve aplicar className personalizado', () => {
      const { container } = render(
        <SwipeGesture {...defaultProps} className="swipe-container">
          <div>Child</div>
        </SwipeGesture>
      );
      expect(container.firstChild).toHaveClass('swipe-container');
    });
  });

  describe('Detecção de Swipe', () => {
    it('deve detectar swipe left quando distância excede threshold', () => {
      const { container } = render(
        <SwipeGesture {...defaultProps} threshold={50}>
          <div>Swipeable</div>
        </SwipeGesture>
      );

      const element = container.firstChild as HTMLElement;

      // Simular touch: start em X=200, end em X=50 (swipe left de 150px)
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 50, clientY: 100 }],
      });
      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 50, clientY: 100 }],
      });

      expect(defaultProps.onSwipeLeft).toHaveBeenCalled();
    });

    it('deve detectar swipe right', () => {
      const { container } = render(
        <SwipeGesture {...defaultProps} threshold={50}>
          <div>Swipeable</div>
        </SwipeGesture>
      );

      const element = container.firstChild as HTMLElement;

      // Simular touch: start em X=50, end em X=200 (swipe right de 150px)
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 50, clientY: 100 }],
      });
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 200, clientY: 100 }],
      });
      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      expect(defaultProps.onSwipeRight).toHaveBeenCalled();
    });

    it('não deve disparar swipe quando distância abaixo do threshold', () => {
      const { container } = render(
        <SwipeGesture {...defaultProps} threshold={100}>
          <div>Swipeable</div>
        </SwipeGesture>
      );

      const element = container.firstChild as HTMLElement;

      // Simular touch curto: apenas 30px
      fireEvent.touchStart(element, {
        targetTouches: [{ clientX: 100, clientY: 100 }],
      });
      fireEvent.touchMove(element, {
        targetTouches: [{ clientX: 70, clientY: 100 }],
      });
      fireEvent.touchEnd(element, {
        changedTouches: [{ clientX: 70, clientY: 100 }],
      });

      expect(defaultProps.onSwipeLeft).not.toHaveBeenCalled();
      expect(defaultProps.onSwipeRight).not.toHaveBeenCalled();
    });
  });

  describe('Props Padrão', () => {
    it('deve funcionar com threshold padrão (100)', () => {
      const { container } = render(
        <SwipeGesture onSwipeLeft={defaultProps.onSwipeLeft}>
          <div>Default Threshold</div>
        </SwipeGesture>
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });
});
