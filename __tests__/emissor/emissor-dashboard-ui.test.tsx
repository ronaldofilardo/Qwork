/**
 * @file __tests__/emissor/emissor-dashboard-ui.test.tsx
 * Testes: Emissor Dashboard UI
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: jest.fn(() => ({
    canInstall: false,
    handleInstallClick: jest.fn(),
    dismissPrompt: jest.fn(),
  })),
}));

jest.mock('react-hot-toast', () => ({
  error: jest.fn(),
  success: jest.fn(),
}));

jest.mock('@/components/UploadLaudoButton', () => {
  return function MockUploadLaudoButton() {
    return <div data-testid="upload-laudo-button" />;
  };
});

import EmissorDashboard from '@/app/emissor/page';
import { QueryClientProvider } from '@/components/QueryClientProvider';

// ---- Fixture helpers ----

function makeLote(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    titulo: 'Lote 1',
    tipo: 'completo',
    status: 'concluido',
    empresa_nome: 'Empresa X',
    clinica_nome: 'Clinica Y',
    liberado_em: new Date().toISOString(),
    total_avaliacoes: 10,
    taxa_conclusao: 100,
    solicitado_por: null,
    solicitado_em: null,
    laudo: null,
    ...overrides,
  };
}

function mockFetch(lotes: ReturnType<typeof makeLote>[]) {
  (global.fetch as jest.Mock).mockImplementation((url: string) => {
    if (url.includes('/api/emissor/lotes')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          lotes,
          total: lotes.length,
          page: 1,
          limit: 20,
        }),
      } as Response);
    }
    if (url.includes('/api/emissor/laudos') && url.includes('/download')) {
      return Promise.resolve({
        ok: true,
        headers: { get: (k: string) => (k === 'content-type' ? 'application/pdf' : null) },
        blob: async () => new Blob(['%PDF'], { type: 'application/pdf' }),
      } as any);
    }
    return Promise.resolve({ ok: false } as Response);
  });
}

function renderDashboard() {
  return render(
    <QueryClientProvider>
      <EmissorDashboard />
    </QueryClientProvider>
  );
}

// ---- Tests ----

describe('Emissor Dashboard UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  it('mostra laudo emitido na aba Laudo Emitido com dados do emissor e hash', async () => {
    mockFetch([
      makeLote({
        laudo: {
          id: 100,
          status: 'emitido',
          emitido_em: '2026-01-31T12:00:00Z',
          enviado_em: null,
          hash_pdf: 'def456',
          emissor_nome: 'Dra. Maria',
          _emitido: true,
          _aguardandoAssinatura: false,
        },
      }),
    ]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /laudo emitido/i }));

    await waitFor(() => {
      expect(
        screen.getByText('Laudo de Identificação e Mapeamento de Riscos Psicossociais (NR-1 / GRO)')
      ).toBeInTheDocument();
      expect(screen.getByText('Emissor: Dra. Maria')).toBeInTheDocument();
      expect(screen.getByText('def456')).toBeInTheDocument();
    });
  });

  it('lote com laudo pdf_gerado (_emitido:true) aparece em Laudo Emitido, NÃO em Para Emitir', async () => {
    mockFetch([
      makeLote({
        id: 8,
        laudo: {
          id: 200,
          status: 'pdf_gerado',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
          emissor_nome: 'Dr. João',
          _emitido: true,
        },
      }),
    ]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    // Aba "Para Emitir" (padrão) — lote 8 NÃO deve aparecer (laudo já emitido)
    expect(screen.queryByText('Lote ID: 8')).not.toBeInTheDocument();

    // Muda para "Laudo Emitido" — lote 8 DEVE aparecer
    fireEvent.click(screen.getByRole('button', { name: /laudo emitido/i }));
    await waitFor(() => {
      expect(screen.getByText('Lote ID: 8')).toBeInTheDocument();
    });
  });

  it('lote com laudo pdf_gerado mostra UploadLaudoButton na aba Laudo Emitido', async () => {
    mockFetch([
      makeLote({
        id: 8,
        laudo: {
          id: 200,
          status: 'pdf_gerado',
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
          emissor_nome: 'Dr. João',
          _emitido: true,
          arquivo_remoto_key: null,
        },
      }),
    ]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: /laudo emitido/i }));
    await waitFor(() => {
      expect(screen.getByTestId('upload-laudo-button')).toBeInTheDocument();
    });
  });

  it('filtro por ID do lote mostra somente o lote correspondente', async () => {
    mockFetch([
      makeLote({ id: 5, empresa_nome: 'Empresa Alpha', laudo: null }),
      makeLote({ id: 12, empresa_nome: 'Empresa Beta', laudo: null }),
    ]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    // Ambos visíveis inicialmente
    expect(screen.getByText('Lote ID: 5')).toBeInTheDocument();
    expect(screen.getByText('Lote ID: 12')).toBeInTheDocument();

    // Digitar "5" no filtro
    const input = screen.getByPlaceholderText(/ID do lote/i);
    fireEvent.change(input, { target: { value: '5' } });

    await waitFor(() => {
      expect(screen.getByText('Lote ID: 5')).toBeInTheDocument();
      expect(screen.queryByText('Lote ID: 12')).not.toBeInTheDocument();
    });
  });

  it('trocar de aba reseta o filtro de ID', async () => {
    mockFetch([
      makeLote({ id: 5, empresa_nome: 'Empresa Alpha', laudo: null }),
      makeLote({ id: 12, empresa_nome: 'Empresa Beta', laudo: null }),
    ]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    const input = screen.getByPlaceholderText(/ID do lote/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: '5' } });
    expect(input.value).toBe('5');

    // Trocar para Laudos Enviados e voltar deve resetar o filtro
    fireEvent.click(screen.getByRole('button', { name: /laudos enviados/i }));
    fireEvent.click(screen.getByRole('button', { name: /para emitir/i }));

    await waitFor(() => {
      const inputAfter = screen.getByPlaceholderText(/ID do lote/i) as HTMLInputElement;
      expect(inputAfter.value).toBe('');
    });
  });

  it('não roda polling automático — fetch é chamado apenas uma vez no mount', async () => {
    jest.useFakeTimers();
    mockFetch([makeLote({ laudo: null })]);

    renderDashboard();
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    const callsBefore = (global.fetch as jest.Mock).mock.calls.length;

    // Avançar 60 segundos (2x o antigo intervalo de 30s)
    jest.advanceTimersByTime(60000);

    expect((global.fetch as jest.Mock).mock.calls.length).toBe(callsBefore);

    jest.useRealTimers();
  });
});
