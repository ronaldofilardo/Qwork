import { renderHook, act, waitFor } from '@testing-library/react';
import { useLiberarLote } from '@/lib/hooks/useLiberarLote';

describe('useLiberarLote Hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('deve inicializar com estado padrão', () => {
    const { result } = renderHook(() => useLiberarLote());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('deve Iniciar Ciclo com sucesso', async () => {
    const mockResponse = {
      success: true,
      message: 'Lote liberado com sucesso',
      lote: {
        id: 1,
        numero_ordem: 1,
        titulo: 'Lote 1',
        tipo: 'completo',
        liberado_em: new Date().toISOString(),
      },
      estatisticas: {
        avaliacoesCreated: 10,
        totalFuncionarios: 10,
        empresa: 'Empresa Teste',
      },
      resumoInclusao: {
        funcionarios_novos: 5,
        indices_atrasados: 3,
        mais_de_1_ano_sem_avaliacao: 2,
        renovacoes_regulares: 0,
        prioridade_critica: 1,
        prioridade_alta: 2,
        mensagem:
          'Incluindo automaticamente: 3 funcionários com pendências prioritárias',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useLiberarLote());

    let response;
    await act(async () => {
      response = await result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual(mockResponse);
    expect(response).toEqual(mockResponse);
  });

  it('deve lidar com erro de liberação', async () => {
    const mockError = {
      success: false,
      error: 'Erro ao Iniciar Ciclo',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mockError,
    });

    const { result } = renderHook(() => useLiberarLote());

    let response;
    await act(async () => {
      response = await result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Erro ao Iniciar Ciclo');
    expect(result.current.errorCode).toBeNull();
    expect(result.current.errorHint).toBeNull();
    expect(result.current.result).toBeNull();
    expect(response?.success).toBe(false);
  });

  it('deve expor codigo e hint ao receber erro de permissão de clínica', async () => {
    const mock403 = {
      success: false,
      error: 'Acesso negado',
      error_code: 'permission_clinic_mismatch',
      hint: 'Verifique a clínica do seu usuário e tente novamente',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => mock403,
    });

    const { result } = renderHook(() => useLiberarLote());

    let response;
    await act(async () => {
      response = await result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Acesso negado');
    expect(result.current.errorCode).toBe('permission_clinic_mismatch');
    expect(result.current.errorHint).toBe(
      'Verifique a clínica do seu usuário e tente novamente'
    );
    expect(result.current.result).toBeNull();
    expect(response.error_code).toBe('permission_clinic_mismatch');
  });

  it('deve lidar com erro de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Network error')
    );

    const { result } = renderHook(() => useLiberarLote());

    await act(async () => {
      await result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.result).toBeNull();
  });

  it('deve resetar estado corretamente', async () => {
    const mockResponse = {
      success: true,
      lote: {
        id: 1,
        numero_ordem: 1,
        titulo: 'Lote 1',
        tipo: 'completo',
        liberado_em: new Date().toISOString(),
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useLiberarLote());

    await act(async () => {
      await result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toBeNull();
  });

  it('deve enviar parâmetros corretos para API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() => useLiberarLote());

    const params = {
      empresaId: 123,
      titulo: 'Lote Teste',
      descricao: 'Descrição do lote',
      tipo: 'operacional' as const,
      dataFiltro: '2026-01-01',
    };

    await act(async () => {
      await result.current.liberarLote(params);
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/rh/liberar-lote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });
  });

  it('deve definir loading como true durante a requisição', async () => {
    let resolvePromise: any;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useLiberarLote());

    act(() => {
      result.current.liberarLote({
        empresaId: 1,
        tipo: 'completo',
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(true);
    });

    resolvePromise({
      ok: true,
      json: async () => ({ success: true }),
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });
});

