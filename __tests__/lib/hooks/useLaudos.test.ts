import { renderHook, act, waitFor } from '@testing-library/react';
import { useLaudos } from '@/lib/hooks/useLaudos';

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useLaudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve inicializar com estado vazio', () => {
    const { result } = renderHook(() => useLaudos('123'));

    expect(result.current.laudos).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.downloadingLaudo).toBeNull();
  });

  it('deve carregar laudos com sucesso', async () => {
    const mockLaudos = [
      {
        id: 1,
        lote_id: 1,
        codigo: 'LAU-001',
        titulo: 'Laudo Janeiro',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        emissor_nome: 'Dr. João',
        enviado_em: '2024-01-20T10:00:00Z',
        hash: 'abc123',
      },
    ];

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ laudos: mockLaudos }),
    });

    const { result } = renderHook(() => useLaudos('123'));

    act(() => {
      result.current.fetchLaudos();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.laudos).toEqual(mockLaudos);
    expect(result.current.error).toBeNull();
  });

  it('deve definir erro quando falha ao carregar laudos', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
    });

    const { result } = renderHook(() => useLaudos('123'));

    act(() => {
      result.current.fetchLaudos();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.laudos).toEqual([]);
    expect(result.current.error).toBe('Erro ao carregar laudos');
  });

  it('deve iniciar download de laudo', () => {
    const mockLaudo = {
      id: 1,
      lote_id: 1,
      codigo: 'LAU-001',
      titulo: 'Laudo Teste',
      empresa_nome: 'Empresa Teste',
      clinica_nome: 'Clínica Teste',
      emissor_nome: 'Dr. João',
      enviado_em: '2024-01-20T10:00:00Z',
      hash: 'abc123',
    };

    // Mock para evitar erros de DOM
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({ 'content-type': 'application/pdf' }),
      blob: () => Promise.resolve(new Blob()),
    });

    const { result } = renderHook(() => useLaudos('123'));

    act(() => {
      result.current.handleDownloadLaudo(mockLaudo);
    });

    // Verifica que o estado de downloading foi definido
    expect(result.current.downloadingLaudo).toBe(1);
  });
});
