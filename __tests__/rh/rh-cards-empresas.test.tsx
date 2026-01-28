/**
 * Testes específicos para a tela raiz do RH com cards de empresas
 * - Renderização de cards interativos
 * - Botão "Nova Empresa" visível
 * - Navegação para dashboard da empresa
 * - Estatísticas globais
 * - Estado vazio
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';

// Mock do Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do EmpresaFormModal
jest.mock('@/components/clinica/EmpresaFormModal', () => {
  return function MockEmpresaFormModal({
    isOpen,
    onClose,
    onSuccess,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (empresa: any) => void;
  }) {
    if (!isOpen) return null;
    return (
      <div data-testid="modal-empresa">
        <h2>Modal Nova Empresa</h2>
        <button onClick={onClose}>Fechar</button>
        <button
          onClick={() =>
            onSuccess({
              id: 999,
              nome: 'Nova Empresa Teste',
              cnpj: '00000000000000',
              ativa: true,
            })
          }
        >
          Criar Empresa
        </button>
      </div>
    );
  };
});

describe('RH Page - Tela Raiz com Cards de Empresas', () => {
  const mockEmpresas = [
    {
      id: 1,
      nome: 'Empresa Alpha',
      cnpj: '12345678000100',
      ativa: true,
      total_funcionarios: 25,
      total_avaliacoes: 30,
      avaliacoes_concluidas: 20,
    },
    {
      id: 2,
      nome: 'Empresa Beta',
      cnpj: '98765432000199',
      ativa: false,
      total_funcionarios: 15,
      total_avaliacoes: 10,
      avaliacoes_concluidas: 8,
    },
    {
      id: 3,
      nome: 'Empresa Gamma',
      cnpj: '11122233000144',
      ativa: true,
      total_funcionarios: 50,
      total_avaliacoes: 60,
      avaliacoes_concluidas: 45,
    },
  ];

  const mockStats = {
    total_empresas: 3,
    total_funcionarios: 90,
    total_avaliacoes: 100,
    avaliacoes_concluidas: 73,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    global.fetch = jest.fn((url) => {
      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmpresas),
        });
      }

      if (url === '/api/rh/dashboard') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStats),
        });
      }

      return Promise.reject(new Error('URL não mockada'));
    }) as jest.Mock;
  });

  describe('Renderização Básica', () => {
    it('deve renderizar o título e descrição da página', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Gerencie as empresas clientes e suas avaliações psicossociais'
        )
      ).toBeInTheDocument();
    });

    it('deve exibir loading inicial', () => {
      render(<RhPage />);

      expect(screen.getByText('Carregando empresas...')).toBeInTheDocument();
    });

    it('deve exibir botão "Nova Empresa" no header', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const botaoNovaEmpresa = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      expect(botaoNovaEmpresa).toBeInTheDocument();
    });
  });

  describe('Cards de Estatísticas Globais', () => {
    it('deve exibir cards com estatísticas agregadas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Total de Empresas')).toBeInTheDocument();
      });

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Total de Funcionários')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
      expect(screen.getByText('Total de Avaliações')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Avaliações Concluídas')).toBeInTheDocument();
      expect(screen.getByText('73')).toBeInTheDocument();
    });

    it('deve calcular porcentagem de conclusão corretamente', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('73% de conclusão')).toBeInTheDocument();
      });
    });
  });

  describe('Cards de Empresas', () => {
    it('deve renderizar cards para todas as empresas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
      expect(screen.getByText('Empresa Gamma')).toBeInTheDocument();
    });

    it('deve exibir CNPJ de cada empresa', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('CNPJ: 12345678000100')).toBeInTheDocument();
      });

      expect(screen.getByText('CNPJ: 98765432000199')).toBeInTheDocument();
      expect(screen.getByText('CNPJ: 11122233000144')).toBeInTheDocument();
    });

    it('deve exibir status ativo/inativo corretamente', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ativa')).toHaveLength(2);
      });

      expect(screen.getByText('Inativa')).toBeInTheDocument();
    });

    it('deve exibir informações do representante', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Representante: João Silva')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('joao@alpha.com')).toBeInTheDocument();
      expect(
        screen.getByText('Representante: Maria Santos')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Representante: Carlos Oliveira')
      ).toBeInTheDocument();
    });

    it('deve exibir contadores de funcionários e avaliações', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresas Cadastradas')).toBeInTheDocument();
      });

      // Verifica labels
      const funcionariosLabels = screen.getAllByText('Funcionários');
      expect(funcionariosLabels.length).toBeGreaterThan(0);

      const avaliacoesLabels = screen.getAllByText('Avaliações');
      expect(avaliacoesLabels.length).toBeGreaterThan(0);

      // Verifica valores específicos
      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText('30')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('deve exibir barra de progresso com porcentagem correta', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('20 / 30')).toBeInTheDocument();
      });

      expect(screen.getByText('8 / 10')).toBeInTheDocument();
      expect(screen.getByText('45 / 60')).toBeInTheDocument();
    });

    it('deve ter botão "Ver Dashboard" em cada card', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      const botoesDashboard = screen.getAllByRole('button', {
        name: /ver dashboard/i,
      });
      expect(botoesDashboard).toHaveLength(3);
    });
  });

  describe('Navegação', () => {
    it('deve navegar para dashboard da empresa ao clicar no botão', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Alpha')).toBeInTheDocument();
      });

      const botoesDashboard = screen.getAllByRole('button', {
        name: /ver dashboard/i,
      });
      fireEvent.click(botoesDashboard[0]);

      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/1');
    });

    it('deve navegar corretamente para diferentes empresas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Empresa Beta')).toBeInTheDocument();
      });

      const botoesDashboard = screen.getAllByRole('button', {
        name: /ver dashboard/i,
      });

      fireEvent.click(botoesDashboard[1]);
      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/2');

      fireEvent.click(botoesDashboard[2]);
      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/3');
    });
  });

  describe('Modal de Nova Empresa', () => {
    it('deve abrir modal ao clicar no botão "Nova Empresa"', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const botaoNovaEmpresa = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      fireEvent.click(botaoNovaEmpresa);

      expect(screen.getByTestId('modal-empresa')).toBeInTheDocument();
      expect(screen.getByText('Modal Nova Empresa')).toBeInTheDocument();
    });

    it('NÃO deve redirecionar ao clicar em "Nova Empresa" (header)', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const botaoNovaEmpresa = screen.getByTestId('nova-empresa-button');
      fireEvent.click(botaoNovaEmpresa);

      expect(mockPush).not.toHaveBeenCalled();
    });

    it('mostra mensagem de sessão inválida quando API retorna 401', async () => {
      // garantir que a primeira chamada a /api/rh/empresas retorne 401 (sobrepõe beforeEach)
      (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: false,
            status: 401,
            json: () =>
              Promise.resolve({
                error: 'Sessão inválida: usuário não encontrado',
              }),
          });
        }
        return Promise.reject(new Error('URL não mockada'));
      });

      // para o dashboard, deixar o mock original do beforeEach responder corretamente
      (global.fetch as jest.Mock).mockImplementationOnce((url: string) => {
        if (url === '/api/rh/dashboard') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
          });
        }
        return Promise.reject(new Error('URL não mockada'));
      });

      // Renderizar a seção isoladamente torna o teste mais determinístico
      const { default: EmpresasSection } =
        await import('@/components/clinica/EmpresasSection');
      render((<EmpresasSection />) as any);

      await waitFor(() => {
        expect(screen.getByText(/Sessão inválida/i)).toBeInTheDocument();
      });

      // botão Nova Empresa não deve estar disponível quando sessão inválida
      expect(
        screen.queryByRole('button', { name: /nova empresa/i })
      ).not.toBeInTheDocument();
    });

    it('deve fechar modal ao clicar em fechar', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      const botaoNovaEmpresa = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      fireEvent.click(botaoNovaEmpresa);

      const botaoFechar = screen.getByRole('button', { name: /fechar/i });
      fireEvent.click(botaoFechar);

      await waitFor(() => {
        expect(screen.queryByTestId('modal-empresa')).not.toBeInTheDocument();
      });
    });

    it('deve adicionar nova empresa à lista após criação', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Abrir modal
      const botaoNovaEmpresa = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      fireEvent.click(botaoNovaEmpresa);

      // Criar empresa
      const botaoCriar = screen.getByRole('button', { name: /criar empresa/i });
      fireEvent.click(botaoCriar);

      // Aguardar recarregamento
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(4); // 2 iniciais + 2 reload
      });
    });
  });

  describe('Estado Vazio', () => {
    beforeEach(() => {
      global.fetch = jest.fn((url) => {
        if (url === '/api/rh/empresas') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          });
        }

        if (url === '/api/rh/dashboard') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                total_empresas: 0,
                total_funcionarios: 0,
                total_avaliacoes: 0,
                avaliacoes_concluidas: 0,
              }),
          });
        }

        return Promise.reject(new Error('URL não mockada'));
      }) as jest.Mock;
    });

    it('deve exibir mensagem de estado vazio quando não há empresas', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa cadastrada')
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Para começar a gerenciar avaliações psicossociais/i)
      ).toBeInTheDocument();
    });

    it('deve exibir estatísticas zeradas no estado vazio', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Total de Empresas')).toBeInTheDocument();
      });

      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThanOrEqual(4);
    });

    it('deve manter botão "Nova Empresa" visível no estado vazio', async () => {
      render(<RhPage />);

      await waitFor(() => {
        expect(
          screen.getByText('Nenhuma empresa cadastrada')
        ).toBeInTheDocument();
      });

      const botaoNovaEmpresa = screen.getByRole('button', {
        name: /nova empresa/i,
      });
      expect(botaoNovaEmpresa).toBeInTheDocument();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve lidar com erro ao carregar empresas', async () => {
      global.fetch = jest.fn((url) => {
        if (url === '/api/rh/empresas') {
          return Promise.reject(new Error('Erro ao carregar'));
        }

        if (url === '/api/rh/dashboard') {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockStats),
          });
        }

        return Promise.reject(new Error('URL não mockada'));
      }) as jest.Mock;

      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('deve lidar com resposta não-ok das APIs', async () => {
      global.fetch = jest.fn((url) => {
        return Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: 'Erro' }),
        });
      }) as jest.Mock;

      render(<RhPage />);

      await waitFor(() => {
        expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
      });

      // Página deve renderizar mesmo com erro
      expect(
        screen.getByText('Nenhuma empresa cadastrada')
      ).toBeInTheDocument();
    });
  });
});
