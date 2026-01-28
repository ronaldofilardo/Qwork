import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastroContratante from '@/components/modals/ModalCadastroContratante';

// Mock planos fetch
beforeEach(() => {
  global.fetch = jest.fn((url) => {
    if (url === '/api/planos') {
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            planos: [
              {
                id: 1,
                nome: 'Plano Teste',
                descricao: 'Plano fixo',
                preco: 100,
                tipo: 'fixo',
                caracteristicas: { limite_funcionarios: 10, parcelas_max: 2 },
              },
            ],
          }),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }) as jest.Mock;
});

describe('ModalCadastroContratante - aceite do contrato habilita botão Próximo', () => {
  it('bloqueia Próximo na etapa contrato até aceitar os termos', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    const nextBtn = screen.getByRole('button', { name: /Próximo/i });

    // Avançar: Tipo -> Plano
    userEvent.click(nextBtn);

    // Selecionar plano
    expect(await screen.findByText('Plano Teste')).toBeInTheDocument();
    // selecionar o input oculto do plano diretamente
    const planoInput = document.querySelector('input[name="plano"]');
    expect(planoInput).toBeTruthy();
    userEvent.click(planoInput);
    userEvent.click(screen.getByRole('button', { name: /Próximo/i })); // para Dados

    // Preencher dados obrigatórios (etapa Dados)
    const razaoInput = await screen.findByLabelText(/Razão Social/i);
    fireEvent.change(razaoInput, {
      target: { value: 'Empresa X' },
    });
  });

  it('pressionar Enter no campo de quantidade não submete o formulário nem mostra erro de validação', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    const nextBtn = screen.getByRole('button', { name: /Próximo/i });

    // Avançar: Tipo -> Plano
    userEvent.click(nextBtn);

    // Selecionar plano
    expect(await screen.findByText('Plano Teste')).toBeInTheDocument();
    const planoInput = document.querySelector('input[name="plano"]');
    expect(planoInput).toBeTruthy();
    userEvent.click(planoInput);

    // O campo de quantidade deve estar visível
    const campoFuncionarios = await screen.findByRole('spinbutton');
    expect(campoFuncionarios).toBeInTheDocument();

    // Pressionar Enter dentro do campo (era o responsável por submeter o formulário)
    fireEvent.keyDown(campoFuncionarios, {
      key: 'Enter',
      code: 'Enter',
      charCode: 13,
    });

    // Verificar que o formulário não avançou para a etapa de Dados e não exibiu erro
    expect(screen.queryByText(/Razão Social/i)).not.toBeInTheDocument();
    expect(
      screen.getByText('Quantidade de funcionários ativos')
    ).toBeInTheDocument();
  });

  it('deve permitir preencher todos os dados e aceitar contrato', async () => {
    render(<ModalCadastroContratante isOpen={true} onClose={() => {}} />);

    const nextBtn = screen.getByRole('button', { name: /Próximo/i });

    // Avançar: Tipo -> Plano
    userEvent.click(nextBtn);

    // Selecionar plano
    expect(
      await screen.findByText('Plano Teste', {}, { timeout: 15000 })
    ).toBeInTheDocument();
    const planoInput = document.querySelector('input[name="plano"]');
    expect(planoInput).toBeTruthy();
    userEvent.click(planoInput);
    userEvent.click(screen.getByRole('button', { name: /Próximo/i })); // para Dados

    // Preencher dados obrigatórios (etapa Dados)
    const razaoInput = await screen.findByLabelText(/Razão Social/i);
    fireEvent.change(razaoInput, {
      target: { value: 'Empresa X' },
    });
    const cnpjInput = await screen.findByLabelText(/^CNPJ$/i);
    fireEvent.change(cnpjInput, {
      target: { value: '11.222.333/0001-81' },
    });
    fireEvent.change(screen.getByLabelText(/^Email/i), {
      target: { value: 'a@b.com' },
    });
    fireEvent.change(screen.getByLabelText(/Telefone/i), {
      target: { value: '(11) 91234-5678' },
    });
    fireEvent.change(screen.getByLabelText(/Endereço/i), {
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

    // Attach required files
    const cartaoInput = screen.getByLabelText(/Cartão CNPJ/i);
    const contratoInput = screen.getByLabelText(/Contrato Social/i);

    const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
    Object.defineProperty(cartaoInput, 'files', { value: [file] });
    Object.defineProperty(contratoInput, 'files', { value: [file] });
    fireEvent.change(cartaoInput);
    fireEvent.change(contratoInput);

    // Próximo -> Responsável
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));
    // garantir que avançou
    expect(
      await screen.findByText(/Dados do Responsável/i)
    ).toBeInTheDocument();

    // Preencher responsável e anexar doc
    fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
      target: { value: 'João' },
    });
    fireEvent.change(screen.getByLabelText(/CPF/i), {
      target: { value: '123.456.789-09' },
    });
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'joao@ex.com' },
    });
    fireEvent.change(screen.getByLabelText(/Celular/i), {
      target: { value: '(11) 91234-0000' },
    });

    const docInput = screen.getByLabelText(/Documento de Identificação/i);
    Object.defineProperty(docInput, 'files', { value: [file] });
    fireEvent.change(docInput);

    // Próximo -> Contrato
    userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Estamos na etapa contrato - botão Próximo deve estar desabilitado
    const nextOnContract = screen.getByRole('button', { name: /Próximo/i });
    await waitFor(() => expect(nextOnContract).toBeDisabled());

    // Aceitar contrato
    const checkbox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    userEvent.click(checkbox);

    await waitFor(() => expect(nextOnContract).not.toBeDisabled());

    // Agora avançar para confirmação
    userEvent.click(nextOnContract);

    expect(
      await screen.findByRole('button', { name: /Confirmar e Enviar/i })
    ).toBeInTheDocument();
  });
});
