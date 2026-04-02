/**
 * @file __tests__/components/ModalCadastrotomador.contractAcceptance.test.tsx
 * Testes: ModalCadastrotomador - botão "Confirmar e Enviar" requer confirmação de revisão na etapa de confirmação
 * Fluxo atual: tipo → dados → responsavel → confirmacao (sem etapa de plano)
 */

import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
  ) as jest.Mock;
});

const DADOS_EMPRESA = {
  nome: 'Empresa Teste Ltda',
  cnpj: '11.222.333/0001-81',
  email: 'empresa@teste.com',
  telefone: '(11) 91234-5678',
  endereco: 'Rua Teste, 100',
  cidade: 'São Paulo',
  estado: 'SP',
  cep: '01234-567',
};

const DADOS_RESPONSAVEL = {
  nome: 'João Silva',
  cpf: '123.456.789-09',
  cargo: 'Gestor',
  email: 'joao@teste.com',
  celular: '(11) 91234-0000',
};

async function preencherDadosEmpresa() {
  fireEvent.change(screen.getByLabelText(/Razão Social/i), {
    target: { value: DADOS_EMPRESA.nome },
  });
  fireEvent.change(screen.getByLabelText(/^CNPJ$/i), {
    target: { value: DADOS_EMPRESA.cnpj },
  });
  fireEvent.change(screen.getByLabelText(/^Email/i), {
    target: { value: DADOS_EMPRESA.email },
  });
  fireEvent.change(screen.getByLabelText(/Telefone/i), {
    target: { value: DADOS_EMPRESA.telefone },
  });
  fireEvent.change(screen.getByLabelText(/Endere.o/i), {
    target: { value: DADOS_EMPRESA.endereco },
  });
  fireEvent.change(screen.getByLabelText(/Cidade/i), {
    target: { value: DADOS_EMPRESA.cidade },
  });
  fireEvent.change(screen.getByLabelText(/Estado/i), {
    target: { value: DADOS_EMPRESA.estado },
  });
  fireEvent.change(screen.getByLabelText(/CEP/i), {
    target: { value: DADOS_EMPRESA.cep },
  });

  const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
  const cartaoInput = screen.getByLabelText(/Cart.o CNPJ/i);
  const contratoInput = screen.getByLabelText(/Contrato Social/i);
  Object.defineProperty(cartaoInput, 'files', { value: [file] });
  Object.defineProperty(contratoInput, 'files', { value: [file] });
  fireEvent.change(cartaoInput);
  fireEvent.change(contratoInput);
}

async function preencherDadosResponsavel() {
  fireEvent.change(screen.getByLabelText(/Nome Completo/i), {
    target: { value: DADOS_RESPONSAVEL.nome },
  });
  fireEvent.change(screen.getByLabelText(/CPF/i), {
    target: { value: DADOS_RESPONSAVEL.cpf },
  });
  fireEvent.change(screen.getByLabelText(/Email/i), {
    target: { value: DADOS_RESPONSAVEL.email },
  });
  fireEvent.change(screen.getByLabelText(/Celular/i), {
    target: { value: DADOS_RESPONSAVEL.celular },
  });

  const file = new File(['dummy'], 'doc.pdf', { type: 'application/pdf' });
  const docInput = screen.getByLabelText(/Documento de Identifica..o/i);
  Object.defineProperty(docInput, 'files', { value: [file] });
  fireEvent.change(docInput);
}

describe('ModalCadastrotomador - aceite do contrato habilita botão Próximo', () => {
  jest.setTimeout(15000);

  it('bloqueia "Confirmar e Enviar" na etapa confirmacao até aceitar os termos', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={() => {}} />);

    // Etapa 1: Tipo (já selecionado como entidade por padrão)
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Etapa 2: Dados
    await waitFor(() =>
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument()
    );
    await preencherDadosEmpresa();
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Etapa 3: Responsável
    await waitFor(() =>
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument()
    );
    await preencherDadosResponsavel();
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Etapa 4: Confirmação — botão deve estar desabilitado
    const submitBtn = await screen.findByRole('button', {
      name: /Confirmar e Enviar/i,
    });
    expect(submitBtn).toBeDisabled();

    // Marcar semIndicacao para remover bloqueio de representante
    const semIndicacaoCheckbox = screen.getByRole('checkbox', {
      name: /N.o fui indicado/i,
    });
    await userEvent.click(semIndicacaoCheckbox);

    // Ainda deve estar bloqueado (falta checkbox de confirmação de dados)
    expect(submitBtn).toBeDisabled();

    // Marcar confirmação de dados revisados
    const confirmarCheckbox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    await userEvent.click(confirmarCheckbox);

    // Agora deve estar habilitado
    await waitFor(() => expect(submitBtn).not.toBeDisabled());
  });

  it('não avança para a etapa de confirmação se dados estiverem incompletos', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={() => {}} />);

    // Avançar da etapa tipo sem preencher dados
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Tenta avançar sem preencher dados
    await waitFor(() =>
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument()
    );
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Deve continuar na etapa dados (não avançou)
    expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Nome Completo/i)).not.toBeInTheDocument();
  });

  it('deve permitir preencher todos os dados e habilitar envio', async () => {
    render(<ModalCadastrotomador isOpen={true} onClose={() => {}} />);

    // Tipo
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Dados
    await waitFor(() =>
      expect(screen.getByLabelText(/Razão Social/i)).toBeInTheDocument()
    );
    await preencherDadosEmpresa();
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Responsável
    await waitFor(() =>
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument()
    );
    await preencherDadosResponsavel();
    await userEvent.click(screen.getByRole('button', { name: /Próximo/i }));

    // Confirmação
    const submitBtn = await screen.findByRole('button', {
      name: /Confirmar e Enviar/i,
    });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();

    // Aceitar termos
    const semIndicacaoCheckbox = screen.getByRole('checkbox', {
      name: /N.o fui indicado/i,
    });
    await userEvent.click(semIndicacaoCheckbox);

    const confirmarCheckbox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    await userEvent.click(confirmarCheckbox);

    await waitFor(() => expect(submitBtn).not.toBeDisabled());
  });
});
