/**
 * DEPRECATED: Testes obsoletos para comportamento antigo da página RH
 * Usar __tests__/rh/rh-cards-empresas.test.tsx para testes da nova tela raiz.
 *
 * Testes antigos:
 * - Estatísticas da clínica (empresas, funcionários, avaliações)
 * - Lista de empresas com cards
 * - Navegação para dashboards das empresas
 * - Autenticação e autorização
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  query: {},
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}));

// Mock das APIs
global.fetch = jest.fn();

// Mock do Chart.js
jest.mock('chart.js', () => ({
  Chart: { register: jest.fn() },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div data-testid="chart-bar">Chart</div>,
}));

describe.skip('RH Page - DEPRECATED - Visão Geral da Clínica', () => {
  const mockSession = {
    cpf: '11111111111',
    nome: 'RH Teste',
    perfil: 'rh' as const,
  };

  const mockEmpresas = [
    {
      id: 1,
      nome: 'Indústria Metalúrgica',
      cnpj: '12345678000100',
      total_funcionarios: 34,
      avaliacoes_pendentes: 17,
    },
    {
      id: 2,
      nome: 'Construtora ABC',
      cnpj: '98765432000199',
      total_funcionarios: 12,
      avaliacoes_pendentes: 10,
    },
  ];

  const mockClinicaStats = {
    total_empresas: 2,
    total_funcionarios: 46,
    total_avaliacoes: 150,
    avaliacoes_concluidas: 120,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock da sessão
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        });
      }

      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmpresas),
        });
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      });
    });
  });

  describe('Renderização inicial', () => {
    it('deve carregar e exibir título e descrição da página', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Visão geral das empresas e avaliações psicossociais')
      ).toBeInTheDocument();
    });

    it('deve carregar e exibir estatísticas da clínica', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
      });

      // Verifica estatísticas - usa queryAllByText para múltiplas ocorrências
      expect(screen.getByText('Empresas')).toBeInTheDocument();
      expect(screen.queryAllByText('Funcionários')).toHaveLength(3); // 1 no header + 2 nos cards
      expect(screen.getByText('Avaliações')).toBeInTheDocument();
      expect(screen.getByText('Concluídas')).toBeInTheDocument();
    });

    it('deve carregar lista de empresas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      expect(screen.getByText('Construtora ABC')).toBeInTheDocument();
    });
  });

  describe('Cards de empresas', () => {
    it('deve exibir informações completas dos cards de empresa', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Verifica informações da primeira empresa
      expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
      expect(screen.getAllByText('Funcionários')).toBeTruthy();
      expect(screen.getAllByText('Pendentes')).toBeTruthy();
      expect(screen.getAllByText('Ver Dashboard')).toBeTruthy();
    });

    it('deve permitir navegação para dashboard da empresa', async () => {
      const mockRouter = { push: jest.fn() };
      const useRouterMock = jest
        .spyOn(require('next/navigation'), 'useRouter')
        .mockReturnValue(mockRouter);

      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const buttons = screen.getAllByText('Ver Dashboard');
      expect(buttons).toHaveLength(2);

      fireEvent.click(buttons[0]);
      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/1');

      useRouterMock.mockRestore();
    });

    it('deve mostrar mensagem quando não há empresas', async () => {
      // Mock sem empresas
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession),
          });
        }
        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<RhPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa encontrada')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Entre em contato com o administrador para cadastrar empresas.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Layout responsivo', () => {
    it('deve usar layout compacto para estatísticas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
      });

      // Verifica se os cards de estatísticas estão em grid responsivo
      const statsContainer = screen
        .getByText('Empresas')
        .closest('.grid') as HTMLElement;
      expect(statsContainer).toHaveClass('grid-cols-2 md:grid-cols-4');
    });

    it('deve usar layout responsivo para cards de empresas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Verifica se os cards de empresas estão em grid responsivo
      const empresasGrid = screen.getByText('Gestão de Empresas')
        .nextElementSibling as HTMLElement;
      expect(empresasGrid).toHaveClass(
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      );
    });
  });

  describe('Tratamento de erros', () => {
    it('deve redirecionar para login se não autenticado', async () => {
      // Mock sem sessão
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Não autenticado' }),
          });
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      const mockRouter = { push: jest.fn() };
      const useRouterMock = jest
        .spyOn(require('next/navigation'), 'useRouter')
        .mockReturnValue(mockRouter);

      render(<RhPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });

      useRouterMock.mockRestore();
    });

    it('deve redirecionar para dashboard se perfil não autorizado', async () => {
      // Mock perfil funcionário
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                cpf: '22222222222',
                nome: 'Funcionário',
                perfil: 'funcionario',
              }),
          });
        }
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      const mockRouter = { push: jest.fn() };
      const useRouterMock = jest
        .spyOn(require('next/navigation'), 'useRouter')
        .mockReturnValue(mockRouter);

      render(<RhPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });

      useRouterMock.mockRestore();
    });
  });
});
