import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmacaoStep from '@/components/modals/ModalCadastroContratante/ConfirmacaoStep';

describe('ConfirmacaoStep', () => {
  const dadosContratante = {
    nome: 'ACME',
    cnpj: '11.444.777/0001-61',
    email: 'a@a.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua X',
    cidade: 'SP',
    estado: 'SP',
  };

  const dadosResponsavel = {
    nome: 'João',
    cpf: '123.456.789-09',
    cargo: 'RH',
    email: 'j@j.com',
    celular: '(11) 99999-9999',
  };

  const arquivos = {
    cartao_cnpj: null,
    contrato_social: null,
    doc_identificacao: null,
  };

  test('mostra informações e controla checkbox', () => {
    const setConfirm = jest.fn();
    render(
      <ConfirmacaoStep
        dadosContratante={dadosContratante}
        dadosResponsavel={dadosResponsavel}
        arquivos={arquivos}
        confirmacaoFinalAceita={false}
        setConfirmacaoFinalAceita={setConfirm}
      />
    );

    expect(screen.getByText('Razão Social:')).toBeInTheDocument();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(setConfirm).toHaveBeenCalledWith(true);
  });
});
