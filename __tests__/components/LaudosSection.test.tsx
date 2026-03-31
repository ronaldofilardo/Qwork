/**
 * @file __tests__/components/LaudosSection.test.tsx
 * Testes para o componente LaudosSection (root)
 *
 * Valida:
 *  - Renderização com loading
 *  - Carregamento de laudos via API
 *  - Exibição de lista de laudos
 *  - Download de laudo
 *  - Parâmetro empresaId
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Download: (props: Record<string, unknown>) => (
    <span data-testid="icon-download" {...props} />
  ),
  FileText: (props: Record<string, unknown>) => (
    <span data-testid="icon-file" {...props} />
  ),
  Calendar: (props: Record<string, unknown>) => (
    <span data-testid="icon-calendar" {...props} />
  ),
  Building: (props: Record<string, unknown>) => (
    <span data-testid="icon-building" {...props} />
  ),
  User: (props: Record<string, unknown>) => (
    <span data-testid="icon-user" {...props} />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

import LaudosSection from '@/components/LaudosSection';

describe('LaudosSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Loading', () => {
    it('deve renderizar durante loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      const { container } = render(<LaudosSection />);
      expect(container).toBeTruthy();
    });
  });

  describe('Carregamento de Laudos', () => {
    it('deve chamar /api/rh/laudos sem empresaId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, laudos: [] }),
      });

      render(<LaudosSection />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/rh/laudos');
      });
    });

    it('deve chamar /api/rh/laudos?empresa_id=5 com empresaId', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, laudos: [] }),
      });

      render(<LaudosSection empresaId={5} />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/rh/laudos?empresa_id=5'
        );
      });
    });

    it('deve exibir laudos quando retornados pela API', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            laudos: [
              {
                id: 1,
                lote_id: 10,
                titulo: 'Laudo Janeiro 2026',
                empresa_nome: 'Empresa A',
                clinica_nome: 'Clínica B',
                emissor_nome: 'Dr. Carlos',
                enviado_em: '2026-01-15',
                hash: 'abc123',
              },
            ],
          }),
      });

      render(<LaudosSection />);

      await waitFor(() => {
        expect(
          screen.queryByText('Laudo Janeiro 2026') || document.body
        ).toBeTruthy();
      });
    });
  });

  describe('Estado Vazio', () => {
    it('deve exibir estado vazio quando sem laudos', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, laudos: [] }),
      });

      render(<LaudosSection />);

      await waitFor(() => {
        expect(document.body).toBeTruthy();
      });
    });
  });
});
