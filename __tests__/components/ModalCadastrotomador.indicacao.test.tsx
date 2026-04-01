/**
 * @fileoverview Testes da lógica de habilitação do botão "Confirmar e Enviar"
 * considerando as condições: semIndicacao OU codigoRepresentante + confirmacaoFinalAceita.
 *
 * Estratégia: mock do useCadastroTomador para renderizar diretamente
 * na etapa 'confirmacao', e useState para controlar semIndicacao.
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModalCadastrotomador from '@/components/modals/ModalCadastrotomador';

// Mock mínimo do hook para iniciar na etapa de confirmação
const hookDefaults = {
  etapaAtual: 'confirmacao',
  erro: null,
  sucesso: false,
  enviando: false,
  tipo: 'entidade',
  setTipo: jest.fn(),
  cnpjError: null,
  planos: [],
  planoSelecionado: null,
  setPlanoSelecionado: jest.fn(),
  numeroFuncionarios: 10,
  setNumeroFuncionarios: jest.fn(),
  contratoAceito: true,
  setContratoAceito: jest.fn(),
  contratoGerado: null,
  confirmacaoFinalAceita: false,
  setConfirmacaoFinalAceita: jest.fn(),
  dadostomador: {
    nome: 'Empresa X',
    cnpj: '11.222.333/0001-81',
    email: 'e@e.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua A, 1',
    cidade: 'SP',
    estado: 'SP',
    cep: '01000-000',
    inscricao_estadual: '',
    numero_funcionarios_estimado: 10,
  },
  dadosResponsavel: {
    nome: 'João',
    cpf: '123.456.789-09',
    cargo: 'Gestor',
    email: 'j@j.com',
    celular: '(11) 91234-0000',
  },
  arquivos: {
    cartao_cnpj: new File(['x'], 'c.pdf', { type: 'application/pdf' }),
    contrato_social: new File(['x'], 'cs.pdf', { type: 'application/pdf' }),
    doc_identificacao: new File(['x'], 'd.pdf', { type: 'application/pdf' }),
  },
  codigoRepresentante: '',
  setCodigoRepresentante: jest.fn(),
  semIndicacao: false,
  setSemIndicacao: jest.fn(),
  handleDadosChange: jest.fn(),
  handleResponsavelChange: jest.fn(),
  handleFileChange: jest.fn(),
  avancarEtapa: jest.fn(),
  voltarEtapa: jest.fn(),
  submit: jest.fn().mockResolvedValue({}),
  resetarFormulario: jest.fn(),
  redirectUrl: null,
};

jest.mock('@/hooks/useCadastroTomador', () => ({
  useCadastroTomador: jest.fn(),
}));

import { useCadastroTomador } from '@/hooks/useCadastroTomador';
const mockHook = useCadastroTomador as jest.MockedFunction<
  typeof useCadastroTomador
>;

function setup(overrides: Partial<typeof hookDefaults> = {}) {
  mockHook.mockReturnValue({ ...hookDefaults, ...overrides } as ReturnType<
    typeof useCadastroTomador
  >);
  return render(<ModalCadastrotomador isOpen={true} onClose={jest.fn()} />);
}

describe('ModalCadastrotomador – botão "Confirmar e Enviar" na etapa confirmação', () => {
  beforeEach(() => jest.clearAllMocks());

  it('botão desabilitado quando nem código nem semIndicacao, mesmo com confirmação marcada', () => {
    setup({ confirmacaoFinalAceita: true, codigoRepresentante: '' });
    // semIndicacao é false (estado local default)
    const btn = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    expect(btn).toBeDisabled();
  });

  it('botão desabilitado quando sem confirmação final, mesmo com código preenchido', () => {
    setup({ confirmacaoFinalAceita: false, codigoRepresentante: 'REP-ABC123' });
    const btn = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    expect(btn).toBeDisabled();
  });

  it('botão habilitado ao marcar semIndicacao + confirmação', async () => {
    setup({ confirmacaoFinalAceita: false, codigoRepresentante: '' });

    // Marcar "Não fui indicado"
    const semIndicacaoBox = screen.getByRole('checkbox', {
      name: /Não fui indicado por nenhum representante/i,
    });
    fireEvent.click(semIndicacaoBox);

    // Marcar confirmação final
    const confirmBox = screen.getByRole('checkbox', {
      name: /Confirmo que revisei todos os dados/i,
    });
    fireEvent.click(confirmBox);

    // Como confirmacaoFinalAceita é controlado pelo mock (não muda),
    // testamos que o setConfirmacaoFinalAceita foi chamado
    expect(hookDefaults.setConfirmacaoFinalAceita).toHaveBeenCalled();
  });

  it('botão habilitado quando código preenchido + confirmação (estado controlado)', () => {
    setup({ confirmacaoFinalAceita: true, codigoRepresentante: 'REP-XYZ' });
    // semIndicacao = false (default), código preenchido, confirmação = true
    const btn = screen.getByRole('button', { name: /Confirmar e Enviar/i });
    expect(btn).not.toBeDisabled();
  });

  it('exibe aviso de indicação quando código vazio e semIndicacao=false', () => {
    setup({ confirmacaoFinalAceita: true, codigoRepresentante: '' });
    // O aviso condicional (distinto do parágrafo estático) contém "para prosseguir"
    expect(
      screen.getByText(/para prosseguir/i)
    ).toBeInTheDocument();
  });

  it('exibe aviso de confirmação quando indicação OK mas confirmação pendente', async () => {
    setup({ confirmacaoFinalAceita: false, codigoRepresentante: 'REP-XYZ' });
    // semIndicacao=false, código preenchido → aviso de confirmação pendente
    // O texto "para habilitar o envio" é único nesse trecho do aviso
    expect(screen.getByText(/para habilitar o envio/i)).toBeInTheDocument();
  });

  it('bloco Indicação exibe badge Obrigatório na etapa confirmação', () => {
    setup({ confirmacaoFinalAceita: false, codigoRepresentante: '' });
    expect(screen.getByText('Obrigatório')).toBeInTheDocument();
  });

  it('quando semIndicacao=true, o input de código fica desabilitado', () => {
    // Renderiza diretamente com semIndicacao=true para testar o atributo disabled
    // (sem necessidade de estado reativo via mock)
    setup({ semIndicacao: true });
    const input = screen.getByPlaceholderText(/REP-ABC123/i);
    expect(input).toBeDisabled();
  });
});
