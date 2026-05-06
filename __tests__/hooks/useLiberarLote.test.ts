/**
 * @file __tests__/hooks/useLiberarLote.test.ts
 * Testes: useLiberarLote Hook
 */

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
      loteId: 1,
      numero_ordem: 1,
      liberado_em: new Date().toISOString(),
      avaliacoes_criadas: 10,
      total_funcionarios: 10,
      estatisticas: {
        avaliacoesCreated: 10,
        totalFuncionarios: 10,
        empresa: 'Empresa Teste',
      },
      resumo_inclusao: {
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
      response = await result.current.liberarLote({ empresaId: 1 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.result).toEqual(mockResponse);
    expect(response).toEqual(mockResponse);
    // Verificar campos do novo formato flat
    expect(response?.loteId).toBe(1);
    expect(response?.numero_ordem).toBe(1);
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
      response = await result.current.liberarLote({ empresaId: 1 });
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
      response = await result.current.liberarLote({ empresaId: 1 });
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
      await result.current.liberarLote({ empresaId: 1 });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error');
    expect(result.current.result).toBeNull();
  });

  it('deve resetar estado corretamente', async () => {
    const mockResponse = {
      success: true,
      loteId: 1,
      numero_ordem: 1,
      liberado_em: new Date().toISOString(),
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useLiberarLote());

    await act(async () => {
      await result.current.liberarLote({ empresaId: 1 });
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
      descricao: 'Descrição do lote',
      tipo: 'operacional',
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
      result.current.liberarLote({ empresaId: 1 });
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

  // === TESTES PARA ERROR MODAL ===
  it('deve abrir errorModal quando recebe erro da API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Ciclo já existe para esta empresa',
      }),
    });

    const { result } = renderHook(() => useLiberarLote());

    // Estado inicial
    expect(result.current.errorModalOpen).toBe(false);

    await act(async () => {
      await result.current.liberarLote({ empresaId: 1 });
    });

    // Modal deve abrir quando há erro
    expect(result.current.errorModalOpen).toBe(true);
    expect(result.current.error).toBe('Ciclo já existe para esta empresa');
  });

  it('NÃO deve abrir errorModal quando liberação é bem-sucedida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        loteId: 123,
      }),
    });

    const { result } = renderHook(() => useLiberarLote());

    await act(async () => {
      await result.current.liberarLote({ empresaId: 1 });
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

    const { result } = renderHook(() => useLiberarLote());

    // Abre modal
    await act(async () => {
      await result.current.liberarLote({ empresaId: 1 });
    });

    expect(result.current.errorModalOpen).toBe(true);

    // Fecha modal
    act(() => {
      result.current.closeErrorModal();
    });

    expect(result.current.errorModalOpen).toBe(false);
  });

  it('deve abrir errorModal em caso de falha de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Falha na conexão'));

    const { result } = renderHook(() => useLiberarLote());

    await act(async () => {
      await result.current.liberarLote({ empresaId: 1 });
    });

    expect(result.current.errorModalOpen).toBe(true);
    expect(result.current.error).toBeTruthy();
  });
});


