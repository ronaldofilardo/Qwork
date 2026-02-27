/**
 * Testes para o dashboard de empresa com abas funcionais
 * Validação das abas "Funcionários" e "Pendências"
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Mock do Next.js router
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useParams: () => ({ id: '1' }),
  useSearchParams: () => ({
    get: jest.fn((param) => {
      if (param === 'tab') return 'lotes';
      return null;
    }),
  }),
}));

// Mock dos hooks
jest.mock('@/lib/hooks', () => ({
  useEmpresa: () => ({
    empresa: {
      id: 1,
      nome: 'Empresa Teste',
      cnpj: '12345678000100',
      ativa: true,
    },
  }),
  useFuncionarios: () => ({
    fetchFuncionarios: jest.fn(),
  }),
  useLotesAvaliacao: () => ({
    lotes: [],
    fetchLotes: jest.fn(),
  }),
  useLaudos: () => ({
    laudos: [],
    downloadingLaudo: false,
    handleDownloadLaudo: jest.fn(),
    fetchLaudos: jest.fn(),
  }),
  useDashboardData: () => ({
    fetchDashboardData: jest.fn(),
  }),
}));

// Mock dos componentes
jest.mock('@/components/rh', () => ({
  EmpresaHeader: ({ empresaNome, onVoltar, onSair }: any) => (
    <div data-testid="empresa-header">
      <h1>{empresaNome}</h1>
      <button onClick={onVoltar}>Voltar</button>
      <button onClick={onSair}>Sair</button>
    </div>
  ),
  TabNavigation: ({ activeTab, onTabChange }: any) => (
    <div data-testid="tab-navigation">
      <button onClick={() => onTabChange('lotes')} data-active={activeTab === 'lotes'}>
        📋 Ciclos de Coletas Avaliativas
      </button>
      <button onClick={() => onTabChange('funcionarios')} data-active={activeTab === 'funcionarios'}>
        👥 Funcionários
      </button>
      <button onClick={() => onTabChange('pendencias')} data-active={activeTab === 'pendencias'}>
        ⚠️ Pendências
      </button>
    </div>
  ),
  LotesGrid: () => <div data-testid="lotes-grid">Lotes Grid</div>,
}));

jest.mock('@/components/funcionarios/FuncionariosSection', () => {
  return function MockFuncionariosSection({ defaultStatusFilter }: any) {
    return (
      <div data-testid={`funcionarios-section-${defaultStatusFilter}`}>
        FuncionariosSection - {defaultStatusFilter}
      </div>
    );
  };
});

jest.mock('@/components/pendencias/PendenciasSection', () => {
  return function MockPendenciasSection({ empresaId }: any) {
    return (
      <div data-testid="pendencias-section">
        PendenciasSection - empresa {empresaId}
      </div>
    );
  };
});

global.fetch = jest.fn((url) => {
  if (url === '/api/auth/session') {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({ cpf: '12345678901', nome: 'Gestor RH', perfil: 'rh' }),
    });
  }
  return Promise.reject(new Error('URL não mockada'));
}) as jest.Mock;

describe('Empresa Dashboard - Abas Funcionais', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Renderização das abas', () => {
    it('deve renderizar o dashboard com abas funcionais', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      expect(screen.getByText('📋 Ciclos de Coletas Avaliativas')).toBeInTheDocument();
      expect(screen.getByText('👥 Funcionários')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Pendências')).toBeInTheDocument();
    });

    it('NÃO deve renderizar aba Desligamentos', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      expect(screen.queryByText('🚪 Desligamentos')).not.toBeInTheDocument();
    });

    it('deve iniciar na aba "lotes" por padrão', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();
      });
    });
  });

  describe('Navegação entre abas', () => {
    it('deve mostrar FuncionariosSection com filtro "todos" na aba "Funcionários"', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('👥 Funcionários'));
      await waitFor(() => {
        expect(screen.getByTestId('funcionarios-section-todos')).toBeInTheDocument();
      });
      expect(screen.getByText('FuncionariosSection - todos')).toBeInTheDocument();
    });

    it('deve mostrar PendenciasSection na aba "Pendências"', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('⚠️ Pendências'));
      await waitFor(() => {
        expect(screen.getByTestId('pendencias-section')).toBeInTheDocument();
      });
      expect(screen.getByText('PendenciasSection - empresa 1')).toBeInTheDocument();
    });

    it('deve permitir alternar entre abas funcionais', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();

      fireEvent.click(screen.getByText('👥 Funcionários'));
      await waitFor(() => {
        expect(screen.getByTestId('funcionarios-section-todos')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('📋 Ciclos de Coletas Avaliativas'));
      await waitFor(() => {
        expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('⚠️ Pendências'));
      await waitFor(() => {
        expect(screen.getByTestId('pendencias-section')).toBeInTheDocument();
      });
    });
  });

  describe('Props corretas dos componentes', () => {
    it('deve passar filtro "todos" para FuncionariosSection', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('👥 Funcionários'));
      await waitFor(() => {
        expect(screen.getByTestId('funcionarios-section-todos')).toBeInTheDocument();
      });
    });

    it('deve passar empresaId correto para PendenciasSection', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('⚠️ Pendências'));
      await waitFor(() => {
        expect(screen.getByTestId('pendencias-section')).toBeInTheDocument();
      });
      expect(screen.getByText('PendenciasSection - empresa 1')).toBeInTheDocument();
    });
  });

  describe('Ausência de placeholders', () => {
    it('NÃO deve mostrar mensagem de "em desenvolvimento"', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });
      expect(screen.queryByText(/em desenvolvimento/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/🚧/)).not.toBeInTheDocument();
    });

    it('deve mostrar conteúdo funcional em todas as abas', async () => {
      render(<EmpresaDashboardPage />);
      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();

      fireEvent.click(screen.getByText('👥 Funcionários'));
      await waitFor(() => {
        expect(screen.getByTestId('funcionarios-section-todos')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('⚠️ Pendências'));
      await waitFor(() => {
        expect(screen.getByTestId('pendencias-section')).toBeInTheDocument();
      });
    });
  });
});
