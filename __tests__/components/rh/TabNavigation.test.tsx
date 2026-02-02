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
        anomaliasCount={0}
      />
    );

    expect(
      screen.getByText('📋 Ciclos de Coletas Avaliativas')
    ).toBeInTheDocument();
    expect(screen.getByText('👥 Funcionários Ativos')).toBeInTheDocument();
    expect(screen.getByText('⚠️ Pendências')).toBeInTheDocument();
    expect(screen.getByText('🚪 Desligamentos')).toBeInTheDocument();
  });

  it('deve destacar a aba ativa', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
        anomaliasCount={0}
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
        anomaliasCount={0}
      />
    );

    const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
    fireEvent.click(abaFuncionarios);

    expect(mockOnTabChange).toHaveBeenCalledWith('funcionarios');
  });

  it('deve exibir badge de anomalias quando houver pendências', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
        anomaliasCount={5}
      />
    );

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-red-500', 'text-white');
  });

  it('não deve exibir badge quando não houver anomalias', () => {
    render(
      <TabNavigation
        activeTab="lotes"
        onTabChange={mockOnTabChange}
        anomaliasCount={0}
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
        anomaliasCount={0}
      />
    );

    const abas = [
      { texto: '👥 Funcionários Ativos', id: 'funcionarios' },
      { texto: '⚠️ Pendências', id: 'pendencias' },
      { texto: '🚪 Desligamentos', id: 'desligamentos' },
    ];

    abas.forEach(({ texto, id }) => {
      fireEvent.click(screen.getByText(texto));
      expect(mockOnTabChange).toHaveBeenCalledWith(id);

      // Simular mudança de aba
      rerender(
        <TabNavigation
          activeTab={id as any}
          onTabChange={mockOnTabChange}
          anomaliasCount={0}
        />
      );
    });
  });
});
