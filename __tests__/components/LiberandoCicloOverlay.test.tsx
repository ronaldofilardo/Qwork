/**
 * @file __tests__/components/LiberandoCicloOverlay.test.tsx
 * Testes: LiberandoCicloOverlay
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { LiberandoCicloOverlay } from '@/components/LiberandoCicloOverlay';

describe('LiberandoCicloOverlay', () => {
  it('não renderiza quando visible=false', () => {
    const { container } = render(
      <LiberandoCicloOverlay visible={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renderiza overlay quando visible=true', () => {
    render(<LiberandoCicloOverlay visible={true} />);
    expect(
      screen.getByTestId('liberando-ciclo-overlay')
    ).toBeInTheDocument();
  });

  it('exibe texto de carregamento', () => {
    render(<LiberandoCicloOverlay visible={true} />);
    expect(screen.getByText('Liberando ciclo...')).toBeInTheDocument();
    expect(
      screen.getByText(/Calculando elegibilidade/i)
    ).toBeInTheDocument();
  });

  it('exibe nome da empresa quando fornecido', () => {
    render(
      <LiberandoCicloOverlay visible={true} empresaNome="Empresa Alfa Ltda" />
    );
    expect(screen.getByText('Empresa Alfa Ltda')).toBeInTheDocument();
  });

  it('não exibe nome quando empresaNome não é fornecido', () => {
    render(<LiberandoCicloOverlay visible={true} />);
    // Não deve ter elementos de texto inesperados além dos padrões
    expect(screen.queryByText('Empresa Alfa Ltda')).not.toBeInTheDocument();
  });

  it('tem atributos de acessibilidade corretos', () => {
    render(<LiberandoCicloOverlay visible={true} />);
    const overlay = screen.getByTestId('liberando-ciclo-overlay');
    expect(overlay).toHaveAttribute('role', 'status');
    expect(overlay).toHaveAttribute('aria-live', 'polite');
    expect(overlay).toHaveAttribute('aria-label', 'Liberando ciclo, aguarde');
  });

  it('tem classe de cobertura total da tela (fixed inset-0)', () => {
    render(<LiberandoCicloOverlay visible={true} />);
    const overlay = screen.getByTestId('liberando-ciclo-overlay');
    expect(overlay.className).toMatch(/fixed/);
    expect(overlay.className).toMatch(/inset-0/);
    expect(overlay.className).toMatch(/z-50/);
  });
});
