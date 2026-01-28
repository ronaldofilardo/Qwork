import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmpresaHeader } from '@/components/rh/EmpresaHeader';

describe('EmpresaHeader', () => {
  const mockOnVoltar = jest.fn();
  const mockOnSair = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar o nome da empresa', () => {
    render(
      <EmpresaHeader
        empresaNome="Empresa Teste"
        onVoltar={mockOnVoltar}
        onSair={mockOnSair}
      />
    );

    expect(screen.getByText('Dashboard Empresa Teste')).toBeInTheDocument();
  });

  it('deve chamar onVoltar quando botão Voltar é clicado', () => {
    render(
      <EmpresaHeader
        empresaNome="Empresa Teste"
        onVoltar={mockOnVoltar}
        onSair={mockOnSair}
      />
    );

    const botaoVoltar = screen.getByText('← Voltar');
    fireEvent.click(botaoVoltar);

    expect(mockOnVoltar).toHaveBeenCalledTimes(1);
  });

  it('deve chamar onSair quando botão Sair é clicado', () => {
    render(
      <EmpresaHeader
        empresaNome="Empresa Teste"
        onVoltar={mockOnVoltar}
        onSair={mockOnSair}
      />
    );

    const botaoSair = screen.getByText('Sair');
    fireEvent.click(botaoSair);

    expect(mockOnSair).toHaveBeenCalledTimes(1);
  });

  it('deve exibir subtítulo correto', () => {
    render(
      <EmpresaHeader
        empresaNome="Empresa Teste"
        onVoltar={mockOnVoltar}
        onSair={mockOnSair}
      />
    );

    expect(
      screen.getByText('Análise das avaliações psicossociais')
    ).toBeInTheDocument();
  });

  it('deve usar fallback quando empresaNome não é fornecido', () => {
    render(
      <EmpresaHeader
        empresaNome=""
        onVoltar={mockOnVoltar}
        onSair={mockOnSair}
      />
    );

    expect(screen.getByText('Dashboard Empresa')).toBeInTheDocument();
  });
});
