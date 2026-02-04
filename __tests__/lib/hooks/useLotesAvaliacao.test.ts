import { renderHook, waitFor, act } from '@testing-library/react';
import { useLotesAvaliacao } from '@/lib/hooks/useLotesAvaliacao';

global.fetch = jest.fn();

describe('useLotesAvaliacao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockLotes = [
    {
      id: 1,
      /* codigo removido */
      titulo: 'Lote Teste',
      tipo: 'periodico',
      liberado_em: '2024-01-01',
      status: 'ativo',
      total_avaliacoes: 10,
      avaliacoes_concluidas: 5,
      avaliacoes_inativadas: 1,
    },
  ];

  it('deve carregar lotes com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lotes: mockLotes }),
    });

    const { result } = renderHook(() => useLotesAvaliacao('1'));

    await act(async () => {
      await result.current.fetchLotes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lotes).toEqual(mockLotes);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/rh/lotes?empresa_id=1');
  });

  it('deve tratar resposta com array vazio', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lotes: [] }),
    });

    const { result } = renderHook(() => useLotesAvaliacao('1'));

    await act(async () => {
      await result.current.fetchLotes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lotes).toEqual([]);
  });

  it('deve tratar erro de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Erro de rede')
    );

    const { result } = renderHook(() => useLotesAvaliacao('1'));

    await act(async () => {
      await result.current.fetchLotes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lotes).toEqual([]);
    expect(result.current.error).toBe('Erro de rede');
  });

  it('deve expor hint quando 403 permission_clinic_mismatch', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({
        success: false,
        error: 'Acesso negado',
        error_code: 'permission_clinic_mismatch',
        hint: 'Verifique a clínica do seu usuário',
      }),
    });

    const { result } = renderHook(() => useLotesAvaliacao('1'));

    await act(async () => {
      await result.current.fetchLotes();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Acesso negado');
    expect(result.current.errorCode).toBe('permission_clinic_mismatch');
    expect(result.current.errorHint).toBe('Verifique a clínica do seu usuário');
    expect(result.current.lotes).toEqual([]);
  });

  it('deve permitir atualizar lista de lotes manualmente', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ lotes: mockLotes }),
    });

    const { result } = renderHook(() => useLotesAvaliacao('1'));

    await act(async () => {
      await result.current.fetchLotes();
    });

    const novosLotes = [
      ...mockLotes,
      { ...mockLotes[0], id: 2 },
    ];

    act(() => {
      result.current.setLotes(novosLotes);
    });

    expect(result.current.lotes).toEqual(novosLotes);
  });
});
