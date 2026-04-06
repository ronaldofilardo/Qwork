/**
 * Testes para o componente EmissorDashboard
 *
 * Funcionalidades testadas:
 * 1. Renderização inicial com loading
 * 2. Exibição de lotes quando carregados
 * 3. Tratamento de erro na API
 * 4. Botão de refresh
 * 5. Navegação para laudo
 * 6. Estados vazios
 */

import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmissorDashboard from '@/app/emissor/page';
import { renderWithQueryClient } from '../helpers/test-utils';

// Mock do useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do toast
jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

// Mock do hook usePWAInstall
jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: jest.fn(() => ({
    canInstall: false,
    handleInstallClick: jest.fn(),
    dismissPrompt: jest.fn(),
  })),
}));

// Mock do hook useReprocessarLaudo
jest.mock('@/hooks/useReprocessarLaudo', () => ({
  useReprocessarLaudo: jest.fn(() => ({
    reprocessar: jest.fn(),
    loading: false,
  })),
}));

// Mock do UploadLaudoButton
jest.mock('@/components/UploadLaudoButton', () => {
  return function MockUploadLaudoButton() {
    return null;
  };
});

// Mock do fetch - criar o mock ANTES de usar
global.fetch = jest.fn();

describe('Emissor Dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Resetar o mock do fetch para cada teste
    (global.fetch as jest.Mock).mockClear();
  });

  it('deve mostrar loading inicialmente', () => {
    (global.fetch as jest.Mock).mockImplementationOnce(
      () => new Promise(() => {}) // Nunca resolve
    );

    renderWithQueryClient(<EmissorDashboard />);

    expect(screen.getByText('Carregando lotes...')).toBeInTheDocument();
  });

  it('deve renderizar lotes quando API retorna sucesso', async () => {
    const mockLotes = [
      {
        id: 1,
        tipo: 'completo',
        status: 'concluido', // Matches default tab 'laudo-para-emitir'
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
        },
      },
    ];

    const mockJsonResponse = {
      success: true,
      lotes: mockLotes,
      total: 1,
      limit: 10,
    };

    const mockFetchImplementation = jest.fn(() => {
      // Mock fetch chamado!
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: () => {
          return Promise.resolve(mockJsonResponse);
        },
        headers: new Headers(),
        redirected: false,
        type: 'basic' as ResponseType,
        url: '',
        clone: function () {
          return this;
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve(''),
      } as Response);
    });

    (global.fetch as jest.Mock).mockImplementation(mockFetchImplementation);

    renderWithQueryClient(<EmissorDashboard />);

    // Debugging: verificar se fetch foi chamado
    console.log(
      'Fetch foi chamado?',
      mockFetchImplementation.mock.calls.length
    );

    await waitFor(
      () => {
        expect(screen.getByText('Lote ID: 1')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    expect(screen.getByText('Empresa Teste')).toBeInTheDocument();
    expect(screen.getByText('Clínica Teste')).toBeInTheDocument();
    expect(screen.getByText('Iniciar Laudo')).toBeInTheDocument();
  }, 15000);

  it('deve mostrar mensagem quando não há lotes', async () => {
    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          lotes: [],
          total: 0,
          limit: 10,
        }),
      } as Response)
    );

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(
          screen.getByText('Nenhum ciclo encontrado para esta categoria.')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('deve mostrar erro quando API falha', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(
          screen.getByText(/HTTP 500: Internal Server Error/)
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    expect(screen.getByText('Tentar Novamente')).toBeInTheDocument();
  }, 15000);

  it('deve navegar para laudo quando botão é clicado', async () => {
    const mockLotes = [
      {
        id: 123,
        tipo: 'completo',
        status: 'concluido',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Iniciar Laudo')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const button = screen.getByText('Iniciar Laudo');
    fireEvent.click(button);

    expect(mockPush).toHaveBeenCalledWith('/emissor/laudo/123');
  }, 15000);

  it('deve recarregar dados quando botão de refresh é clicado', async () => {
    const mockLotes = [
      {
        id: 1,
        tipo: 'completo',
        status: 'concluido',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Lote ID: 1')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Simular clique no botão de refresh
    const refreshButton = screen.getByText('Atualizar');
    fireEvent.click(refreshButton);

    // Verificar se fetch foi chamado novamente
    expect(global.fetch as jest.Mock).toHaveBeenCalledTimes(2);
  }, 15000);

  it('deve mostrar status do laudo corretamente', async () => {
    const mockLotes = [
      {
        id: 1,
        tipo: 'completo',
        status: 'concluido',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        liberado_em: '2025-11-29T10:00:00Z',
        laudo: {
          id: 100,
          observacoes: 'Observações do laudo',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      },
      {
        id: 2,
        tipo: 'completo',
        status: 'concluido',
        _emitido: true,
        empresa_nome: 'Empresa B',
        clinica_nome: 'Clínica B',
        liberado_em: '2025-11-29T11:00:00Z',
        laudo: {
          id: 101,
          observacoes: 'Laudo emitido',
          status: 'enviado',
          _emitido: true,
          emitido_em: '2025-11-30T10:00:00Z',
          enviado_em: null,
          hash_pdf: 'abc123def456',
        },
      },
    ];

    (global.fetch as jest.Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          lotes: mockLotes,
          total: 2,
          limit: 10,
        }),
      } as Response)
    );

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        // Lote 1 appears in default tab (concluido, not emitido)
        expect(screen.getByText('Lote ID: 1')).toBeInTheDocument();
        expect(screen.getByText('Iniciar Laudo')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('deve exibir previsão de emissão quando disponível', async () => {
    const mockLotes = [
      {
        id: 3,
        tipo: 'completo',
        status: 'concluido',
        empresa_nome: 'Empresa C',
        clinica_nome: 'Clínica C',
        liberado_em: '2025-12-16T12:00:00Z',
        previsao_emissao: {
          data: '2025-12-16T15:25:00Z',
          formatada: '16/12/2025 15:25',
        },
        emissao_automatica: true,
        laudo: {
          id: 102,
          observacoes: 'Laudo pendente',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Lote ID: 3')).toBeInTheDocument();
        expect(
          screen.getByText('Previsão de emissão: 16/12/2025 15:25')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
    // Para lotes com emissão automática e laudo não emitido, botão é Pré-visualização
    expect(screen.getByText('Pré-visualização')).toBeInTheDocument();
  }, 15000);

  it('deve mostrar botão de pré-visualização quando emissão automática programada', async () => {
    const mockLotes = [
      {
        id: 5,
        tipo: 'completo',
        status: 'concluido',
        empresa_nome: 'Empresa D',
        clinica_nome: 'Clínica D',
        liberado_em: '2025-12-16T12:00:00Z',
        emissao_automatica: true,
        laudo: {
          id: 105,
          observacoes: 'Laudo pendente',
          status: 'rascunho',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(
      () => {
        expect(screen.getByText('Lote ID: 5')).toBeInTheDocument();
        expect(screen.getByText('Pré-visualização')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('deve exibir hash do PDF para lotes finalizados com laudo enviado', async () => {
    const user = userEvent.setup();
    const mockLotes = [
      {
        id: 6,
        tipo: 'completo',
        status: 'finalizado',
        empresa_nome: 'Empresa E',
        clinica_nome: 'Clínica E',
        liberado_em: '2025-12-16T12:00:00Z',
        laudo: {
          id: 106,
          observacoes: 'Laudo enviado',
          status: 'enviado',
          _emitido: true,
          emitido_em: '2025-12-16T14:00:00Z',
          enviado_em: '2025-12-16T15:00:00Z',
          hash_pdf: 'hash123456789',
        },
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    // Click na aba 'Laudos Enviados' da sidebar para ver lote com enviado_em preenchido
    await waitFor(() => {
      const tabLaudosEnviados = screen.getByRole('button', { name: /laudos enviados/i });
      expect(tabLaudosEnviados).toBeInTheDocument();
    });
    const tabLaudosEnviados = screen.getByRole('button', { name: /laudos enviados/i });
    await user.click(tabLaudosEnviados);

    await waitFor(
      () => {
        expect(screen.getByText('Lote ID: 6')).toBeInTheDocument();
        // Hash section: "🔒 Hash de Integridade (SHA-256)"
        expect(screen.getByText(/Hash de Integridade/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );
  }, 15000);

  it.skip('deve fazer download do PDF quando botão "Ver Laudo/Baixar PDF" é clicado na aba Laudo Emitido', async () => {
    const user = userEvent.setup();
    const mockLotes = [
      {
        id: 7,
        tipo: 'completo',
        status: 'finalizado',
        empresa_nome: 'Empresa F',
        clinica_nome: 'Clínica F',
        liberado_em: '2025-12-16T12:00:00Z',
        laudo: {
          id: 107,
          observacoes: 'Laudo enviado',
          status: 'enviado',
          emitido_em: '2025-12-16T14:00:00Z',
          enviado_em: '2025-12-16T15:00:00Z',
          hash_pdf: 'hash987654321',
        },
      },
    ];

    // Mock para a API de lotes
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        lotes: mockLotes,
        total: 1,
      }),
    } as Response);

    // Mock para o download
    const mockBlob = new Blob(['fake pdf content'], {
      type: 'application/pdf',
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      blob: async () => mockBlob,
    } as Response);

    renderWithQueryClient(<EmissorDashboard />);

    // Click na aba 'Laudos Enviados' da sidebar para ver lote com enviado_em preenchido
    await waitFor(() => {
      const tabLaudosEnviados = screen.getByRole('button', { name: /laudos enviados/i });
      expect(tabLaudosEnviados).toBeInTheDocument();
    });
    const tabLaudosEnviados = screen.getByRole('button', { name: /laudos enviados/i });
    await user.click(tabLaudosEnviados);

    await waitFor(
      () => {
        expect(
          screen.getByText('Lote para Download - Lote: 007-161225')
        ).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Mock createObjectURL e outros - ANTES do clique
    const mockCreateObjectURL = jest.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = jest.fn();
    const mockClick = jest.fn();
    global.URL.createObjectURL = mockCreateObjectURL;
    global.URL.revokeObjectURL = mockRevokeObjectURL;
    const originalAppendChild = document.body.appendChild.bind(document.body);
    const originalRemoveChild = document.body.removeChild.bind(document.body);
    document.body.appendChild = jest.fn(originalAppendChild);
    document.body.removeChild = jest.fn(originalRemoveChild);
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
      style: {},
    };
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') return mockAnchor as any;
      return originalCreateElement(tagName);
    });

    // Aguardar botão aparecer e clicar
    await waitFor(
      () => {
        expect(screen.getByText('Ver Laudo/Baixar PDF')).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    const downloadButton = screen.getByText('Ver Laudo/Baixar PDF');
    await user.click(downloadButton);

    await waitFor(
      () => {
        expect(global.fetch as jest.Mock).toHaveBeenCalledWith(
          '/api/emissor/laudos/107/download'
        );
        expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(mockAnchor.download).toBe('laudo-007-161225.pdf');
        expect(mockClick).toHaveBeenCalled();
        expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
      },
      { timeout: 10000 }
    );
  }, 15000);

  it('deve exibir botão PWA quando canInstall é true', async () => {
    const mockHandleInstallClick = jest.fn();
    const { usePWAInstall } = require('@/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      canInstall: true,
      handleInstallClick: mockHandleInstallClick,
      dismissPrompt: jest.fn(),
    });

    const mockLotes = [];

    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          resolve({
            ok: true,
            json: async () => ({
              success: true,
              lotes: mockLotes,
              total: 0,
            }),
          })
        )
    );

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(() => {
      const installButton = screen.getByText('Instalar App');
      expect(installButton).toBeInTheDocument();
    });
  });

  it('não deve exibir botão PWA quando canInstall é false', async () => {
    const { usePWAInstall } = require('@/hooks/usePWAInstall');
    usePWAInstall.mockReturnValue({
      canInstall: false,
      handleInstallClick: jest.fn(),
      dismissPrompt: jest.fn(),
    });

    const mockLotes = [];

    (global.fetch as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          resolve({
            ok: true,
            json: async () => ({
              success: true,
              lotes: mockLotes,
              total: 0,
            }),
          })
        )
    );

    renderWithQueryClient(<EmissorDashboard />);

    await waitFor(() => {
      expect(screen.queryByText('Instalar App')).not.toBeInTheDocument();
    });
  });
});
