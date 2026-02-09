import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalDefinirValorPersonalizado from '@/components/modals/ModalDefinirValorPersonalizado';

describe('ModalDefinirValorPersonalizado', () => {
  const mockOnConfirm = jest.fn();
  const mockOnClose = jest.fn();

  const tomadorMock = {
    id: 1,
    tipo: 'entidade' as const,
    nome: 'Empresa Teste Ltda',
    numero_funcionarios_estimado: 50,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('não deve renderizar quando isOpen é false', () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={false}
        onClose={mockOnClose}
        tomador={null}
        onConfirm={mockOnConfirm}
      />
    );

    expect(
      screen.queryByText('Definir Valor Personalizado')
    ).not.toBeInTheDocument();
  });

  it('deve renderizar corretamente quando aberto', () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Definir Valor Personalizado')).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste Ltda')).toBeInTheDocument();
    expect(screen.getByText('Funcionários estimados:')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText(/Valor por funcionário/i)).toBeInTheDocument();
  });

  it('deve calcular e exibir valor total corretamente', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('0,00');
    fireEvent.change(input, { target: { value: '25.50' } });

    await waitFor(() => {
      expect(screen.getByText('Valor unitário:')).toBeInTheDocument();
      expect(screen.getByText('R$ 25,50')).toBeInTheDocument();
      expect(screen.getByText('Valor total anual:')).toBeInTheDocument();
      expect(screen.getByText('R$ 1.275,00')).toBeInTheDocument();
    });
  });

  it('deve validar valor obrigatório', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const submitButton = screen.getByText('Definir Valor');
    fireEvent.click(submitButton);

    // Não deve chamar onConfirm sem valor
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('deve validar valor zero', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('0,00');
    const submitButton = screen.getByText('Definir Valor');

    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(submitButton);

    // Não deve chamar onConfirm com valor zero
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('deve validar valor muito alto', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('0,00');
    const submitButton = screen.getByText('Definir Valor');

    fireEvent.change(input, { target: { value: '15000' } });
    fireEvent.click(submitButton);

    // Não deve chamar onConfirm com valor muito alto
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('deve chamar onConfirm com valor correto', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('0,00');
    const submitButton = screen.getByText('Definir Valor');

    fireEvent.change(input, { target: { value: '35.75' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // agora espera o numero de funcionarios estimado (50) ser usado quando o campo é deixado vazio
      expect(mockOnConfirm).toHaveBeenCalledWith(35.75, 50);
    });
  });

  it('deve chamar onClose ao clicar em Cancelar', () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('deve desabilitar botões quando loading', () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
        loading={true}
      />
    );

    const cancelButton = screen.getByText('Cancelar');
    const submitButton = screen.getByText('Processando...');

    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('deve formatar valores corretamente', async () => {
    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadorMock}
        onConfirm={mockOnConfirm}
      />
    );

    const input = screen.getByPlaceholderText('0,00');

    // Testar entrada com ponto decimal
    fireEvent.change(input, { target: { value: '123.45' } });

    await waitFor(() => {
      expect(screen.getByText('Valor unitário:')).toBeInTheDocument();
      const valorElement = screen.getByText(/R\$ 123,45/);
      expect(valorElement).toBeInTheDocument();
    });
  });

  it('deve lidar com tomador sem numero_funcionarios_estimado (campo obrigatório)', async () => {
    const tomadoresemEstimativa = {
      ...tomadorMock,
      numero_funcionarios_estimado: undefined,
    };

    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadoresemEstimativa}
        onConfirm={mockOnConfirm}
      />
    );

    // Mostra o resumo com 1 por padrão até que usuário informe
    expect(screen.getByText('Funcionários estimados:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();

    // Ao submeter com número inválido (0), deve mostrar erro e não chamar onConfirm
    const submitButton = screen.getByText('Definir Valor');
    // Preencher valor válido e número inválido (0)
    const valorInput = screen.getByPlaceholderText('0,00');
    const numeroInput = screen.getByPlaceholderText('Ex: 50');

    fireEvent.change(valorInput, { target: { value: '10' } });
    fireEvent.change(numeroInput, { target: { value: '0' } });

    fireEvent.click(submitButton);

    expect(mockOnConfirm).not.toHaveBeenCalled();

    // O input deve ter atributo required e orientação ao usuário
    expect(numeroInput).toHaveAttribute('required');
    expect(
      screen.getByText(
        /Informe o número de funcionários para cálculo do valor total/i
      )
    ).toBeInTheDocument();
  });

  it('deve aceitar numero de funcionarios informado explicitamente quando estimativa ausente', async () => {
    const tomadoresemEstimativa = {
      ...tomadorMock,
      numero_funcionarios_estimado: undefined,
    };

    render(
      <ModalDefinirValorPersonalizado
        isOpen={true}
        onClose={mockOnClose}
        tomador={tomadoresemEstimativa}
        onConfirm={mockOnConfirm}
      />
    );

    const valorInput = screen.getByPlaceholderText('0,00');
    const numeroInput = screen.getByPlaceholderText('Ex: 50');

    fireEvent.change(valorInput, { target: { value: '10' } });
    fireEvent.change(numeroInput, { target: { value: '3' } });

    const submitButton = screen.getByText('Definir Valor');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(10, 3);
    });
  });
});
