import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalAdicionarFuncionarioEntidade from '@/components/funcionarios/ModalAdicionarFuncionarioEntidade';

describe('ModalAdicionarFuncionarioEntidade', () => {
  it('renders and submits with data_nascimento included', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as any)
    );

    render(
      <ModalAdicionarFuncionarioEntidade
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    const cpfInput = screen.getByLabelText(/CPF/i);
    const nomeInput = screen.getByLabelText(/Nome Completo/i);
    const nascInput = screen.getByLabelText(/Data de Nascimento/i);
    const setorInput = screen.getByLabelText(/Setor/i);
    const funcaoInput = screen.getByLabelText(/Função/i);
    const emailInput = screen.getByLabelText(/Email/i);
    const senhaInput = screen.getByLabelText(/Senha/i);

    fireEvent.change(cpfInput, { target: { value: '12345678909' } });
    fireEvent.change(nomeInput, { target: { value: 'Teste' } });
    fireEvent.change(nascInput, { target: { value: '1980-05-10' } });
    fireEvent.change(setorInput, { target: { value: 'TI' } });
    fireEvent.change(funcaoInput, { target: { value: 'Dev' } });
    fireEvent.change(emailInput, { target: { value: 'a@b.com' } });
    fireEvent.change(senhaInput, { target: { value: 'abcdef' } });

    const addBtn = screen.getByRole('button', {
      name: /Adicionar Funcionário/i,
    });
    fireEvent.click(addBtn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.data_nascimento).toBe('1980-05-10');
  });
});
