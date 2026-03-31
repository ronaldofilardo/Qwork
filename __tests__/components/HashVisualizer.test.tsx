/**
 * @file __tests__/components/HashVisualizer.test.tsx
 * Testes para o componente HashVisualizer
 *
 * Valida:
 *  - Renderização com hash
 *  - Renderização sem hash (indisponível)
 *  - Botão copiar
 *  - Modo compacto
 *  - Label opcional
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

import { HashVisualizer } from '@/components/HashVisualizer';

describe('HashVisualizer', () => {
  const hashValido =
    'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização com Hash', () => {
    it('deve exibir hash quando fornecido', () => {
      render(<HashVisualizer hash={hashValido} />);
      expect(screen.getByText(/a1b2c3/)).toBeInTheDocument();
    });

    it('deve exibir label por padrão', () => {
      render(<HashVisualizer hash={hashValido} />);
      expect(screen.getByText(/Hash/i)).toBeInTheDocument();
    });

    it('deve ocultar label quando exibirLabel=false', () => {
      render(<HashVisualizer hash={hashValido} exibirLabel={false} />);
      expect(screen.queryByText(/^Hash:$/)).not.toBeInTheDocument();
    });
  });

  describe('Renderização sem Hash', () => {
    it('deve exibir "Indisponível" quando hash é null', () => {
      render(<HashVisualizer hash={null} />);
      expect(screen.getByText(/Indisponível/i)).toBeInTheDocument();
    });

    it('deve exibir "Indisponível" quando hash é undefined', () => {
      render(<HashVisualizer hash={undefined} />);
      expect(screen.getByText(/Indisponível/i)).toBeInTheDocument();
    });

    it('deve exibir "Indisponível" quando hash é vazio', () => {
      render(<HashVisualizer hash="" />);
      expect(screen.getByText(/Indisponível/i)).toBeInTheDocument();
    });
  });

  describe('Copiar Hash', () => {
    it('deve ter botão/funcionalidade de copiar quando hash existe', () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn().mockResolvedValue(undefined),
        },
      });

      const { container } = render(<HashVisualizer hash={hashValido} />);
      // O componente deve ter algum elemento clicável para copiar
      expect(
        container.querySelector('[title], button, [role="button"]')
      ).toBeTruthy();
    });
  });

  describe('Modo Compacto', () => {
    it('deve renderizar em modo compacto', () => {
      render(<HashVisualizer hash={hashValido} compacto={true} />);
      // Em modo compacto, deve exibir hash truncado
      expect(screen.getByText(/a1b2c3/)).toBeInTheDocument();
    });
  });

  describe('ClassName Custom', () => {
    it('deve aplicar className personalizado', () => {
      const { container } = render(
        <HashVisualizer hash={hashValido} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
