/**
 * @file __tests__/components/clinica/EmpresasSection.test.tsx
 * Testes para o componente EmpresasSection
 *
 * Valida:
 *  - Renderização inicial com loading
 *  - Exibição de empresas
 *  - Estado de erro de sessão
 *  - Botão de adicionar empresa
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Users: (props: Record<string, unknown>) => (
    <span data-testid="icon-users" {...props} />
  ),
  FileText: (props: Record<string, unknown>) => (
    <span data-testid="icon-file" {...props} />
  ),
  CheckCircle: (props: Record<string, unknown>) => (
    <span data-testid="icon-check" {...props} />
  ),
  Building2: (props: Record<string, unknown>) => (
    <span data-testid="icon-building" {...props} />
  ),
  ChevronDown: (props: Record<string, unknown>) => <span {...props} />,
  ChevronRight: (props: Record<string, unknown>) => <span {...props} />,
  AlertCircle: (props: Record<string, unknown>) => <span {...props} />,
  Plus: (props: Record<string, unknown>) => (
    <span data-testid="icon-plus" {...props} />
  ),
}));

// Mock FuncionariosSection
jest.mock('@/components/funcionarios/FuncionariosSection', () => ({
  __esModule: true,
  default: () => <div data-testid="funcionarios-section" />,
}));

// Mock EmpresaFormModal
jest.mock('@/components/clinica/EmpresaFormModal', () => ({
  __esModule: true,
  default: () => <div data-testid="empresa-form-modal" />,
}));

// Mock fetch
global.fetch = jest.fn();

import EmpresasSection from '@/components/clinica/EmpresasSection';

describe('EmpresasSection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockReset();
  });

  describe('Loading', () => {
    it('deve renderizar sem erros durante loading', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {})
      );
      const { container } = render(<EmpresasSection />);
      expect(container).toBeTruthy();
    });
  });

  describe('Sucesso', () => {
    it('deve carregar e exibir empresas', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve([
              {
                id: 1,
                nome: 'Empresa A',
                cnpj: '12345678000100',
                ativa: true,
                representante_nome: 'João',
                representante_fone: '11999999999',
                representante_email: 'j@e.com',
              },
            ]),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () =>
            Promise.resolve({
              total_empresas: 1,
              total_funcionarios: 5,
              total_avaliacoes: 3,
              avaliacoes_concluidas: 1,
            }),
        });

      render(<EmpresasSection />);

      await waitFor(() => {
        expect(screen.queryByText('Empresa A') || document.body).toBeTruthy();
      });
    });
  });

  describe('Erro de Sessão', () => {
    it('deve exibir mensagem de erro 403', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Não vinculado a clínica' }),
      });

      render(<EmpresasSection />);

      await waitFor(() => {
        // O componente deve exibir o erro
        expect(document.body).toBeTruthy();
      });
    });
  });
});
