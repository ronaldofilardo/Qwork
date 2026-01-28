import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModalEmergencia } from '@/components/emissor/ModalEmergencia';
import { useEmergenciaLaudo } from '@/hooks/useEmergenciaLaudo';

// Mock do hook
jest.mock('@/hooks/useEmergenciaLaudo');
const mockUseEmergenciaLaudo = useEmergenciaLaudo as jest.MockedFunction<
  typeof useEmergenciaLaudo
>;

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ModalEmergencia Component', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Mock do hook de emergência
    mockUseEmergenciaLaudo.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });

    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('deve renderizar botão de emergência inicialmente', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    expect(screen.getByText('Modo Emergência')).toBeInTheDocument();
    expect(
      screen.getByTitle(
        'Forçar emissão em modo emergência (requer justificativa)'
      )
    ).toBeInTheDocument();
  });

  it('deve abrir modal quando botão é clicado', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    expect(screen.getByText('Modo Emergência')).toBeInTheDocument();
    expect(screen.getByText('Atenção:')).toBeInTheDocument();
    expect(screen.getByText('Lote:')).toBeInTheDocument();
    expect(screen.getByText(/001-010125/)).toBeInTheDocument();
    expect(
      screen.getByText('Justificativa da intervenção')
    ).toBeInTheDocument();
  });

  it('deve fechar modal quando botão cancelar é clicado', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Fechar modal
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    // Modal deve estar fechado
    expect(screen.queryByText('Atenção:')).not.toBeInTheDocument();
  });

  it('deve validar justificativa com menos de 20 caracteres', async () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar justificativa curta
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, { target: { value: 'Motivo curto' } });

    // Botão deve estar desabilitado
    const submitButton = screen.getByText('Forçar Emissão');
    expect(submitButton).toBeDisabled();

    // Hook não deve ser chamado
    expect(mockUseEmergenciaLaudo().mutate).not.toHaveBeenCalled();
  });

  it('deve aceitar justificativa válida e chamar hook', async () => {
    const mockMutate = jest.fn();
    const mockOnSuccess = jest.fn();

    mockUseEmergenciaLaudo.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      isError: false,
      isSuccess: false,
      error: null,
      data: null,
    });

    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={mockOnSuccess}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar justificativa válida
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, {
      target: {
        value:
          'Sistema de processamento automático apresentou falha crítica impedindo a emissão normal do laudo',
      },
    });

    // Submeter
    const submitButton = screen.getByText('Forçar Emissão');
    fireEvent.click(submitButton);

    // Fetch deve ser chamado
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/123/emergencia',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo:
            'Sistema de processamento automático apresentou falha crítica impedindo a emissão normal do laudo',
        }),
      })
    );
  });

  it('deve mostrar contador de caracteres', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Verificar contador inicial
    expect(screen.getByText('0/500 caracteres')).toBeInTheDocument();

    // Digitar texto
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, {
      target: { value: 'Texto de teste com 25 caracteres' },
    });

    // Verificar contador atualizado
    expect(screen.getByText('32/500 caracteres')).toBeInTheDocument();
  });

  it('deve mostrar estado de carregamento durante processamento', () => {
    // Mock fetch que nunca resolve para manter loading
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar justificativa
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, {
      target: { value: 'Justificativa válida com mais de vinte caracteres' },
    });

    // Clicar no botão para iniciar processamento
    const submitButton = screen.getByText('Forçar Emissão');
    fireEvent.click(submitButton);

    // Botão deve mostrar loading
    expect(screen.getByText('Processando...')).toBeInTheDocument();

    // Textarea deve estar desabilitada
    expect(textarea).toBeDisabled();

    // Botões devem estar desabilitados
    expect(screen.getByText('Cancelar')).toBeDisabled();
  });

  it('deve mostrar erro quando API falha', async () => {
    // Mock fetch que retorna erro
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Lote não encontrado' }),
    });

    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar justificativa
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, {
      target: { value: 'Justificativa válida com mais de vinte caracteres' },
    });

    // Clicar no botão
    const submitButton = screen.getByText('Forçar Emissão');
    fireEvent.click(submitButton);

    // Deve mostrar erro após processamento
    await waitFor(() => {
      expect(screen.getByText('Lote não encontrado')).toBeInTheDocument();
    });
  });

  it('deve fechar modal e chamar onSuccess quando sucesso', async () => {
    const mockOnSuccess = jest.fn();

    // Mock fetch que retorna sucesso
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ laudo_id: 456 }),
    });

    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={mockOnSuccess}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar justificativa
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, {
      target: { value: 'Justificativa válida com mais de vinte caracteres' },
    });

    // Clicar no botão
    const submitButton = screen.getByText('Forçar Emissão');
    fireEvent.click(submitButton);

    // Modal deve estar fechado após sucesso
    await waitFor(() => {
      expect(screen.queryByText('Atenção:')).not.toBeInTheDocument();
    });

    // onSuccess deve ser chamado
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it('deve limpar estado quando modal é fechado e reaberto', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Digitar algo
    const textarea = screen.getByPlaceholderText(/Descreva o motivo/);
    fireEvent.change(textarea, { target: { value: 'Texto digitado' } });

    // Fechar modal
    const cancelButton = screen.getByText('Cancelar');
    fireEvent.click(cancelButton);

    // Reabrir modal (re-obter botão)
    const buttonOpen = screen.getByText('Modo Emergência');
    fireEvent.click(buttonOpen);

    // Textarea deve estar vazia (re-obter elemento após reabrir)
    const textareaAfter = screen.getByPlaceholderText(/Descreva o motivo/);
    expect(textareaAfter).toHaveValue('');
  });

  it('deve permitir fechar modal clicando no overlay', () => {
    render(
      <ModalEmergencia
        loteId={123}
        loteCodigo="001-010125"
        onSuccess={jest.fn()}
      />,
      { wrapper }
    );

    // Abrir modal
    const button = screen.getByText('Modo Emergência');
    fireEvent.click(button);

    // Clicar no overlay: procurar o elemento overlay (classe 'fixed' + 'inset-0')
    const overlay = Array.from(document.querySelectorAll('div')).find(
      (el) =>
        (el.className || '').includes('fixed') &&
        (el.className || '').includes('inset-0')
    );
    if (overlay) {
      fireEvent.click(overlay);
    }

    // Modal deve estar fechado
    expect(screen.queryByText('Atenção:')).not.toBeInTheDocument();
  });
});
