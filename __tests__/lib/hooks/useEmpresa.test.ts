import { renderHook, waitFor } from '@testing-library/react';
import { useEmpresa } from '@/lib/hooks/useEmpresa';

// Mock do fetch global
global.fetch = jest.fn();

describe('useEmpresa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar dados da empresa com sucesso', async () => {
    const mockEmpresa = {
      id: 1,
      nome: 'Empresa Teste',
      cnpj: '12345678000190',
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockEmpresa],
    });

    const { result } = renderHook(() => useEmpresa('1'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.empresa).toEqual(mockEmpresa);
    expect(result.current.error).toBeNull();
  });

  it('deve retornar erro quando empresa não for encontrada', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { result } = renderHook(() => useEmpresa('999'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.empresa).toBeNull();
    expect(result.current.error).toBe('Empresa não encontrada');
  });

  it('deve tratar erro de rede', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Erro de rede')
    );

    const { result } = renderHook(() => useEmpresa('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.empresa).toBeNull();
    expect(result.current.error).toBe('Erro de rede');
  });

  it('deve permitir recarregar dados com refetch', async () => {
    const mockEmpresa = {
      id: 1,
      nome: 'Empresa Teste',
      cnpj: '12345678000190',
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => [mockEmpresa],
    });

    const { result } = renderHook(() => useEmpresa('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Limpar mock e configurar nova resposta
    jest.clearAllMocks();
    const mockEmpresaAtualizada = {
      ...mockEmpresa,
      nome: 'Empresa Atualizada',
    };
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockEmpresaAtualizada],
    });

    // Chamar refetch
    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.empresa?.nome).toBe('Empresa Atualizada');
    });
  });
});
