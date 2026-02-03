import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LiberarLoteModal } from '@/components/modals/LiberarLoteModal';
import * as useLiberarLoteModule from '@/lib/hooks/useLiberarLote';
import * as useLiberarLoteEntidadeModule from '@/lib/hooks/useLiberarLoteEntidade';

jest.mock('@/lib/hooks/useLiberarLote');
jest.mock('@/lib/hooks/useLiberarLoteEntidade');

describe('LiberarLoteModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();
  const mockLiberarLote = jest.fn();
  const mockReset = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    empresaId: 1,
    empresaNome: 'Empresa Teste',
    onSuccess: mockOnSuccess,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: null,
      result: null,
      reset: mockReset,
    });
  });

  it('não deve renderizar quando isOpen é false', () => {
    const { container } = render(
      <LiberarLoteModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('deve renderizar modal quando isOpen é true', () => {
    render(<LiberarLoteModal {...defaultProps} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(
      screen.getByText('Iniciar Ciclo de Coletas Avaliativas')
    ).toBeInTheDocument();
    expect(screen.getByText('Empresa Teste')).toBeInTheDocument();
  });

  it('deve exibir caixa informativa sobre elegibilidade', () => {
    render(<LiberarLoteModal {...defaultProps} />);

    expect(
      screen.getByText('Sistema de Elegibilidade Automática')
    ).toBeInTheDocument();
    expect(screen.getByText(/Funcionários novos/)).toBeInTheDocument();
    expect(screen.getByText(/Índices atrasados/)).toBeInTheDocument();
  });

  it('deve permitir seleção de tipo de lote', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const completoOption = screen.getByLabelText(/Completo/);
    const operacionalOption = screen.getByLabelText(/Operacional/);
    const gestaoOption = screen.getByLabelText(/Gestão/);

    expect(completoOption).toBeChecked();

    await user.click(operacionalOption);
    expect(operacionalOption).toBeChecked();

    await user.click(gestaoOption);
    expect(gestaoOption).toBeChecked();
  });

  it('deve permitir entrada de título opcional', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const tituloInput = screen.getByLabelText(/Título \(Opcional\)/);
    await user.type(tituloInput, 'Avaliação Anual 2026');

    expect(tituloInput).toHaveValue('Avaliação Anual 2026');
  });

  it('deve permitir entrada de descrição opcional', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const descricaoTextarea = screen.getByLabelText(/Descrição \(Opcional\)/);
    await user.type(descricaoTextarea, 'Descrição de teste');

    expect(descricaoTextarea).toHaveValue('Descrição de teste');
  });

  it('deve permitir seleção de data filtro', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const dataInput = screen.getByLabelText(/Filtrar por Data de Admissão/);
    await user.type(dataInput, '2026-01-01');

    expect(dataInput).toHaveValue('2026-01-01');
  });

  it('deve chamar liberarLote ao submeter formulário', async () => {
    const user = userEvent.setup();
    mockLiberarLote.mockResolvedValueOnce({ success: true });

    render(<LiberarLoteModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLiberarLote).toHaveBeenCalledWith({
        empresaId: 1,
        tipo: 'completo',
      });
    });
  });

  it('deve incluir título e descrição ao submeter se fornecidos', async () => {
    const user = userEvent.setup();
    mockLiberarLote.mockResolvedValueOnce({ success: true });

    render(<LiberarLoteModal {...defaultProps} />);

    await user.type(screen.getByLabelText(/Título/), 'Teste Título');
    await user.type(screen.getByLabelText(/Descrição/), 'Teste Descrição');

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLiberarLote).toHaveBeenCalledWith({
        empresaId: 1,
        tipo: 'completo',
        titulo: 'Teste Título',
        descricao: 'Teste Descrição',
      });
    });
  });

  it('deve exibir mensagem de sucesso após liberação', async () => {
    const user = userEvent.setup();
    const mockResult = {
      success: true,
      message: 'Lote 1 (001-010126) liberado com sucesso!',
      lote: {
        id: 1,
        codigo: '001-010126',
        numero_ordem: 1,
        titulo: 'Lote 1',
        tipo: 'completo',
        liberado_em: new Date().toISOString(),
      },
    };

    mockLiberarLote.mockResolvedValueOnce(mockResult);

    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: null,
      result: mockResult,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Lote liberado com sucesso!')
      ).toBeInTheDocument();
      expect(screen.getAllByText(/001-010126/).length).toBeGreaterThanOrEqual(
        1
      );
      // Após sucesso deve chamar onSuccess
      expect(mockOnSuccess).toHaveBeenCalledWith(1);
    });

    // Verificar que o modal permanece aberto para mostrar a mensagem de sucesso
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('quando resposta RH tem sucesso mas sem lote, deve notificar onSuccess com -1', async () => {
    const user = userEvent.setup();

    mockLiberarLote.mockResolvedValueOnce({ success: true });

    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: null,
      result: { success: true, message: 'Processado sem lote' },
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(-1);
    });

    // Modal permanece aberto até que o pai decida fechar
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve exibir mensagem de erro em caso de falha', () => {
    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: 'Erro ao Iniciar Ciclo',
      result: null,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    expect(
      screen.getAllByText('Erro ao Iniciar Ciclo').length
    ).toBeGreaterThanOrEqual(1);
  });

  it('deve desabilitar botões durante carregamento', () => {
    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: true,
      error: null,
      result: null,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
    const submitButton = screen.getByRole('button', { name: /Liberando/ });

    expect(cancelButton).toBeDisabled();
    expect(submitButton).toBeDisabled();
    expect(screen.getByText('Liberando...')).toBeInTheDocument();
  });

  it('deve chamar onClose ao clicar em cancelar', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const cancelButton = screen.getByRole('button', { name: /Cancelar/ });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve chamar onClose ao clicar no X', async () => {
    const user = userEvent.setup();
    render(<LiberarLoteModal {...defaultProps} />);

    const closeButton = screen.getByLabelText('Fechar modal');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('deve chamar reset ao abrir modal', () => {
    const { rerender } = render(
      <LiberarLoteModal {...defaultProps} isOpen={false} />
    );

    mockReset.mockClear();

    rerender(<LiberarLoteModal {...defaultProps} isOpen={true} />);

    expect(mockReset).toHaveBeenCalled();
  });

  it('deve exibir resumo de inclusão quando disponível', () => {
    const mockResult = {
      success: true,
      resumoInclusao: {
        funcionarios_novos: 5,
        indices_atrasados: 3,
        mais_de_1_ano_sem_avaliacao: 2,
        renovacoes_regulares: 1,
        prioridade_critica: 2,
        prioridade_alta: 3,
        mensagem: 'Teste',
      },
      estatisticas: {
        avaliacoesCreated: 11,
        totalFuncionarios: 11,
        empresa: 'Empresa Teste',
      },
    };

    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: null,
      result: mockResult,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    expect(screen.getByText('Resumo da Liberação')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // novos
    expect(screen.getByText('3')).toBeInTheDocument(); // atrasados
    expect(screen.getByText('11')).toBeInTheDocument(); // total
  });

  it('deve exibir aviso para funcionários com prioridade crítica', () => {
    const mockResult = {
      success: true,
      resumoInclusao: {
        funcionarios_novos: 0,
        indices_atrasados: 0,
        mais_de_1_ano_sem_avaliacao: 0,
        renovacoes_regulares: 0,
        prioridade_critica: 3,
        prioridade_alta: 0,
        mensagem: 'Teste',
      },
    };

    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: null,
      result: mockResult,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    expect(
      screen.getByText(/3 funcionário\(s\) com prioridade CRÍTICA/)
    ).toBeInTheDocument();
  });

  it('deve Iniciar Ciclo quando em modo entidade', async () => {
    const entidadeProps = {
      ...defaultProps,
      empresaId: undefined as any,
      empresaNome: undefined as any,
      mode: 'entidade' as const,
    };

    const mockLiberarEntidade = jest.fn().mockResolvedValueOnce({
      success: true,
      message: 'Processado para entidade',
      resultados: [
        {
          empresaId: 10,
          empresaNome: 'Empresa X',
          created: true,
          avaliacoesCriadas: 3,
          funcionariosConsiderados: 4,
        },
      ],
    });

    (
      useLiberarLoteEntidadeModule.useLiberarLoteEntidade as jest.Mock
    ).mockReturnValue({
      liberarLote: mockLiberarEntidade,
      loading: false,
      error: null,
      result: null,
      reset: jest.fn(),
    });

    render(<LiberarLoteModal {...entidadeProps} />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    expect(submitButton).not.toBeDisabled();

    const user = userEvent.setup();
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLiberarEntidade).toHaveBeenCalled();
      expect(
        screen.getByText('Lotes criados com sucesso!')
      ).toBeInTheDocument();
      expect(screen.getByText(/Empresa X/)).toBeInTheDocument();
    });

    // Verificar que o modal permanece aberto para mostrar a mensagem de sucesso
    expect(mockOnSuccess).toHaveBeenCalledWith(-1);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('deve exibir detalhes de erro quando nenhuma empresa cria lotes em modo entidade', async () => {
    const entidadeProps = {
      ...defaultProps,
      empresaId: undefined as any,
      empresaNome: undefined as any,
      mode: 'entidade' as const,
    };

    const mockLiberarEntidade = jest.fn().mockResolvedValueOnce({
      success: false,
      message: 'Nenhum lote criado',
      resultados: [
        {
          empresaId: 10,
          empresaNome: 'Empresa X',
          created: false,
          message: 'Nenhum funcionário elegível encontrado',
        },
      ],
      detalhes:
        'Não foram encontrados funcionários elegíveis para avaliação em nenhuma das empresas processadas:\nEmpresa X: Nenhum funcionário elegível encontrado\n\nVerifique os critérios de elegibilidade ou cadastre novos funcionários.',
    });

    (
      useLiberarLoteEntidadeModule.useLiberarLoteEntidade as jest.Mock
    ).mockReturnValue({
      liberarLote: mockLiberarEntidade,
      loading: false,
      error: 'Nenhum funcionário elegível encontrado',
      result: {
        success: false,
        resultados: [
          {
            empresaId: 10,
            empresaNome: 'Empresa X',
            created: false,
            message: 'Nenhum funcionário elegível encontrado',
          },
        ],
        detalhes:
          'Não foram encontrados funcionários elegíveis para avaliação em nenhuma das empresas processadas:\nEmpresa X: Nenhum funcionário elegível encontrado\n\nVerifique os critérios de elegibilidade ou cadastre novos funcionários.',
      },
      reset: jest.fn(),
    });

    render(<LiberarLoteModal {...entidadeProps} />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Ciclo/ });
    const user = userEvent.setup();
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText('Não foi possível criar o lote')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Não foram encontrados funcionários elegíveis/)
      ).toBeInTheDocument();
    });
  });

  it('deve exibir hint amigável quando ocorrer erro de permissão de clínica', () => {
    (useLiberarLoteModule.useLiberarLote as jest.Mock).mockReturnValue({
      liberarLote: mockLiberarLote,
      loading: false,
      error: 'Acesso negado',
      errorCode: 'permission_clinic_mismatch',
      errorHint:
        'Verifique a clínica do seu usuário ou contate o administrador.',
      result: null,
      reset: mockReset,
    });

    render(<LiberarLoteModal {...defaultProps} />);

    expect(screen.getByText('Acesso negado')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Verifique a clínica do seu usuário ou contate o administrador.'
      )
    ).toBeInTheDocument();
  });
});
