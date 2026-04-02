/**
 * @file __tests__/components/ModalCadastrotomador.test.tsx
 * Testes: ModalCadastrotomador - validações de campos e navegação entre etapas
 * Fluxo atual: tipo → dados → responsavel → confirmacao (sem etapa de plano)
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

describe('ModalCadastrotomador - validações de campos', () => {
  jest.setTimeout(15000);

  beforeEach(() => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    ) as jest.Mock;
  });

  it('exibe aviso de CNPJ inválido ao digitar CNPJ incorreto', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    // Avançar da etapa tipo para dados
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Aguardar campo CNPJ aparecer
    const cnpjInput = await screen.findByLabelText(/^CNPJ$/i);
    expect(cnpjInput).toBeInTheDocument();

    // Digitar CNPJ inválido (14 dígitos, mas dígitos verificadores errados)
    fireEvent.change(cnpjInput, { target: { value: '11.222.333/0001-00' } });

    await waitFor(() => {
      expect(screen.getByText(/CNPJ inválido/i)).toBeInTheDocument();
    });
  });

  it('não avança para a etapa responsavel se campos obrigatórios estiverem vazios', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    // Avançar para dados
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument()
    );

    // Tentar avançar com campos em branco
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Deve continuar na etapa dados (campo "Razão Social" ainda presente)
    expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome Completo/i)).not.toBeInTheDocument();
  });

  it('avança para etapa responsavel após preencher dados válidos', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    // Avançar para dados
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    await waitFor(() =>
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument()
    );

    // Preencher dados válidos
    fireEvent.change(screen.getByLabelText(/Razão Social/i), {
      target: { value: 'Empresa Teste' },
    });
    fireEvent.change(screen.getByLabelText(/^CNPJ$/i), {
      target: { value: '11.444.777/0001-61' },
    });
    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: 'teste@empresa.com' },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: '(11) 91234-5678' },
    });
    fireEvent.change(screen.getByLabelText(/Endere.o/i), {
      target: { value: 'Rua Teste, 1' },
    });
    fireEvent.change(screen.getByLabelText(/Cidade/i), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByLabelText(/Estado/i), {
      target: { value: 'SP' },
    });
    fireEvent.change(screen.getByLabelText(/CEP/i), {
      target: { value: '01234-567' },
    });

    const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    const cartaoInput = screen.getByLabelText(/Cart.o CNPJ/i);
    const contratoInput = screen.getByLabelText(/Contrato Social/i);
    Object.defineProperty(cartaoInput, 'files', { value: [file] });
    Object.defineProperty(contratoInput, 'files', { value: [file] });
    fireEvent.change(cartaoInput);
    fireEvent.change(contratoInput);

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Deve ter avançado para responsavel
    await waitFor(() => {
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
    });
  });

  it('selecionar tipo "clinica" muda label do responsável para "Gestor"', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);

    // Selecionar clinica no primeiro step
    const clinicaOption = screen.getByTestId('tipo-clinica');
    fireEvent.click(clinicaOption.querySelector('input') as HTMLElement);

    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
    });
  });
});
