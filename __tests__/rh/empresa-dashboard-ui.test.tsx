/**
 * Testes para Interface com Abas do Dashboard de Empresa
 * Sistema de abas, cards de lotes com laudos integrados, funcionalidade preservada
 */

import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  BarElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
}));

jest.mock('react-chartjs-2', () => ({
  Bar: () => <div>Mock Chart</div>,
}));

global.fetch = jest.fn();
global.alert = jest.fn();
global.confirm = jest.fn();

const mockFuncionarios = Array(50)
  .fill(null)
  .map((_, i) => ({
    cpf: String(10000000000 + i),
    nome: `Funcionário ${i + 1}`,
    setor: i % 3 === 0 ? 'TI' : i % 3 === 1 ? 'RH' : 'Produção',
    funcao: i % 2 === 0 ? 'Desenvolvedor' : 'Gestor',
    email: `func${i + 1}@teste.com`,
    matricula: `MAT${String(i + 1).padStart(3, '0')}`,
    nivel_cargo: i % 2 === 0 ? 'operacional' : 'gestao',
    turno: 'Manhã',
    escala: '8x40',
    empresa_nome: 'Empresa Teste',
    ativo: true,
    avaliacoes: [],
  }));

describe('Interface Melhorada - Dashboard Empresa', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ id: '1' });

    // Mock padrão de fetch
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cpf: '11111111111',
            nome: 'RH Teste',
            perfil: 'rh',
          }),
        });
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
          ],
        });
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 100,
              concluidas: 50,
              funcionarios_avaliados: 25,
            },
            resultados: [],
            distribuicao: [],
          }),
        });
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: mockFuncionarios }),
        });
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lotes: [] }),
        });
      }

      return Promise.resolve({ ok: false });
    });
  });

  it('deve exibir hint amigável quando fetch de lotes retorna 403', async () => {
    (global.fetch as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cpf: '11111111111',
            nome: 'RH Teste',
            perfil: 'rh',
          }),
        });
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 1, nome: 'Empresa Teste' }],
        });
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({
            success: false,
            error: 'Acesso negado',
            error_code: 'permission_clinic_mismatch',
            hint: 'Verifique sua clínica',
          }),
        });
      }
      // outros endpoints necessários
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ stats: {}, resultados: [], distribuicao: [] }),
        });
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: mockFuncionarios }),
        });
      }

      return Promise.resolve({ ok: false });
    });

    render(<EmpresaDashboardPage />);

    // Esperar que a mensagem de hint apareça
    await waitFor(() => {
      expect(screen.getByText('Acesso restrito')).toBeInTheDocument();
      expect(screen.getByText('Verifique sua clínica')).toBeInTheDocument();
    });

    // Verificar que o botão Voltar do banner existe e chama handleVoltar (redireciona para /rh)
    const banner = screen.getByText('Acesso restrito').closest('div');
    expect(banner).not.toBeNull();
    const voltarBtn = banner!.querySelector('button');
    expect(voltarBtn).toBeInTheDocument();
    fireEvent.click(voltarBtn as HTMLElement);
    expect(mockPush).toHaveBeenCalledWith('/rh');
  });

  describe.skip('Paginação Inteligente', () => {
    it('deve exibir 20 funcionários por página', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      // Verificar que não exibe mais que 20
      expect(screen.queryByText('Funcionário 21')).not.toBeInTheDocument();
      expect(screen.queryByText('Funcionário 22')).not.toBeInTheDocument();
    });

    it('deve navegar para próxima página', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const nextButton = screen.getByText(/Próximo|→|>/i);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 21')).toBeInTheDocument();
      });
      expect(screen.queryByText('Funcionário 1')).not.toBeInTheDocument();
    });

    it('deve navegar para página anterior', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      // Ir para segunda página
      const nextButton = screen.getByText(/Próximo|→|>/i);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 21')).toBeInTheDocument();
      });

      // Voltar para primeira
      const prevButton = screen.getByText('← Anterior');
      fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });
    });

    it('deve exibir contador de páginas', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        // 50 funcionários / 20 por página = 3 páginas
        expect(screen.getByText(/Página 1 de 3|1 \/ 3/i)).toBeInTheDocument();
      });
    });

    it('deve desabilitar botão Anterior na primeira página', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        const prevButton = screen.getByText('← Anterior');
        expect(prevButton).toBeDisabled();
      });
    });

    it('deve desabilitar botão Próximo na última página', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      // Navegar até a última página
      const nextButton = screen.getByText(/Próximo|→|>/i);
      fireEvent.click(nextButton); // Página 2
      fireEvent.click(nextButton); // Página 3

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });
  });

  describe.skip('Busca em Tempo Real', () => {
    it('deve filtrar funcionários por nome', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'Funcionário 5' } });

      await waitFor(() => {
        expect(screen.getByText('Funcionário 5')).toBeInTheDocument();
        expect(screen.queryByText('Funcionário 1')).not.toBeInTheDocument();
      });
    });

    it('deve filtrar funcionários por CPF', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: '10000000005' } });

      await waitFor(() => {
        expect(screen.getByText('10000000005')).toBeInTheDocument();
      });
    });

    it('deve filtrar funcionários por setor', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'TI' } });

      await waitFor(() => {
        const tiElements = screen.getAllByText('TI');
        expect(tiElements.length).toBeGreaterThan(0);
        expect(screen.queryByText('Produção')).not.toBeInTheDocument();
      });
    });

    it('deve filtrar funcionários por função', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'Desenvolvedor' } });

      await waitFor(() => {
        const devElements = screen.getAllByText('Desenvolvedor');
        expect(devElements.length).toBeGreaterThan(0);
      });
    });

    it('deve limpar filtro e mostrar todos', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);

      // Filtrar
      fireEvent.change(searchInput, { target: { value: 'TI' } });

      await waitFor(() => {
        expect(screen.queryByText('Produção')).not.toBeInTheDocument();
      });

      // Limpar filtro
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });
    });

    it('deve resetar paginação ao buscar', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      // Ir para página 2
      const nextButton = screen.getByText(/Próximo|→|>/i);
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 21')).toBeInTheDocument();
      });

      // Fazer busca
      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'Funcionário 1' } });

      await waitFor(() => {
        // Deve mostrar apenas funcionários que contenham "Funcionário 1"
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
        expect(screen.queryByText('Funcionário 2')).not.toBeInTheDocument();
      });
    });
  });

  describe.skip('Contadores Dinâmicos', () => {
    it('deve exibir aba de funcionários', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Funcionários/i)).toBeInTheDocument();
      });
    });

    it('deve atualizar lista com filtro aplicado', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'TI' } });

      await waitFor(() => {
        // Deve mostrar apenas funcionários de TI
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
        expect(screen.queryByText('Funcionário 2')).not.toBeInTheDocument();
      });
    });

    it('deve exibir mensagem quando não há resultados', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar|Pesquisar/i);
      fireEvent.change(searchInput, { target: { value: 'XXXXX' } });

      await waitFor(() => {
        expect(
          screen.getByText(/Nenhum funcionário encontrado|Sem resultados/i)
        ).toBeInTheDocument();
      });
    });

    it('deve contar funcionários ativos separadamente', async () => {
      const funcionariosComInativo = [...mockFuncionarios];
      funcionariosComInativo[0] = {
        ...funcionariosComInativo[0],
        ativo: false,
      };
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('/api/admin/funcionarios')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ funcionarios: funcionariosComInativo }),
          });
        }
        if (url.includes('/api/auth/session')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              cpf: '11111111111',
              nome: 'RH Teste',
              perfil: 'rh',
            }),
          });
        }
        if (url.includes('/api/rh/empresas')) {
          return Promise.resolve({
            ok: true,
            json: async () => [
              { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
            ],
          });
        }
        if (url.includes('/api/rh/dashboard')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              stats: {
                total_avaliacoes: 100,
                concluidas: 50,
                funcionarios_avaliados: 25,
              },
              resultados: [],
              distribuicao: [],
            }),
          });
        }
        if (url.includes('/api/rh/lotes')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ lotes: [] }),
          });
        }
        return Promise.resolve({ ok: false });
      });

      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Funcionários/i)).toBeInTheDocument();
      });
    });
  });

  describe.skip('Estados de Loading', () => {
    it('deve exibir loading inicial', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<EmpresaDashboardPage />);

      expect(
        screen.getByRole('status', { hidden: true }) ||
          screen.getByText(/Carregando|Loading/i)
      ).toBeInTheDocument();
    });

    it('deve ocultar loading após carregar dados', async () => {
      render(<EmpresaDashboardPage />);

      await waitFor(() => {
        expect(
          screen.queryByText(/Carregando|Loading/i)
        ).not.toBeInTheDocument();
      });
    });

    it('deve mostrar loading ao mudar de página', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      const nextButton = screen.getByText(/Próximo|→|>/i);
      fireEvent.click(nextButton);

      // Loading durante transição
      await waitFor(() => {
        expect(screen.getByText('Funcionário 21')).toBeInTheDocument();
      });
    });

    it('deve exibir skeleton durante carregamento', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<EmpresaDashboardPage />);

      // Verificar se há elementos de skeleton ou loading
      const loadingElements = screen.getAllByRole('status', { hidden: true });
      expect(loadingElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interação com Upload e Inserção', () => {
    it('deve exibir botão de inserir funcionário', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText(/Inserir Funcionário|➕/i)).toBeInTheDocument();
      });
    });

    it('deve exibir seção de upload XLSX', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(
          screen.getByText('Importar Múltiplos (XLSX)')
        ).toBeInTheDocument();
      });
    });

    it('deve exibir link para modelo XLSX', async () => {
      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        const modelLink = screen.getByText('📋 Baixar Modelo XLSX');
        expect(modelLink).toBeInTheDocument();
      });
    });
  });

  describe('Responsividade', () => {
    it.skip('deve adaptar layout para mobile', async () => {
      // Simular viewport mobile
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        expect(screen.getByText('Funcionário 1')).toBeInTheDocument();
      });

      // Verificar se elementos responsivos estão presentes
      const container = screen.getByText('Funcionário 1').closest('div');
      expect(container).toBeInTheDocument();
    });

    it.skip('deve exibir paginação em mobile', async () => {
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<EmpresaDashboardPage />);

      // Esperar loading terminar
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Clicar na aba Funcionários
      const funcionariosTab = screen.getByText(/Funcionários/i);
      fireEvent.click(funcionariosTab);

      await waitFor(() => {
        const nextButton = screen.getByText(/Próximo|→|>/i);
        expect(nextButton).toBeInTheDocument();
      });
    });
  });
});
