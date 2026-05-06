/**
 * @file __tests__/hooks/useLiberarLoteEntidade.test.ts
 * Testes: useLiberarLoteEntidade Hook
 */

import { renderHook, act } from '@testing-library/react';
import { useLiberarLoteEntidade } from '@/lib/hooks/useLiberarLoteEntidade';

describe('useLiberarLoteEntidade Hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useLiberarLoteEntidade());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.errorModalOpen).toBe(false);
  });

  it('deve liberar lote com sucesso (múltiplas empresas)', async () => {
    const mockResponse = {
      success: true,
      message: 'Ciclos liberados com sucesso',
      loteIds: [1, 2, 3],
      total_liberados: 3,
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    let response;
    await act(async () => {
      response = await result.current.liberarLote({ empresaIds: [1, 2, 3] });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual(mockResponse);
    expect(response?.success).toBe(true);
  });

  it('deve lidar com erro de liberação', async () => {
    const mockError = {
      success: false,
      error: 'Falha ao liberar ciclo',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    let response;
    await act(async () => {
      response = await result.current.liberarLote({ empresaIds: [1] });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Falha ao liberar ciclo');
    expect(result.current.result).toBeNull();
    expect(response?.success).toBe(false);
  });

  it('deve abrir errorModal quando recebe erro da API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Ciclo já existe para algumas empresas',
      }),
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    expect(result.current.errorModalOpen).toBe(false);

    await act(async () => {
      await result.current.liberarLote({ empresaIds: [1, 2] });
    });

    expect(result.current.errorModalOpen).toBe(true);
    expect(result.current.error).toBe('Ciclo já existe para algumas empresas');
  });

  it('NÃO deve abrir errorModal quando liberação é bem-sucedida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        loteIds: [1, 2],
      }),
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    await act(async () => {
      await result.current.liberarLote({ empresaIds: [1, 2] });
    });

    expect(result.current.errorModalOpen).toBe(false);
  });

  it('deve fechar errorModal quando chamando closeErrorModal', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Erro genérico',
      }),
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    await act(async () => {
      await result.current.liberarLote({ empresaIds: [1] });
    });

    expect(result.current.errorModalOpen).toBe(true);

    act(() => {
      result.current.closeErrorModal();
    });

    expect(result.current.errorModalOpen).toBe(false);
  });

  it('deve abrir errorModal em caso de falha de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Falha na conexão'));

    const { result } = renderHook(() => useLiberarLoteEntidade());

    await act(async () => {
      await result.current.liberarLote({ empresaIds: [1] });
    });

    expect(result.current.errorModalOpen).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('deve enviar parâmetros corretos para API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    const params = { empresaIds: [1, 2, 3] };

    await act(async () => {
      await result.current.liberarLote(params);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/entidade/liberar-lote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  });

  it('deve resetar estado corretamente', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, loteIds: [1] }),
    });

    const { result } = renderHook(() => useLiberarLoteEntidade());

    await act(async () => {
      await result.current.liberarLote({ empresaIds: [1] });
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.errorModalOpen).toBe(false);
  });
});
