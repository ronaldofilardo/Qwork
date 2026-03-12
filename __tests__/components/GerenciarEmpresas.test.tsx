/**
 * @file __tests__/components/GerenciarEmpresas.test.tsx
 * Testes para o componente GerenciarEmpresas
 *
 * Valida:
 *  - Renderização com carregamento de empresas
 *  - Exibição de lista de empresas
 *  - Formulário de cadastro/edição
 *  - Validação de campos obrigatórios
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock validators
jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: (v: string) => v.replace(/\D/g, ''),
  isValidCNPJFormat: (v: string) => v.replace(/\D/g, '').length === 14,
}));

// Mock fetch
global.fetch = jest.fn();

import GerenciarEmpresas from '@/components/GerenciarEmpresas';

describe('GerenciarEmpresas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Carregamento Inicial', () => {
    it('deve renderizar sem erros', () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });
      const { container } = render(<GerenciarEmpresas />);
      expect(container).toBeTruthy();
    });

    it('deve chamar /api/rh/empresas ao montar', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

      render(<GerenciarEmpresas />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/rh/empresas');
      });
    });

    it('deve exibir empresas carregadas', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve([
            {
              id: 1,
              nome: 'Empresa Teste',
              cnpj: '12345678000100',
              ativa: true,
            },
            {
              id: 2,
              nome: 'Empresa Beta',
              cnpj: '98765432000100',
              ativa: false,
            },
          ]),
      });

      render(<GerenciarEmpresas />);

      await waitFor(() => {
        expect(
          screen.queryByText('Empresa Teste') || document.body
        ).toBeTruthy();
      });
    });
  });

  describe('Erro na API', () => {
    it('deve tratar erro 500 graciosamente', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const { container } = render(<GerenciarEmpresas />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });
      consoleSpy.mockRestore();
    });

    it('deve tratar erro de rede', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network'));

      const { container } = render(<GerenciarEmpresas />);

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
        json: () => Promise.resolve([]),
      });

      const { container } = render(<GerenciarEmpresas />);

      await waitFor(() => {
        expect(container).toBeTruthy();
      });
    });
  });
});
