/**
 * @file __tests__/hooks/useOrgInfo.test.ts
 * Testes: useOrgInfo
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useOrgInfo } from '@/hooks/useOrgInfo';

global.fetch = jest.fn();

describe('useOrgInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar orgInfo com logo_url quando API responde com sucesso', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nome: 'Clínica Saúde',
        logo_url: 'data:image/png;base64,abc123',
        tipo: 'clinica',
      }),
    });

    const { result } = renderHook(() => useOrgInfo());

    expect(result.current.loading).toBe(true);
    expect(result.current.orgInfo).toBeNull();

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orgInfo).toEqual({
      nome: 'Clínica Saúde',
      logo_url: 'data:image/png;base64,abc123',
      tipo: 'clinica',
    });
    expect(global.fetch).toHaveBeenCalledWith('/api/dashboard/org-info');
  });

  it('deve retornar orgInfo null quando API retorna erro HTTP', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Não autenticado' }),
    });

    const { result } = renderHook(() => useOrgInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orgInfo).toBeNull();
  });

  it('deve retornar orgInfo null quando fetch lança exceção', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error('Erro de rede')
    );

    const { result } = renderHook(() => useOrgInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orgInfo).toBeNull();
  });

  it('deve retornar orgInfo para tipo entidade', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        nome: 'Entidade XYZ',
        logo_url: null,
        tipo: 'entidade',
      }),
    });

    const { result } = renderHook(() => useOrgInfo());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orgInfo).toEqual({
      nome: 'Entidade XYZ',
      logo_url: null,
      tipo: 'entidade',
    });
  });

  it('não deve buscar org-info quando o hook está desabilitado', async () => {
    const { result } = renderHook(() => useOrgInfo(false));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.orgInfo).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
