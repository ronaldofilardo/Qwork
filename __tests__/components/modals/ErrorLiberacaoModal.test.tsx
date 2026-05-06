import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorLiberacaoModal } from '@/components/modals/ErrorLiberacaoModal';

describe('ErrorLiberacaoModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={false}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render modal when isOpen is true', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    // Verifica title padrão
    expect(screen.getByText('Não foi possível criar o ciclo')).toBeInTheDocument();
    // Verifica mensagem
    expect(screen.getByText('Teste de erro')).toBeInTheDocument();
  });

  it('should render custom title when provided', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Erro customizado"
        title="Título Customizado"
      />
    );

    expect(screen.getByText('Título Customizado')).toBeInTheDocument();
  });

  it('should call onClose when Entendi button is clicked', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    const button = screen.getByText('Entendi');
    fireEvent.click(button);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when close button (X) is clicked', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    const closeButton = screen.getByLabelText('Fechar');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display multiline messages correctly', () => {
    const multilineMessage = 'Linha 1\nLinha 2\nLinha 3';
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem={multilineMessage}
      />
    );

    expect(screen.getByText(multilineMessage)).toBeInTheDocument();
  });

  it('should render AlertCircle icon', () => {
    const { container } = render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    // Lucide icons são renderizados com atributos data
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('should have correct styling for error button', () => {
    render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    const button = screen.getByText('Entendi') as HTMLButtonElement;
    expect(button).toHaveClass('bg-red-600', 'text-white');
  });

  it('should have correct z-index for modal', () => {
    const { container } = render(
      <ErrorLiberacaoModal
        isOpen={true}
        onClose={mockOnClose}
        mensagem="Teste de erro"
      />
    );

    const overlay = container.querySelector('.fixed.inset-0');
    expect(overlay).toHaveClass('z-[1001]');
  });
});
