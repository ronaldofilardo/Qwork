import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CadastrarRepresentanteModal from '@/app/comercial/representantes/CadastrarRepresentanteModal';

const mockOnClose = jest.fn();
const mockOnSuccess = jest.fn();

const defaultProps = {
  onClose: mockOnClose,
  onSuccess: mockOnSuccess,
};

beforeEach(() => {
  jest.clearAllMocks();
});

// Mock clipboard API
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn().mockResolvedValue(undefined) },
  writable: true,
});

describe('CadastrarRepresentanteModal — renderização base', () => {
  it('renderiza o título do modal', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.getByRole('heading', { name: 'Cadastrar Representante' })
    ).toBeInTheDocument();
  });

  it('mostra campo Nome Completo', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('Nome do representante')
    ).toBeInTheDocument();
  });

  it('mostra campo CPF', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(screen.getByPlaceholderText('000.000.000-00')).toBeInTheDocument();
  });

  it('mostra campo Email', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('email@exemplo.com')
    ).toBeInTheDocument();
  });

  it('mostra campo Telefone', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.getByPlaceholderText('(00) 00000-0000')
    ).toBeInTheDocument();
  });

  it('mostra opções Pessoa Física e Pessoa Jurídica', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(screen.getByText('Pessoa Física')).toBeInTheDocument();
    expect(screen.getByText('Pessoa Jurídica')).toBeInTheDocument();
  });

  it('Pessoa Física selecionada por padrão', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(screen.getByDisplayValue('pf')).toBeChecked();
    expect(screen.getByDisplayValue('pj')).not.toBeChecked();
  });

  it('mostra botão de upload de Documento de Identificação', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.getByText('Selecionar documento...')
    ).toBeInTheDocument();
  });
});

describe('CadastrarRepresentanteModal — campos PF (padrão)', () => {
  it('NÃO exibe campo CNPJ quando PF selecionado', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.queryByPlaceholderText('00.000.000/0000-00')
    ).not.toBeInTheDocument();
  });

  it('NÃO exibe campo Razão Social quando PF selecionado', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.queryByPlaceholderText('Razão social da empresa')
    ).not.toBeInTheDocument();
  });

  it('NÃO exibe upload Cartão CNPJ quando PF selecionado', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    expect(
      screen.queryByText('Selecionar cartão do CNPJ...')
    ).not.toBeInTheDocument();
  });
});

describe('CadastrarRepresentanteModal — campos PJ', () => {
  beforeEach(() => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    fireEvent.click(screen.getByDisplayValue('pj'));
  });

  it('exibe campo CNPJ ao selecionar PJ', () => {
    expect(
      screen.getByPlaceholderText('00.000.000/0000-00')
    ).toBeInTheDocument();
  });

  it('exibe campo Razão Social ao selecionar PJ', () => {
    expect(
      screen.getByPlaceholderText('Razão social da empresa')
    ).toBeInTheDocument();
  });

  it('exibe botão de upload Cartão do CNPJ ao selecionar PJ', () => {
    expect(
      screen.getByText('Selecionar cartão do CNPJ...')
    ).toBeInTheDocument();
  });

  it('exibe label "Cartão do CNPJ" ao selecionar PJ', () => {
    expect(
      screen.getByText(/Cartão do CNPJ \(PDF, JPG, PNG\)/i)
    ).toBeInTheDocument();
  });

  it('NÃO exibe texto "CPF do Responsável PJ"', () => {
    expect(
      screen.queryByText(/CPF do Responsável PJ/i)
    ).not.toBeInTheDocument();
  });
});

describe('CadastrarRepresentanteModal — alternância PF/PJ', () => {
  it('oculta campos PJ ao voltar para PF', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    fireEvent.click(screen.getByDisplayValue('pj'));
    expect(
      screen.getByPlaceholderText('00.000.000/0000-00')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByDisplayValue('pf'));
    expect(
      screen.queryByPlaceholderText('00.000.000/0000-00')
    ).not.toBeInTheDocument();
  });
});

describe('CadastrarRepresentanteModal — botão fechar', () => {
  it('chama onClose ao clicar em Cancelar', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

describe('CadastrarRepresentanteModal — botão de submit desabilitado', () => {
  it('botão "Cadastrar Representante" desabilitado com formulário vazio', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);
    const btn = screen
      .getAllByText('Cadastrar Representante')
      .find((el) => el.tagName === 'BUTTON') as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });

  it('botão desabilitado para PJ sem Cartão CNPJ', () => {
    render(<CadastrarRepresentanteModal {...defaultProps} />);

    fireEvent.change(screen.getByPlaceholderText('Nome do representante'), {
      target: { value: 'Empresa Teste LTDA' },
    });
    fireEvent.change(screen.getByPlaceholderText('000.000.000-00'), {
      target: { value: '000.000.000-00' },
    });
    fireEvent.change(screen.getByPlaceholderText('email@exemplo.com'), {
      target: { value: 'teste@empresa.com' },
    });

    fireEvent.click(screen.getByDisplayValue('pj'));

    const btn = screen
      .getAllByText('Cadastrar Representante')
      .find((el) => el.tagName === 'BUTTON') as HTMLButtonElement;
    expect(btn).toBeDisabled();
  });
});
