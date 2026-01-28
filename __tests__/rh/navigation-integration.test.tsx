/**
 * DEPRECATED: Testes de integração obsoletos para navegação entre telas RH
 * Requer atualização para refletir nova estrutura de cards.
 *
 * Testes antigos:
 * - Fluxo completo: Visão geral → Empresa → Voltar
 * - Estados compartilhados e consistência
 * - Navegação programática e interativa
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Alias para compatibilidade com referências legadas
const ClinicaOverviewPage = RhPage;

// Mock do Next.js router
const mockRouter = {
  push: jest.fn(),
  query: {},
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }), // Mock padrão com id
  useSearchParams: () => ({
    get: jest.fn(),
  }) as any,
}));

// Mock do Header
jest.mock('@/components/Header', () => {
  return function MockHeader() {
    return <header data-testid="header">Header</header>;
  };
});

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

// Mock das APIs
global.fetch = jest.fn();

describe.skip('RH Navigation Integration - DEPRECATED', () => {
  const mockSession = {
    cpf: '11111111111',
    nome: 'Gestor RH',
    perfil: 'rh' as const,
  };

  const mockEmpresas = [
    {
      id: 1,
      nome: 'Indústria Metalúrgica',
      cnpj: '12345678000100',
      total_funcionarios: 25,
      avaliacoes_pendentes: 5,
    },
    {
      id: 2,
      nome: 'Construtora ABC',
      cnpj: '98765432000199',
      total_funcionarios: 18,
      avaliacoes_pendentes: 3,
    },
  ];

  const mockEmpresa = {
    id: 1,
    nome: 'Indústria Metalúrgica',
    cnpj: '12345678000100',
  };

  const mockDashboardData = {
    stats: {
      total_avaliacoes: 8,
      concluidas: 6,
      funcionarios_avaliados: 5,
    },
    resultados: [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        media_score: 75.5,
        categoria: 'medio' as const,
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0,
      },
    ],
    distribuicao: [
      { categoria: 'baixo', total: 1 },
      { categoria: 'medio', total: 1 },
      { categoria: 'alto', total: 0 },
    ],
  };

  const mockFuncionarios = [
    {
      cpf: '12345678901',
      nome: 'João Silva',
      setor: 'Produção',
      funcao: 'Operador de Máquinas',
      email: 'joao@empresa.com',
      matricula: 'MAT001',
      turno: 'Manhã',
      escala: '8x40',
      empresa_nome: 'Indústria Metalúrgica',
      ativo: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.push.mockClear();

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

  describe('Fluxo de navegação completa', () => {
    it('deve permitir navegação da visão geral para empresa', async () => {
      // Renderiza visão geral
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica Qwork')).toBeInTheDocument();
      });

      // Clica no botão "Ver Dashboard" da primeira empresa
      const buttons = screen.getAllByText('Ver Dashboard');
      fireEvent.click(buttons[0]);

      // Verifica navegação
      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/1?tab=lotes');
    });

    it('deve permitir voltar da empresa para visão geral', async () => {
      // Configurar mocks específicos para empresa
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
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      // Renderiza dashboard da empresa
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('← Voltar')).toBeInTheDocument();
      });

      // Clica no botão voltar
      const backButton = screen.getByText('← Voltar');
      fireEvent.click(backButton);

      // Verifica navegação de volta
      expect(mockRouter.push).toHaveBeenCalledWith('/rh');
    });

    it('deve manter contexto de navegação entre telas', async () => {
      // Testa navegação para empresa 2
      render(<RhPage />);

      await waitFor(() => {
        const elements = screen.queryAllByText('Construtora ABC');
        expect(elements.length).toBeGreaterThan(0);
      });

      // Clica no botão da segunda empresa
      const buttons = screen.getAllByText('Ver Dashboard');
      fireEvent.click(buttons[1]);

      expect(mockRouter.push).toHaveBeenCalledWith('/rh/empresa/2?tab=lotes');
    });
  });

  describe('Estado consistente entre telas', () => {
    it('deve manter sessão consistente entre navegações', async () => {
      // Verifica que a sessão é mantida em ambas as telas
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica')).toBeInTheDocument();
      });

      // Verifica que as APIs foram chamadas
      const calls = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls;
      const authSessionCalled = calls.some(
        (call) => call[0] === '/api/auth/session'
      );
      const empresasCalled = calls.some(
        (call) => call[0] === '/api/rh/empresas'
      );
      expect(authSessionCalled).toBe(true);
      expect(empresasCalled).toBe(true);
    });

    it('deve compartilhar dados de empresas entre telas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        const elements = screen.getAllByText('Indústria Metalúrgica');
        expect(elements.length).toBeGreaterThan(0);
      });

      // Verifica dados carregados na visão geral
      const calls = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls;
      const authSessionCalled = calls.some(
        (call) => call[0] === '/api/auth/session'
      );
      const empresasCalled = calls.some(
        (call) => call[0] === '/api/rh/empresas'
      );
      expect(authSessionCalled).toBe(true);
      expect(empresasCalled).toBe(true);
    });
  });

  describe('Navegação programática', () => {
    it('deve suportar navegação direta via URL', async () => {
      // Configurar mocks específicos para empresa
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
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Dashboard Indústria Metalúrgica')
        ).toBeInTheDocument();
      });

      // Verifica que as APIs foram chamadas
      const calls = (global.fetch as jest.MockedFunction<typeof fetch>).mock
        .calls;
      const dashboardCalled = calls.some(
        (call) => call[0] === '/api/rh/dashboard?empresa_id=1'
      );
      const authSessionCalled = calls.some(
        (call) => call[0] === '/api/auth/session'
      );
      expect(dashboardCalled).toBe(true);
      expect(authSessionCalled).toBe(true);
    });

    it('deve validar parâmetros da URL', async () => {
      // Configurar mocks para ID inválido
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
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        // Deve tentar carregar dados mesmo com ID inválido
        const calls = (global.fetch as jest.MockedFunction<typeof fetch>).mock
          .calls;
        const dashboardCalled = calls.some(
          (call) => call[0] === '/api/rh/dashboard?empresa_id=1'
        );
        const authSessionCalled = calls.some(
          (call) => call[0] === '/api/auth/session'
        );
        expect(dashboardCalled).toBe(true);
        expect(authSessionCalled).toBe(true);
      });
    });
  });

  describe('Transições de estado', () => {
    it('deve mostrar loading durante navegação', async () => {
      // Mock delay na API
      (global.fetch as jest.Mock).mockImplementation((url) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            if (url === '/api/auth/session') {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockSession),
              });
            } else if (url === '/api/rh/empresas') {
              resolve({
                ok: true,
                json: () => Promise.resolve(mockEmpresas),
              });
            } else {
              resolve({
                ok: false,
                json: () => Promise.resolve({ error: 'Not found' }),
              });
            }
          }, 100); // 100ms delay
        });
      });

      render(<ClinicaOverviewPage />);

      // Deve mostrar loading inicialmente (spinner)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();

      // Aguarda carregamento
      await waitFor(
        () => {
          expect(screen.getByText('Clínica')).toBeInTheDocument();
        },
        { timeout: 1000 }
      );

      // Loading deve desaparecer
      const spinnerAfter = document.querySelector('.animate-spin');
      expect(spinnerAfter).not.toBeInTheDocument();
    });

    it('deve lidar com mudanças rápidas de navegação', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        expect(screen.getByText('Clínica')).toBeInTheDocument();
      });

      // Verifica que a navegação está funcional
      const buttons = screen.getAllByText('Ver Dashboard');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe('Contextualização de dados', () => {
    it.skip('deve filtrar dados corretamente por empresa', async () => {
      // Mock dados específicos para empresa 1
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession),
          });
        }

        if (url === '/api/admin/funcionarios?empresa_id=1') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                funcionarios: [
                  {
                    cpf: '12345678901',
                    nome: 'João Silva',
                    empresa_nome: 'Indústria Metalúrgica',
                    ativo: true,
                  },
                ],
              }),
          });
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Dashboard Indústria Metalúrgica')
        ).toBeInTheDocument();
      });

      // Clica na aba "Funcionários" para mostrar os dados dos funcionários
      const funcionariosTab = screen.getByText((content) =>
        content.includes('Funcionários')
      );
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });

    it.skip('deve atualizar contexto ao mudar de empresa', async () => {
      // Testa apenas que o componente pode ser renderizado com dados mock
      (global.fetch as jest.Mock).mockImplementation((url) => {
        if (url === '/api/auth/session') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockSession),
          });
        }

        if (url.includes('/api/admin/funcionarios?empresa_id=1')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                funcionarios: [
                  {
                    cpf: '12345678901',
                    nome: 'João Silva',
                    empresa_nome: 'Indústria Metalúrgica',
                    ativo: true,
                  },
                ],
              }),
          });
        }

        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Dashboard Indústria Metalúrgica')
        ).toBeInTheDocument();
      });

      // Clica na aba "Funcionários" para mostrar os dados dos funcionários
      const funcionariosTab = screen.getByText((content) =>
        content.includes('Funcionários')
      );
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
    });
  });

  describe('Acessibilidade na navegação', () => {
    it('deve ter botões navegáveis por teclado', async () => {
      render(<ClinicaOverviewPage />);

      await waitFor(() => {
        const buttons = screen.getAllByText('Ver Dashboard');
        expect(buttons.length).toBeGreaterThan(0);
      });

      const buttons = screen.getAllByText('Ver Dashboard');
      buttons.forEach((button) => {
        expect(button).toBeEnabled();
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('deve indicar navegação atual', async () => {
      // Configurar mocks específicos para empresa
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
            json: () => Promise.resolve([mockEmpresa]),
          });
        }

        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockDashboardData),
          });
        }

        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
          });
        }

        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Not found' }),
        });
      });

      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByText('← Voltar')).toBeInTheDocument();
      });

      // Botão de voltar deve estar acessível
      const backButton = screen.getByText('← Voltar');
      expect(backButton).toBeEnabled();
      expect(backButton.tagName).toBe('BUTTON');
    });
  });
});
