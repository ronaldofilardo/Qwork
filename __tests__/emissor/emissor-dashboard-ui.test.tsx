import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import EmissorDashboard from '@/app/emissor/page';
import { QueryClientProvider } from '@/components/QueryClientProvider';

describe('Emissor Dashboard UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/emissor/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            lotes: [
              {
                id: 1,
                titulo: 'Lote 1',
                tipo: 'completo',
                status: 'concluido',
                empresa_nome: 'Empresa X',
                clinica_nome: 'Clinica Y',
                liberado_em: new Date().toISOString(),
                total_avaliacoes: 10,
                modo_emergencia: false,
                solicitado_por: null,
                solicitado_em: null,
                laudo: {
                  id: 100,
                  status: 'emitido',
                  emitido_em: '2026-01-31T12:00:00Z',
                  enviado_em: null,
                  hash_pdf: 'def456',
                  emissor_nome: 'Dra. Maria',
                  _emitido: true,
                },
                pode_emitir_laudo: false,
                motivos_bloqueio: [],
                taxa_conclusao: 100,
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
          }),
        } as Response);
      }

      if (url.includes('/api/emissor/laudos/1/download')) {
        // Simulate PDF response
        return Promise.resolve({
          ok: true,
          headers: {
            get: (k: string) =>
              k === 'content-type' ? 'application/pdf' : null,
          },
          blob: async () => new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
        } as any);
      }

      return Promise.resolve({ ok: false } as Response);
    });
  });

  it('mostra botão Laudo Psicossocial e dados do emissor quando laudo emitido', async () => {
    render(
      <QueryClientProvider>
        <EmissorDashboard />
      </QueryClientProvider>
    );

    // Wait for loading to finish, then switch to tab 'Laudo Emitido' where lotes emitidos aparecem
    await waitFor(() =>
      expect(screen.queryByText('Carregando lotes...')).not.toBeInTheDocument()
    );

    fireEvent.click(screen.getByText('✅ Laudo Emitido'));

    await waitFor(() => {
      expect(screen.getByText('Laudo Psicossocial')).toBeInTheDocument();
      expect(screen.getByText('Emissor: Dra. Maria')).toBeInTheDocument();
      expect(screen.getByText('def456')).toBeInTheDocument();
    });

    // Click should attempt to download
    const btn = screen.getByText('Laudo Psicossocial');

    fireEvent.click(btn);

    await waitFor(() => {
      expect(
        (global.fetch as jest.Mock).mock.calls.some((c: any) =>
          String(c[0]).includes('/api/emissor/laudos/1/download')
        )
      ).toBeTruthy();
    });
  });
});
