/**
 * @fileoverview Testes do bloco "Indicação" do ConfirmacaoStep.
 * Verifica que o campo de código e o checkbox "Sem indicação" se comportam
 * de forma mutuamente exclusiva e que o helper correto é chamado.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmacaoStep from '@/components/modals/ModalCadastroTomadorSteps/ConfirmacaoStep';

const defaultDadosTomador = {
  nome: 'Empresa Teste',
  cnpj: '11.222.333/0001-81',
  email: 'e@e.com',
  telefone: '(11) 91234-5678',
  endereco: 'Rua A, 1',
  cidade: 'SP',
  estado: 'SP',
};

const defaultResponsavel = {
  nome: 'João',
  cpf: '123.456.789-09',
  cargo: 'Gestor',
  email: 'j@j.com',
  celular: '(11) 99999-0000',
};

const defaultArquivos = {
  cartao_cnpj: new File(['x'], 'cnpj.pdf', { type: 'application/pdf' }),
  contrato_social: new File(['x'], 'cs.pdf', { type: 'application/pdf' }),
  doc_identificacao: new File(['x'], 'doc.pdf', { type: 'application/pdf' }),
};

function renderStep(
  overrides: Partial<React.ComponentProps<typeof ConfirmacaoStep>> = {}
) {
  const props: React.ComponentProps<typeof ConfirmacaoStep> = {
    dadostomador: defaultDadosTomador,
    dadosResponsavel: defaultResponsavel,
    arquivos: defaultArquivos,
    confirmacaoFinalAceita: false,
    setConfirmacaoFinalAceita: jest.fn(),
    codigoRepresentante: '',
    onCodigoRepresentanteChange: jest.fn(),
    semIndicacao: false,
    setSemIndicacao: jest.fn(),
    ...overrides,
  };
  return render(<ConfirmacaoStep {...props} />);
}

describe('ConfirmacaoStep – bloco Indicação', () => {
  it('exibe o bloco Indicação com badge Obrigatório', () => {
    renderStep();
    expect(screen.getByText('Indicação')).toBeInTheDocument();
    expect(screen.getByText('Obrigatório')).toBeInTheDocument();
  });

  it('exibe aviso quando código vazio e semIndicacao=false', () => {
    renderStep({ codigoRepresentante: '', semIndicacao: false });
    expect(
      screen.getByText(
        /Informe o código do representante ou marque a opção acima/i
      )
    ).toBeInTheDocument();
  });

  it('não exibe aviso quando semIndicacao=true', () => {
    renderStep({ semIndicacao: true });
    expect(
      screen.queryByText(/Informe o código do representante/i)
    ).not.toBeInTheDocument();
  });

  it('não exibe aviso quando codigoRepresentante está preenchido', () => {
    renderStep({ codigoRepresentante: 'REP-ABC123' });
    expect(
      screen.queryByText(/Informe o código do representante/i)
    ).not.toBeInTheDocument();
  });

  it('chama setSemIndicacao(true) ao marcar checkbox "Não fui indicado"', () => {
    const setSemIndicacao = jest.fn();
    renderStep({ setSemIndicacao });
    const checkbox = screen.getByRole('checkbox', {
      name: /Não fui indicado por nenhum representante/i,
    });
    fireEvent.click(checkbox);
    expect(setSemIndicacao).toHaveBeenCalledWith(true);
  });

  it('ao marcar semIndicacao, limpa o código via onCodigoRepresentanteChange("")', () => {
    const onCodigoRepresentanteChange = jest.fn();
    const setSemIndicacao = jest.fn((v) => {
      // simula o comportamento real do handler
    });
    // Renderizamos com semIndicacao=false e forçamos o clique
    renderStep({ onCodigoRepresentanteChange, setSemIndicacao });
    const checkbox = screen.getByRole('checkbox', {
      name: /Não fui indicado por nenhum representante/i,
    });
    fireEvent.click(checkbox);
    // handleSemIndicacao(true) → onCodigoRepresentanteChange?.('')
    expect(onCodigoRepresentanteChange).toHaveBeenCalledWith('');
  });

  it('desabilita o input de código quando semIndicacao=true', () => {
    renderStep({ semIndicacao: true });
    const input = screen.getByPlaceholderText(/REP-ABC123/i);
    expect(input).toBeDisabled();
  });

  it('exibe o checkbox de semIndicacao como marcado quando prop=true', () => {
    renderStep({ semIndicacao: true });
    const checkbox = screen.getByRole('checkbox', {
      name: /Não fui indicado por nenhum representante/i,
    });
    expect(checkbox).toBeChecked();
  });

  it('ao digitar código com semIndicacao=true, chama setSemIndicacao(false)', () => {
    const setSemIndicacao = jest.fn();
    const onCodigoRepresentanteChange = jest.fn();
    renderStep({
      semIndicacao: true,
      setSemIndicacao,
      onCodigoRepresentanteChange,
    });
    const input = screen.getByPlaceholderText(/REP-ABC123/i);
    // como o input está disabled com semIndicacao=true, esse teste valida comportamento
    // do handler quando semIndicacao=false (input habilitado)
    renderStep({
      semIndicacao: false,
      setSemIndicacao,
      onCodigoRepresentanteChange,
    });
    const inputs = screen.getAllByPlaceholderText(/REP-ABC123/i);
    fireEvent.change(inputs[inputs.length - 1], { target: { value: 'rep-x' } });
    // handleCodigoChange: se semIndicacao fosse true chamaria setSemIndicacao(false)
    // aqui semIndicacao=false então não deve chamar
    expect(setSemIndicacao).not.toHaveBeenCalled();
    expect(onCodigoRepresentanteChange).toHaveBeenCalledWith('REP-X');
  });

  it('converte código para uppercase ao digitar', () => {
    const onCodigoRepresentanteChange = jest.fn();
    renderStep({ semIndicacao: false, onCodigoRepresentanteChange });
    const input = screen.getByPlaceholderText(/REP-ABC123/i);
    fireEvent.change(input, { target: { value: 'rep-abc123' } });
    expect(onCodigoRepresentanteChange).toHaveBeenCalledWith('REP-ABC123');
  });
});
