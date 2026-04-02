/**
 * @file __tests__/components/ModalCadastrotomador.integration.test.tsx
 * Testes: ModalCadastrotomador - integração leve
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

const enviarSpy = jest.fn().mockResolvedValue({ id: 42 });

jest.mock('@/lib/cadastroApi', () => ({
  createCadastroApi: () => ({
    enviarCadastro: enviarSpy,
  }),
}));

describe('ModalCadastrotomador - integração leve', () => {
  test('fluxo básico: preencher dados e enviar', async () => {
    jest.useFakeTimers();
    const onClose = jest.fn();
    render(
      <ModalCadastrotomador isOpen={true} onClose={onClose} tipo="entidade" />
    );

    // Com tipo="entidade" a modal inicia direto na etapa de dados
    await waitFor(() => {
      expect(screen.getByLabelText('Razão Social')).toBeInTheDocument();
    });

    // Preencher dados obrigatórios
    fireEvent.change(screen.getByLabelText('Razão Social'), {
      target: { value: 'ACME' },
    });
    fireEvent.change(screen.getByLabelText('CNPJ'), {
      target: { value: '11.444.777/0001-61' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'a@a.com' },
    });
    fireEvent.change(screen.getByLabelText('Telefone'), {
      target: { value: '(11) 99999-9999' },
    });
    fireEvent.change(screen.getByLabelText('Endereço'), {
      target: { value: 'Rua X' },
    });
    fireEvent.change(screen.getByLabelText('Cidade'), {
      target: { value: 'São Paulo' },
    });
    fireEvent.change(screen.getByLabelText('Estado (UF)'), {
      target: { value: 'SP' },
    });
    fireEvent.change(screen.getByLabelText('CEP'), {
      target: { value: '01234-567' },
    });

    // Anexos (cartão cnpj e contrato social)
    const cartao = new File(['dummy'], 'cnpj.pdf', { type: 'application/pdf' });
    const contrato = new File(['dummy'], 'cont.pdf', {
      type: 'application/pdf',
    });

    fireEvent.change(screen.getByLabelText('Cartão CNPJ'), {
      target: { files: [cartao] },
    });
    fireEvent.change(screen.getByLabelText('Contrato Social'), {
      target: { files: [contrato] },
    });

    // Próximo para responsavel
    fireEvent.click(screen.getByText('Próximo'));

    // Preencher responsável
    fireEvent.change(screen.getByLabelText('Nome Completo'), {
      target: { value: 'João' },
    });
    fireEvent.change(screen.getByLabelText('CPF'), {
      target: { value: '123.456.789-09' },
    });
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'j@j.com' },
    });
    fireEvent.change(screen.getByLabelText('Celular'), {
      target: { value: '(11) 99999-9999' },
    });

    const doc = new File(['id'], 'id.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Documento de Identificação'), {
      target: { files: [doc] },
    });

    // Avançar (isso gera contrato automático para plano fixo e pulará para confirmação)
    fireEvent.click(screen.getByText('Próximo'));

    // Marcar semIndicacao (obrigatório para habilitar envio)
    const semIndicacaoCheckbox = screen.getByRole('checkbox', {
      name: /N.o fui indicado/i,
    });
    fireEvent.click(semIndicacaoCheckbox);

    // Confirmar checkbox final
    const confirmCheckbox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    fireEvent.click(confirmCheckbox);

    // Enviar
    await waitFor(() => {
      expect(screen.getByText('Confirmar e Enviar')).not.toBeDisabled();
    });
    const enviarBtn = screen.getByText('Confirmar e Enviar');
    fireEvent.click(enviarBtn);

    // Fazer os timers avançarem (setTimeout do redirect)
    jest.runAllTimers();

    // Verificar que a API de envio foi chamada
    await waitFor(() => {
      expect(enviarSpy).toHaveBeenCalled();
    });
  }, 20000);

  test('inputs de arquivo estão habilitados e são obrigatórios na etapa de dados', async () => {
    const onClose = jest.fn();
    render(
      <ModalCadastrotomador isOpen={true} onClose={onClose} tipo="entidade" />
    );

    // Aguarda chegar na etapa de dados (tipo="entidade" pula seleção de tipo)
    await waitFor(() => {
      expect(screen.getByLabelText('Razão Social')).toBeInTheDocument();
    });

    const cartao = screen.getByLabelText<HTMLInputElement>('Cartão CNPJ');
    const contrato = screen.getByLabelText<HTMLInputElement>('Contrato Social');

    // Uploads sempre habilitados e obrigatórios
    expect(cartao.disabled).toBe(false);
    expect(contrato.disabled).toBe(false);
    expect(cartao.hasAttribute('required')).toBe(true);
    expect(contrato.hasAttribute('required')).toBe(true);

    // Nenhum aviso de "desabilitado" deve estar visível
    expect(
      screen.queryByText(/temporariamente desabilitados/i)
    ).not.toBeInTheDocument();
  }, 20000);
});
