/**
 * Testes para hook useLaudo
 *
 * Funcionalidades testadas:
 * 1. Buscar laudo com numero_ordem
 * 2. Gerenciar estado de loading
 * 3. Tratamento de erros
 * 4. Gerar laudo
 * 5. Download de laudo
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import { useLaudo } from '@/app/emissor/laudo/[loteId]/useLaudo';
import toast from 'react-hot-toast';
import type { LaudoPadronizado } from '@/lib/laudo-tipos';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));
jest.mock('react-hot-toast');

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock global fetch
global.fetch = jest.fn();

// Setup URL mocks for jsdom (createObjectURL/revokeObjectURL not available by default)
beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    value: jest.fn(),
    writable: true,
    configurable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: jest.fn(),
    writable: true,
    configurable: true,
  });
});

describe('useLaudo', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockLoteData = {
    id: 1,
    empresa_nome: 'Empresa A',
    clinica_nome: 'Clínica A',
    numero_ordem: 5,
  };

  const mockLaudoPadronizado: LaudoPadronizado = {
    etapa1: { empresaAvaliada: { nome: 'Empresa A', cnpj: '12345678000195' } },
    etapa2: [{ grupo: 1, valor: 75 }],
    etapa3: {},
    etapa4: {
      observacoesLaudo: 'Obs',
      textoConclusao: 'Conclusão',
      dataEmissao: '09/04/2026',
      assinatura: { nome: 'Coordenador' },
    },
    observacoesEmissor: null,
    status: 'emitido',
    criadoEm: '2026-04-09T10:00:00Z',
    emitidoEm: null,
    enviadoEm: null,
    hashPdf: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
    mockUseRouter.mockReturnValue(mockRouter as any);
    mockUseParams.mockReturnValue({ loteId: '1' } as any);
    mockToast.error = jest.fn();
    mockToast.success = jest.fn();
    mockToast.loading = jest.fn();
    mockToast.dismiss = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve carregar laudo com sucesso e incluir numero_ordem', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: mockLoteData,
        laudoPadronizado: mockLaudoPadronizado,
        previa: false,
        mensagem: null,
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lote).toEqual(mockLoteData);
    expect(result.current.lote?.numero_ordem).toBe(5);
    expect(result.current.laudoPadronizado).toEqual(mockLaudoPadronizado);
    expect(result.current.isPrevia).toBe(false);
  });

  it('deve tratar erro ao buscar laudo', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        success: false,
        error: 'Erro ao carregar laudo',
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockToast.error).toHaveBeenCalled();
    expect(mockRouter.push).toHaveBeenCalledWith('/emissor');
  });

  it('deve tratar erro de conexão', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockToast.error).toHaveBeenCalledWith(
      'Erro ao conectar com o servidor'
    );
    expect(mockRouter.push).toHaveBeenCalledWith('/emissor');
  });

  it('deve gerar laudo com sucesso', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

    // Primeiro fetch para carregar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: mockLoteData,
        laudoPadronizado: mockLaudoPadronizado,
        previa: true,
        mensagem: 'Preview do laudo',
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Segundo fetch para gerar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        laudo_id: 42,
      }),
    } as any);

    await act(async () => {
      await result.current.handleGerarLaudo();
    });

    expect(mockToast.success).toHaveBeenCalledWith('Laudo gerado com sucesso!');
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/emissor/laudos/1',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('deve tratar erro ao gerar laudo', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

    // Primeiro fetch para carregar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: mockLoteData,
        laudoPadronizado: mockLaudoPadronizado,
        previa: true,
        mensagem: 'Preview',
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Segundo fetch para gerar com erro
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({
        success: false,
        error: 'Erro ao gerar laudo',
      }),
    } as any);

    await act(async () => {
      await result.current.handleGerarLaudo();
    });

    expect(mockToast.error).toHaveBeenCalledWith('Erro ao gerar laudo');
  });

  it('deve fazer download de laudo com sucesso', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;

    // Primeiro fetch para carregar
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: mockLoteData,
        laudoPadronizado: mockLaudoPadronizado,
        previa: false,
        mensagem: null,
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock do download
    const mockBlob = new Blob(['PDF content']);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      blob: jest.fn().mockResolvedValueOnce(mockBlob),
    } as any);

    // Mock do URL.createObjectURL e revokeObjectURL
    const createObjectURL = jest.spyOn(URL, 'createObjectURL');
    const revokeObjectURL = jest.spyOn(URL, 'revokeObjectURL');

    createObjectURL.mockReturnValue('blob:http://localhost/mock-url');

    // Mock do document operations
    const mockLink = document.createElement('a');
    const createElementSpy = jest
      .spyOn(document, 'createElement')
      .mockReturnValue(mockLink);
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    await act(async () => {
      await result.current.handleDownloadLaudo();
    });

    expect(mockToast.success).toHaveBeenCalledWith('Laudo baixado com sucesso');

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
  });

  it('deve conter numero_ordem na interface Lote', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: {
          id: 1,
          empresa_nome: 'Empresa A',
          clinica_nome: 'Clínica A',
          numero_ordem: 10,
        },
        laudoPadronizado: mockLaudoPadronizado,
        previa: false,
        mensagem: null,
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.lote?.numero_ordem).toBe(10);
  });

  it('deve definir isPrevia corretamente', async () => {
    const mockFetch = global.fetch as jest.MockedFunction<typeof global.fetch>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({
        success: true,
        lote: mockLoteData,
        laudoPadronizado: mockLaudoPadronizado,
        previa: true,
        mensagem: 'Preview do laudo - clique em "Gerar Laudo" para emitir',
      }),
    } as any);

    const { result } = renderHook(() => useLaudo());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isPrevia).toBe(true);
    expect(result.current.mensagem).toContain('Preview');
  });
});
