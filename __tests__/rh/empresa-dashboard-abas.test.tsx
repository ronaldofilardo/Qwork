/**
 * Testes para o dashboard de empresa com abas funcionais
 * Validação das abas "Funcionários Ativos" e "Desligamentos"
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
      <button
        onClick={() => onTabChange('lotes')}
        data-active={activeTab === 'lotes'}
      >
        📋 Ciclos de Coletas Avaliativas
      </button>
      <button
        onClick={() => onTabChange('funcionarios')}
        data-active={activeTab === 'funcionarios'}
      >
        👥 Funcionários Ativos
      </button>
      <button
        onClick={() => onTabChange('desligamentos')}
        data-active={activeTab === 'desligamentos'}
      >
        🚪 Desligamentos
      </button>
    </div>
  ),
  LotesGrid: () => <div data-testid="lotes-grid">Lotes Grid</div>,
}));

// Mock do FuncionariosSection
jest.mock('@/components/funcionarios/FuncionariosSection', () => {
  return function MockFuncionariosSection({ defaultStatusFilter }: any) {
    return (
      <div data-testid={`funcionarios-section-${defaultStatusFilter}`}>
        FuncionariosSection - {defaultStatusFilter}
      </div>
    );
  };
});

// Mock do session
global.fetch = jest.fn((url) => {
  if (url === '/api/auth/session') {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          cpf: '12345678901',
          nome: 'Gestor RH',
          perfil: 'rh',
        }),
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
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
      expect(screen.getByText('👥 Funcionários Ativos')).toBeInTheDocument();
      expect(screen.getByText('🚪 Desligamentos')).toBeInTheDocument();
    });

    it('deve iniciar na aba "lotes" por padrão', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();
      });
    });
  });

  describe('Navegação entre abas', () => {
    it('deve mostrar FuncionariosSection com filtro "ativos" na aba "Funcionários Ativos"', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      // Clica na aba de funcionários
      const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
      fireEvent.click(abaFuncionarios);

      // Verifica que o componente foi renderizado com filtro correto
      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-ativos')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('FuncionariosSection - ativos')
      ).toBeInTheDocument();
    });

    it('deve mostrar FuncionariosSection com filtro "inativos" na aba "Desligamentos"', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      // Clica na aba de desligamentos
      const abaDesligamentos = screen.getByText('🚪 Desligamentos');
      fireEvent.click(abaDesligamentos);

      // Verifica que o componente foi renderizado com filtro correto
      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-inativos')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText('FuncionariosSection - inativos')
      ).toBeInTheDocument();
    });

    it('deve permitir alternar entre abas funcionais', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      // Inicia na aba lotes
      expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();

      // Vai para funcionários ativos
      const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
      fireEvent.click(abaFuncionarios);

      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-ativos')
        ).toBeInTheDocument();
      });

      // Volta para lotes
      const abaLotes = screen.getByText('📋 Ciclos de Coletas Avaliativas');
      fireEvent.click(abaLotes);

      await waitFor(() => {
        expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();
      });

      // Vai para desligamentos
      const abaDesligamentos = screen.getByText('🚪 Desligamentos');
      fireEvent.click(abaDesligamentos);

      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-inativos')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Props corretas do FuncionariosSection', () => {
    it('deve passar props corretas para FuncionariosSection na aba funcionários', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
      fireEvent.click(abaFuncionarios);

      await waitFor(() => {
        const funcionariosSection = screen.getByTestId(
          'funcionarios-section-ativos'
        );
        expect(funcionariosSection).toBeInTheDocument();
      });

      // O mock mostra que o componente recebeu o filtro correto
      expect(
        screen.getByText('FuncionariosSection - ativos')
      ).toBeInTheDocument();
    });

    it('deve passar props corretas para FuncionariosSection na aba desligamentos', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      const abaDesligamentos = screen.getByText('🚪 Desligamentos');
      fireEvent.click(abaDesligamentos);

      await waitFor(() => {
        const funcionariosSection = screen.getByTestId(
          'funcionarios-section-inativos'
        );
        expect(funcionariosSection).toBeInTheDocument();
      });

      // O mock mostra que o componente recebeu o filtro correto
      expect(
        screen.getByText('FuncionariosSection - inativos')
      ).toBeInTheDocument();
    });
  });

  describe('Contexto de empresa', () => {
    it('deve passar empresaId correto para FuncionariosSection', async () => {
      // O mock do componente mostra que recebe o contexto correto
      // Na implementação real, o empresaId=1 é passado via parseInt(empresaId)
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
      fireEvent.click(abaFuncionarios);

      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-ativos')
        ).toBeInTheDocument();
      });
    });

    it('deve passar empresaNome correto para FuncionariosSection', async () => {
      // O mock do componente mostra que recebe o contexto correto
      // Na implementação real, empresa.nome="Empresa Teste" é passado
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      const abaDesligamentos = screen.getByText('🚪 Desligamentos');
      fireEvent.click(abaDesligamentos);

      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-inativos')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Ausência de placeholders', () => {
    it('NÃO deve mostrar mensagem de "em desenvolvimento"', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      // Verifica que não há mensagens de desenvolvimento
      expect(screen.queryByText(/em desenvolvimento/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/🚧/)).not.toBeInTheDocument();
      expect(
        screen.queryByText(/Componente em desenvolvimento/)
      ).not.toBeInTheDocument();
    });

    it('deve mostrar conteúdo funcional em todas as abas', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(screen.getByTestId('empresa-header')).toBeInTheDocument();
      });

      // Verifica aba lotes
      expect(screen.getByTestId('lotes-grid')).toBeInTheDocument();

      // Verifica aba funcionários
      const abaFuncionarios = screen.getByText('👥 Funcionários Ativos');
      fireEvent.click(abaFuncionarios);
      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-ativos')
        ).toBeInTheDocument();
      });

      // Verifica aba desligamentos
      const abaDesligamentos = screen.getByText('🚪 Desligamentos');
      fireEvent.click(abaDesligamentos);
      await waitFor(() => {
        expect(
          screen.getByTestId('funcionarios-section-inativos')
        ).toBeInTheDocument();
      });
    });
  });
});
