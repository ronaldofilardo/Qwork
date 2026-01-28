import { renderHook, waitFor, act } from '@testing-library/react';
import { useFuncionarios } from '@/lib/hooks/useFuncionarios';

global.fetch = jest.fn();
global.confirm = jest.fn();

describe('useFuncionarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.confirm as jest.Mock).mockReturnValue(true);
  });

  const mockFuncionarios = [
    {
      cpf: '12345678900',
      nome: 'João Silva',
      setor: 'TI',
      funcao: 'Desenvolvedor',
      email: 'joao@example.com',
      matricula: '001',
      nivel_cargo: 'operacional' as const,
      turno: 'manhã',
      escala: '8x5',
      empresa_nome: 'Empresa Teste',
      ativo: true,
      data_inclusao: '2024-01-01',
      criado_em: '2024-01-01',
      atualizado_em: '2024-01-01',
    },
  ];

  it('deve carregar funcionários para perfil RH', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ funcionarios: mockFuncionarios }),
    });

    const { result } = renderHook(() => useFuncionarios('1', 'rh'));

    act(() => {
      result.current.fetchFuncionarios();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.funcionarios).toEqual(mockFuncionarios);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/rh/funcionarios?empresa_id=1'
    );
  });

  it('deve carregar funcionários para perfil admin', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ funcionarios: mockFuncionarios }),
    });

    const { result } = renderHook(() => useFuncionarios('1', 'admin'));

    act(() => {
      result.current.fetchFuncionarios();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/admin/funcionarios?empresa_id=1'
    );
  });

  it('deve atualizar status do funcionário com sucesso', async () => {
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ funcionarios: mockFuncionarios }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    const { result } = renderHook(() => useFuncionarios('1', 'rh'));

    await act(async () => {
      await result.current.fetchFuncionarios();
    });

    const sucesso = await act(async () => {
      return await result.current.atualizarStatusFuncionario(
        '12345678900',
        false
      );
    });

    expect(sucesso).toBe(true);
    expect(global.confirm).toHaveBeenCalled();
    expect(result.current.funcionarios[0].ativo).toBe(false);
  });

  it('não deve atualizar se usuário cancelar confirmação', async () => {
    (global.confirm as jest.Mock).mockReturnValueOnce(false);

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ funcionarios: mockFuncionarios }),
    });

    const { result } = renderHook(() => useFuncionarios('1', 'rh'));

    await act(async () => {
      await result.current.fetchFuncionarios();
    });

    const sucesso = await act(async () => {
      return await result.current.atualizarStatusFuncionario(
        '12345678900',
        false
      );
    });

    expect(sucesso).toBe(false);
    expect(result.current.funcionarios[0].ativo).toBe(true);
  });

  it('deve tratar erro ao atualizar status', async () => {
    const alertMock = jest.spyOn(window, 'alert').mockImplementation();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ funcionarios: mockFuncionarios }),
      })
      .mockRejectedValueOnce(new Error('Erro de rede'));

    const { result } = renderHook(() => useFuncionarios('1', 'rh'));

    await act(async () => {
      await result.current.fetchFuncionarios();
    });

    const sucesso = await act(async () => {
      return await result.current.atualizarStatusFuncionario(
        '12345678900',
        false
      );
    });

    expect(sucesso).toBe(false);
    expect(alertMock).toHaveBeenCalled();

    alertMock.mockRestore();
  });
});
