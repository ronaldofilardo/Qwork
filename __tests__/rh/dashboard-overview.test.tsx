/**
 * DEPRECATED: Este teste está obsoleto.
 * Usar __tests__/rh/rh-cards-empresas.test.tsx para testes da nova tela raiz.
 *
 * Mantido apenas para referência histórica.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

// Alias para compatibilidade com referências legadas
const ClinicaOverviewPage = RhPage;

// Mock session para testes
const mockSession = {
  cpf: '12345678900',
  nome: 'Gestor RH',
  perfil: 'rh' as const,
  clinica_id: 1,
};

// Mock do Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock do EmpresaFormModal
jest.mock('@/components/clinica/EmpresaFormModal', () => {
  return function MockEmpresaFormModal() {
    return <div data-testid="modal-empresa">Mock Modal</div>;
  };
});

// Mock das APIs
global.fetch = jest.fn();

describe.skip('RH Dashboard - DEPRECATED - Visão Geral da Clínica', () => {
  const mockEmpresas = [
    {
      id: 1,
      nome: 'Indústria Metalúrgica',
      cnpj: '12345678000100',
      total_funcionarios: 25,
      total_avaliacoes: 30,
      avaliacoes_concluidas: 20,
      ativa: true,
      representante_nome: 'João',
      representante_fone: '11999999999',
      representante_email: 'joao@teste.com',
    },
    {
      id: 2,
      nome: 'Construtora ABC',
      cnpj: '98765432000199',
      total_funcionarios: 18,
      total_avaliacoes: 20,
      avaliacoes_concluidas: 15,
      ativa: true,
      representante_nome: 'Maria',
      representante_fone: '11888888888',
      representante_email: 'maria@teste.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock das APIs
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
    it('deve exibir título da clínica', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
        expect(
          screen.getByText(
            'Visão geral das empresas e avaliações psicossociais'
          )
        ).toBeInTheDocument();
      });
    });

    it('deve exibir header de empresas e os cards correspondentes', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Verifica que o grid de empresas renderiza os cards e que a quantidade corresponde ao mock
      const header = screen.getByText('Gestão de Empresas');
      const empresasGrid = header.nextElementSibling;
      expect(empresasGrid).toBeTruthy();

      const cards = (empresasGrid as HTMLElement).querySelectorAll(
        ':scope > div'
      );
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Cards das empresas', () => {
    it('deve exibir cards para cada empresa', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Verifica cards das empresas
      expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
      expect(screen.getByText('Construtora ABC')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: 98765432000199')).toBeInTheDocument();
    });

    it('não deve exibir contadores por empresa (removidos)', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      // Verifica que os contadores por empresa foram removidos
      const empresaCard = screen
        .getByText('Indústria Metalúrgica')
        .closest('.bg-white');
      expect(empresaCard).not.toHaveTextContent(/Funcionários/);
      expect(empresaCard).not.toHaveTextContent(/Pendentes/);

      // Verifica que os contadores por empresa foram removidos (não há labels específicos)
      expect(empresaCard).not.toHaveTextContent(/Funcionários/);
      expect(empresaCard).not.toHaveTextContent(/Pendentes/);
    });

    it('deve exibir botão "Ver Dashboard →" em cada card', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      const buttons = screen.getAllByText('Ver Dashboard');
      expect(buttons).toHaveLength(2);
    });
  });

  describe('Navegação', () => {
    it('deve navegar para dashboard da empresa ao clicar no card', async () => {
      const mockRouter = { push: jest.fn() };
      const useRouterMock = jest
        .spyOn(require('next/navigation'), 'useRouter')
        .mockReturnValue(mockRouter);

      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      // Encontra o card da primeira empresa e clica no botão
      const buttons = screen.getAllByText('Ver Dashboard');
      fireEvent.click(buttons[0]);

      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/1');

      useRouterMock.mockRestore();
    });

    it('deve navegar para empresa correta ao clicar em diferentes cards', async () => {
      const mockRouter = { push: jest.fn() };
      const useRouterMock = jest
        .spyOn(require('next/navigation'), 'useRouter')
        .mockReturnValue(mockRouter);

      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Construtora ABC')).toBeInTheDocument();
      });

      // Encontra o card da segunda empresa e clica
      const buttons = screen.getAllByText('Ver Dashboard');
      fireEvent.click(buttons[1]);

      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/2');

      useRouterMock.mockRestore();
    });
  });

  describe('Estado vazio', () => {
    it('deve exibir mensagem quando não há empresas', async () => {
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

      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Nenhuma empresa encontrada')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'Entre em contato com o administrador para cadastrar empresas.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('Layout compacto e otimização de espaço', () => {
    it('deve exibir layout responsivo dos cards de empresas', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const header = screen.getByText('Gestão de Empresas');
      const empresasGrid = header.nextElementSibling;
      expect(empresasGrid).toHaveClass('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4');
    });

    it('deve exibir cards de empresas com layout denso', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      // Verifica grid otimizado para máximo aproveitamento (até 4 colunas)
      const empresasGrid = screen.getByText('Gestão de Empresas').nextElementSibling;
      expect(empresasGrid).toHaveClass('xl:grid-cols-4');

      // Verifica padding reduzido nos cards
      const empresaCard = screen
        .getByText('Indústria Metalúrgica')
        .closest('.bg-white');
      expect(empresaCard).toHaveClass('p-4'); // Padding otimizado
    });

    it('deve ter botões de ação compactos nos cards de empresa', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      const buttons = screen.getAllByText('Ver Dashboard');
      buttons.forEach((button) => {
        // @ts-expect-error - toHaveClass aceita múltiplas classes como argumentos separados no @testing-library/jest-dom
        expect(button).toHaveClass('py-2', 'px-3', 'text-sm'); // Botão compacto
      });
    });

    it('deve exibir estatísticas de empresa em layout horizontal', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Indústria Metalúrgica')).toBeInTheDocument();
      });

      // Verifica layout horizontal das estatísticas (Funcionários | Pendentes)
      const empresaCard = screen
        .getByText('Indústria Metalúrgica')
        .closest('.bg-white');
      const statsContainer = empresaCard?.querySelector(
        '.flex.justify-between.items-center'
      );
      expect(statsContainer).toBeInTheDocument();
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

      render(<ClinicaOverviewPage />);

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

      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/dashboard');
      });

      useRouterMock.mockRestore();
    });

    it('deve lidar com erro na API de empresas', async () => {
      // Mock erro na API de empresas
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession),
          });
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: 'Erro interno' }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      // O erro é tratado silenciosamente - apenas verifica que a página carrega com estado vazio
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa encontrada')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Cálculos de estatísticas', () => {
    it('não deve exibir contadores agregados ou por empresa (removidos)', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Nenhum contador de 'Funcionários' deve estar visível
      expect(screen.queryByText(/Funcionários/)).not.toBeInTheDocument();

      // Verifica que não há labels de contadores agregados (como 'Funcionários') visíveis
      expect(screen.queryByText(/Funcionários/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Avaliações/)).not.toBeInTheDocument();
    });
  });
});
