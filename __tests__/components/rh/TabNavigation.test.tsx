/**
 * @file __tests__/components/rh/TabNavigation.test.tsx
 * Testes: TabNavigation
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TabNavigation } from '@/components/rh/TabNavigation';

describe('TabNavigation', () => {
  const mockOnTabChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar todas as abas', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
      />
    );

    expect(
      screen.getByText('📋 Ciclos de Coletas Avaliativas')
    ).toBeInTheDocument();
    expect(screen.getByText('👥 Funcionários')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Pendências')).toBeInTheDocument();
    expect(screen.queryByText('🚪 Desligamentos')).not.toBeInTheDocument();
  });

  it('deve destacar a aba ativa', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
      />
    );

    const abaLotes = screen
      .getByText('📋 Ciclos de Coletas Avaliativas')
      .closest('button');
    expect(abaLotes).toHaveClass('border-primary', 'text-primary');
  });

  it('deve chamar onTabChange ao clicar em aba', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
      />
    );

    const abaFuncionarios = screen.getByText('👥 Funcionários');
    fireEvent.click(abaFuncionarios);

    expect(mockOnTabChange).toHaveBeenCalledWith('funcionarios');
  });

  it('não deve exibir badge na aba de pendências', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
      />
    );

    const badges = screen.queryAllByText(/^\d+$/);
    expect(badges.length).toBe(0);
  });

  it('deve permitir navegação por todas as abas', () => {
    const { rerender } = render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
      />
    );

    const abas = [
      { texto: '👥 Funcionários', id: 'funcionarios' },
      { texto: '⚠️ Pendências', id: 'pendencias' },
    ];

    abas.forEach(({ texto, id }) => {
      fireEvent.click(screen.getByText(texto));
      expect(mockOnTabChange).toHaveBeenCalledWith(id);

      rerender(
        <TabNavigation
          activeTab={id as any}
          onTabChange={mockOnTabChange}
        />
      );
    });
  });
});

