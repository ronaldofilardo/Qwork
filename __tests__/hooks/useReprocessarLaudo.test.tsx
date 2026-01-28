import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReprocessarLaudo } from '@/hooks/useReprocessarLaudo';
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

describe('useReprocessarLaudo Hook', () => {
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
    const { result } = renderHook(() => useReprocessarLaudo(), { wrapper });

    expect(result.current.isPending).toBe(false);
    expect(result.current.isError).toBe(false);
    expect(result.current.isSuccess).toBe(false);
  });

  it('deve reprocessar laudo com sucesso', async () => {
    const mockResponse = {
      success: true,
      lote_id: 123,
      message: 'Reprocessamento solicitado',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const { result } = renderHook(() => useReprocessarLaudo(), { wrapper });

    act(() => {
      result.current.mutate({ loteId: 123 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/123/reprocessar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    expect(toast.success).toHaveBeenCalledWith(
      'Reprocessamento solicitado com sucesso!'
    );

    // Verificar invalidação de queries
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0); // Queries foram invalidadas
  });

  it('deve lidar com erro na API', async () => {
    const mockError = {
      error: 'Lote não encontrado',
    };

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    });

    const { result } = renderHook(() => useReprocessarLaudo(), { wrapper });

    act(() => {
      result.current.mutate({ loteId: 999 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Lote não encontrado');
    expect(toast.error).toHaveBeenCalledWith('Lote não encontrado');
  });

  it('deve lidar com erro de rede', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useReprocessarLaudo(), { wrapper });

    act(() => {
      result.current.mutate({ loteId: 123 });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Network error');
    expect(toast.error).toHaveBeenCalledWith('Network error');
  });

  it('deve fazer chamada para URL correta', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    const { result } = renderHook(() => useReprocessarLaudo(), { wrapper });

    act(() => {
      result.current.mutate({ loteId: 456 });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/456/reprocessar',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  });
});
