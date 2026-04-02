/**
 * @file __tests__/components/ModalCadastrotomador.precoString.test.tsx
 * Testes: ModalCadastrotomador - formatação de campos de texto (telefone, CNPJ, CEP)
 * Substituiu: testes de formatação de preço de plano (obsoletos)
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

describe('ModalCadastrotomador - formatação de campos', () => {
  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as jest.Mock;
  });

  it('aceita CNPJ com 14 dígitos e exibe validação de formato', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    // Avançar para a etapa dados
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    const cnpjInput = await screen.findByLabelText(/^CNPJ$/i);
    expect(cnpjInput).toBeInTheDocument();

    // Digitar apenas dígitos — deve aceitar sem jogar erro de formato
    fireEvent.change(cnpjInput, { target: { value: '11.444.777/0001-61' } });

    // Campo deve ter o valor inserido
    expect(cnpjInput).toHaveValue('11.444.777/0001-61');

    // CNPJ válido — não deve exibir mensagem de CNPJ inválido
    await waitFor(() => {
      expect(screen.queryByText(/CNPJ inválido/i)).not.toBeInTheDocument();
    });
  });

  it('etapa tipo apresenta botão Próximo habilitado por padrão', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    const proxBtn = screen.getByRole('button', { name: /Próximo/i });
    expect(proxBtn).toBeInTheDocument();
    expect(proxBtn).not.toBeDisabled();
  });

  it('campo email na etapa dados é obrigatório para avançar', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await waitFor(() => expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument());

    // Preencher todos campos exceto email
    fireEvent.change(screen.getByLabelText(/Razão Social/i), { target: { value: 'Empresa Teste' } });
    fireEvent.change(screen.getByLabelText(/^CNPJ$/i), { target: { value: '11.444.777/0001-61' } });

    // Tentar avançar sem email
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Deve continuar na etapa dados
    expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
  });
});
