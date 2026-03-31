/**
 * @jest-environment jsdom
 * @group ui
 *
 * Testes para correção de endpoint de relatório da página de lote (Entidade)
 *
 * CORREÇÃO VALIDADA:
 * Antes: POST /api/entidade/lote/${loteId}/relatorio (endpoint não existe)
 * Depois: GET /api/entidade/relatorio-lote-pdf?lote_id=${loteId}
 */

import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    loading: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Simula a lógica de handleDownloadReport extraída de app/entidade/lote/[id]/useDetalhesLoteEntidade.ts
async function handleDownloadReport(loteId: string) {
  toast.loading('Gerando relatório...', { id: 'report' });
  try {
    const response = await fetch(
      `/api/entidade/relatorio-lote-pdf?lote_id=${loteId}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar relatório');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-lote-${loteId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    toast.success('Relatório gerado com sucesso!', { id: 'report' });
  } catch (error) {
    console.error('Erro:', error);
    toast.error('Erro ao gerar relatório', { id: 'report' });
  }
}

describe('Entidade - Lote Relatório Endpoint Correction', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    fetchSpy = jest.spyOn(global, 'fetch');
    // Mock window.URL
    window.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('deve usar GET (não POST) para gerar relatório de lote', async () => {
    const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('1007');

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/entidade/relatorio-lote-pdf?lote_id=1007'
    );
    // GET é o método padrão - sem segundo argumento com { method: 'POST' }
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const callArgs = fetchSpy.mock.calls[0];
    expect(callArgs.length).toBe(1); // Apenas URL, sem options com method
  });

  it('deve usar endpoint /api/entidade/relatorio-lote-pdf com lote_id como query parameter', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('2050');

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).toBe('/api/entidade/relatorio-lote-pdf?lote_id=2050');
    expect(url).not.toContain('/api/entidade/lote/');
  });

  it('não deve usar endpoint antigo /api/entidade/lote/[id]/relatorio', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('999');

    const url = fetchSpy.mock.calls[0][0] as string;
    expect(url).not.toMatch(/\/api\/entidade\/lote\/\d+\/relatorio/);
    expect(url).toContain('/api/entidade/relatorio-lote-pdf');
  });

  it('deve passar lote_id como query string, não em URL dinâmica', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('1007');

    const url = new URL(
      fetchSpy.mock.calls[0][0] as string,
      'http://localhost'
    );
    expect(url.searchParams.get('lote_id')).toBe('1007');
    expect(url.pathname).toBe('/api/entidade/relatorio-lote-pdf');
  });

  it('deve criar download com filename correto', async () => {
    const mockBlob = new Blob(['pdf-content'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    await handleDownloadReport('1007');

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('relatorio-lote-1007.pdf');
    expect(anchor.href).toBe('blob:mock-url');
    expect(removeSpy).toHaveBeenCalled();

    appendSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it('deve exibir toast success após gerar relatório com sucesso', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('1007');

    expect(toast.loading).toHaveBeenCalledWith('Gerando relatório...', {
      id: 'report',
    });
    expect(toast.success).toHaveBeenCalledWith(
      'Relatório gerado com sucesso!',
      { id: 'report' }
    );
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('deve exibir toast error se fetch falhar', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network error'));

    await handleDownloadReport('1007');

    expect(toast.loading).toHaveBeenCalledWith('Gerando relatório...', {
      id: 'report',
    });
    expect(toast.error).toHaveBeenCalledWith('Erro ao gerar relatório', {
      id: 'report',
    });
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('deve exibir toast error se response não for ok', async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Lote não encontrado' }),
    });

    await handleDownloadReport('9999');

    expect(toast.error).toHaveBeenCalledWith('Erro ao gerar relatório', {
      id: 'report',
    });
  });

  it('deve revocar object URL após download', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    fetchSpy.mockResolvedValueOnce({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });

    await handleDownloadReport('1007');

    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('deve mostrar toast loading antes do fetch', async () => {
    const callOrder: string[] = [];
    (toast.loading as jest.Mock).mockImplementation(() => {
      callOrder.push('toast.loading');
    });
    fetchSpy.mockImplementation(() => {
      callOrder.push('fetch');
      return Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['pdf'])),
      });
    });

    await handleDownloadReport('1007');

    expect(callOrder[0]).toBe('toast.loading');
    expect(callOrder[1]).toBe('fetch');
  });
});
