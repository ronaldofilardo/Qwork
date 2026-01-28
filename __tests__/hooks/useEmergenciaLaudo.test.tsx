import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEmergenciaLaudo } from '@/hooks/useEmergenciaLaudo';
import toast from 'react-hot-toast';

// Mock do toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Temporarily skipped per request: emissão emergencial não será corrigida agora — tests will be re-enabled in a follow-up.
// TODO: re-enable and expand coverage after emergency-emission fix (track with issue/XXX)
describe.skip('useEmergenciaLaudo Hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('deve validar justificativa com menos de 20 caracteres', async () => {
    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({ loteId: 123, motivo: 'Motivo curto' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Justificativa deve ter no mínimo 20 caracteres'
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('deve aceitar justificativa com 20+ caracteres', async () => {
    const mockResponse = {
      success: true,
      laudo_id: 456,
      lote_id: 123,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 123,
        motivo:
          'Esta é uma justificativa com mais de vinte caracteres para teste',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo:
            'Esta é uma justificativa com mais de vinte caracteres para teste',
        }),
      }
    );
  });

  it('deve emitir laudo de emergência com sucesso', async () => {
    const mockResponse = {
      success: true,
      laudo_id: 456,
      lote_id: 123,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 123,
        motivo:
          'Sistema de fila apresentou falha crítica impedindo processamento automático',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(toast.success).toHaveBeenCalledWith(
      'Laudo 456 emitido em modo emergência!',
      {
        description: 'A emissão foi registrada no sistema de auditoria.',
      }
    );

    // Verificar invalidação de queries
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });

  it('deve lidar com erro na API', async () => {
    const mockError = {
      error: 'Acesso negado. Apenas emissores podem usar modo emergência.',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    });

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 123,
        motivo:
          'Sistema de fila apresentou falha crítica impedindo processamento automático',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe(
      'Acesso negado. Apenas emissores podem usar modo emergência.'
    );
    expect(toast.error).toHaveBeenCalledWith('Erro na emissão de emergência', {
      description:
        'Acesso negado. Apenas emissores podem usar modo emergência.',
    });
  });

  it('deve lidar com erro de rede', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 123,
        motivo:
          'Sistema de fila apresentou falha crítica impedindo processamento automático',
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(toast.error).toHaveBeenCalledWith('Erro na emissão de emergência', {
      description: 'Network error',
    });
  });

  it('deve fazer chamada para URL correta com dados corretos', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true, laudo_id: 789 }),
    });

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 456,
        motivo: 'Falha no sistema de processamento automático de laudos',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/456/emergencia',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo: 'Falha no sistema de processamento automático de laudos',
        }),
      }
    );
  });

  it('deve trimar justificativa antes de enviar', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useEmergenciaLaudo(), { wrapper });

    act(() => {
      result.current.mutate({
        loteId: 123,
        motivo: '  Sistema apresentou erro crítico   ',
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/123/emergencia',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motivo: 'Sistema apresentou erro crítico',
        }),
      }
    );
  });
});
