import { renderHook, waitFor, act } from '@testing-library/react';
import { useAnomalias } from '@/lib/hooks/useAnomalias';

global.fetch = jest.fn();

describe('useAnomalias', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAnomalias = [
    {
      cpf: '12345678900',
      nome: 'João Silva',
      setor: 'TI',
      indice_avaliacao: 0,
      data_ultimo_lote: null,
      dias_desde_ultima_avaliacao: null,
      total_inativacoes: 0,
      categoria_anomalia: 'NUNCA_AVALIADO',
      prioridade: 'MÉDIA' as const,
      mensagem: 'Funcionário nunca foi avaliado',
    },
    {
      cpf: '98765432100',
      nome: 'Maria Santos',
      setor: 'RH',
      indice_avaliacao: 1,
      data_ultimo_lote: '2022-01-01',
      dias_desde_ultima_avaliacao: 800,
      total_inativacoes: 0,
      categoria_anomalia: 'MAIS_DE_2_ANOS_SEM_AVALIACAO',
      prioridade: 'CRÍTICA' as const,
      mensagem: 'Mais de 2 anos sem avaliação',
    },
  ];

  it('deve carregar anomalias com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ anomalias: mockAnomalias }),
    });

    const { result } = renderHook(() => useAnomalias('1'));

    await act(async () => {
      await result.current.fetchAnomalias();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.anomalias).toEqual(mockAnomalias);
    expect(result.current.error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/rh/pendencias?empresa_id=1'
    );
  });

  it('deve filtrar anomalias por prioridade', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ anomalias: mockAnomalias }),
    });

    const { result } = renderHook(() => useAnomalias('1'));

    await act(async () => {
      await result.current.fetchAnomalias();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const criticas = result.current.anomalias.filter(
      (a) => a.prioridade === 'CRÍTICA'
    );
    expect(criticas.length).toBe(1);
    expect(criticas[0].nome).toBe('Maria Santos');
  });

  it('deve tratar erro ao carregar anomalias', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Erro ao carregar pendências')
    );

    const { result } = renderHook(() => useAnomalias('1'));

    await act(async () => {
      await result.current.fetchAnomalias();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.anomalias).toEqual([]);
    expect(result.current.error).toBe('Erro ao carregar pendências');
  });

  it('deve retornar array vazio quando não há anomalias', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ anomalias: [] }),
    });

    const { result } = renderHook(() => useAnomalias('1'));

    await act(async () => {
      await result.current.fetchAnomalias();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.anomalias).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});
