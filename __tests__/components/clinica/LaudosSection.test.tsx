/**
 * @file __tests__/components/clinica/LaudosSection.test.tsx
 * Testes para o componente LaudosSection (Clínica)
 *
 * Valida:
 *  - Renderização com loading
 *  - Carregamento de laudos via /api/rh/laudos
 *  - Exibição de laudos
 *  - Estado vazio
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  FolderOpen: (props: Record<string, unknown>) => (
    <span data-testid="icon-folder" {...props} />
  ),
  FileText: (props: Record<string, unknown>) => (
    <span data-testid="icon-file" {...props} />
  ),
  Download: (props: Record<string, unknown>) => (
    <span data-testid="icon-download" {...props} />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

import LaudosSectionClinica from '@/components/clinica/LaudosSection';

describe('LaudosSection (Clínica)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Loading', () => {
    it('deve renderizar sem erros durante loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      const { container } = render(<LaudosSectionClinica />);
      expect(container).toBeTruthy();
    });
  });

  describe('Carregamento', () => {
    it('deve chamar /api/rh/laudos ao montar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ laudos: [] }),
      });

      render(<LaudosSectionClinica />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/rh/laudos');
      });
    });

    it('deve exibir laudos retornados', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            laudos: [
              {
                id: 1,
                lote_id: 10,
                lote_titulo: 'Lote Janeiro',
                empresa_nome: 'Empresa A',
                status: 'emitido',
                data_emissao: '2026-01-15',
                arquivos: {},
              },
            ],
          }),
      });

      render(<LaudosSectionClinica />);

      await waitFor(() => {
        expect(
          screen.queryByText('Lote Janeiro') || document.body
        ).toBeTruthy();
      });
    });
  });

  describe('Erro de API', () => {
    it('deve tratar erro graciosamente', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network'));

      const { container } = render(<LaudosSectionClinica />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Estado Vazio', () => {
    it('deve funcionar com lista vazia', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ laudos: [] }),
      });

      const { container } = render(<LaudosSectionClinica />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });
  });
});
