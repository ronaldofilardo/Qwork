/**
 * Testes de UI para ModalCadastroEmissor
 * Valida comportamento do modal de criação de emissores
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ModalCadastroEmissor } from '@/components/modals/ModalCadastroEmissor';

// Mock do validarCPF e validarEmail
jest.mock('@/lib/validators', () => ({
  validarCPF: jest.fn((cpf: string) => {
    // Validação simplificada para testes
    return cpf.length === 11 && cpf !== '12345678901';
  }),
  validarEmail: jest.fn((email: string) => {
    return email.includes('@') && email.includes('.');
  }),
}));

// Mock do fetch global
global.fetch = jest.fn();

describe('ModalCadastroEmissor', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  it('não deve renderizar quando isOpen é false', () => {
    render(
      <ModalCadastroEmissor
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(
      screen.queryByText('Novo Emissor Independente')
    ).not.toBeInTheDocument();
  });

  it('deve renderizar modal quando isOpen é true', () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('Novo Emissor Independente')).toBeInTheDocument();
    expect(screen.getByLabelText(/CPF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
  });

  it('deve exibir informação sobre emissor independente', () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/Emissor Independente:/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Não vinculado a nenhuma clínica específica/i)
    ).toBeInTheDocument();
  });

  it('deve validar campos obrigatórios', async () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Todos os campos são obrigatórios')
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve validar CPF com 11 dígitos', async () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '123456' } }); // Menos de 11
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('CPF deve ter 11 dígitos')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve validar CPF inválido', async () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '12345678901' } }); // CPF inválido
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('CPF inválido')).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve validar email inválido', async () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '11122233344' } });
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'email-invalido' } }); // Sem @

    // Garantir que inputs foram atualizados antes de submeter
    await waitFor(() => {
      expect(cpfInput.value).toBe('11122233344');
      expect(nomeInput.value).toBe('Emissor Teste');
      expect(emailInput.value).toBe('email-invalido');
    });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  it('deve submeter formulário com dados válidos', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        emissor: {
          cpf: '11122233344',
          nome: 'Emissor Teste',
          email: 'emissor@teste.com',
          clinica_id: null,
          senha: '123456',
        },
      }),
    });

    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '11122233344' } });
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/admin/emissores/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cpf: '11122233344',
            nome: 'Emissor Teste',
            email: 'emissor@teste.com',
          }),
        })
      );
    });
  });

  it('deve exibir senha temporária após criação', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        emissor: {
          cpf: '11122233344',
          nome: 'Emissor Teste',
          email: 'emissor@teste.com',
          clinica_id: null,
          senha: '123456',
        },
      }),
    });

    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '11122233344' } });
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Emissor criado com sucesso!')
      ).toBeInTheDocument();
      expect(screen.getByText(/123456/)).toBeInTheDocument();
    });
  });

  it('deve exibir erro quando API retorna erro', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'CPF já cadastrado',
      }),
    });

    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '11122233344' } });
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('CPF já cadastrado')).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('deve exibir mensagem clara quando API retornar MFA_REQUIRED', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: 'MFA_REQUIRED',
        message: 'Autenticação de dois fatores requerida',
      }),
    });

    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const emailInput = screen.getByLabelText(/Email/i);

    fireEvent.change(cpfInput, { target: { value: '11122233344' } });
    fireEvent.change(nomeInput, { target: { value: 'Emissor Teste' } });
    fireEvent.change(emailInput, { target: { value: 'emissor@teste.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Emissor/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Autenticação de dois fatores requerida')
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('deve fechar modal ao clicar em fechar', () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const closeButton = screen.getByRole('button', { name: /Cancelar/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve limpar formulário ao fechar e reabrir', () => {
    const { rerender } = render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    fireEvent.change(cpfInput, { target: { value: '11122233344' } });

    expect(cpfInput.value).toBe('11122233344');

    // Fechar modal
    rerender(
      <ModalCadastroEmissor
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    // Reabrir modal
    rerender(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInputReopened = screen.getByLabelText(/CPF/i);
    expect(cpfInputReopened.value).toBe('');
  });

  it('deve remover caracteres não numéricos do CPF', () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);

    fireEvent.change(cpfInput, { target: { value: '111.222.333-44' } });

    expect(cpfInput.value).toBe('11122233344'); // Sem pontos e traços
  });

  it('deve limitar CPF a 11 dígitos', () => {
    render(
      <ModalCadastroEmissor
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);

    fireEvent.change(cpfInput, { target: { value: '123456789012345' } });

    expect(cpfInput.value).toBe('12345678901'); // Máximo 11
  });
});
