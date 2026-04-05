/**
 * @file __tests__/integracao/empresa-dashboard-refatorada.test.tsx
 * Testes: Integração: EmpresaDashboardPage refatorada
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';

// Mock das dependências
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/components/ModalInserirFuncionario', () => {
  return function MockModal() {
    return <div data-testid="modal-inserir">Modal Inserir</div>;
  };
});

jest.mock('@/components/EditEmployeeModal', () => {
  return function MockModal() {
    return <div data-testid="modal-editar">Modal Editar</div>;
  };
});

jest.mock('@/components/RelatorioSetor', () => {
  return function MockRelatorio() {
    return <div data-testid="relatorio-setor">Relatório Setor</div>;
  };
});

jest.mock('@/components/DetalhesFuncionario', () => {
  return function MockDetalhes() {
    return <div data-testid="detalhes-funcionario">Detalhes</div>;
  };
});

jest.mock('@/components/LaudosSection', () => {
  return function MockLaudos() {
    return <div data-testid="laudos-section">Laudos</div>;
  };
});

global.fetch = jest.fn();

describe('Integração: EmpresaDashboardPage refatorada', () => {
  const mockPush = jest.fn();
  const mockParams = { id: '1' };
  const mockSearchParams = { get: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (require('next/navigation').useParams as jest.Mock).mockReturnValue(
      mockParams
    );
    (require('next/navigation').useSearchParams as jest.Mock).mockReturnValue(
      mockSearchParams
    );
  });

  const setupMocks = () => {
    // Mock sessão
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            cpf: '12345678900',
            nome: 'Admin',
            perfil: 'rh',
          }),
        });
      }

      if (url === '/api/rh/empresas') {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, nome: 'Empresa Teste', cnpj: '12345678000190' },
          ],
        });
      }

      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            stats: {
              total_avaliacoes: 10,
              concluidas: 5,
              funcionarios_avaliados: 8,
            },
            resultados: [],
            distribuicao: [],
          }),
        });
      }

      if (url.includes('/api/rh/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            funcionarios: [
              {
                cpf: '12345678900',
                nome: 'João Silva',
                setor: 'TI',
                funcao: 'Desenvolvedor',
                email: 'joao@example.com',
                matricula: '001',
                nivel_cargo: 'operacional',
                turno: 'manhã',
                escala: '8x5',
                empresa_nome: 'Empresa Teste',
                ativo: true,
                data_inclusao: '2024-01-01',
                criado_em: '2024-01-01',
                atualizado_em: '2024-01-01',
              },
            ],
          }),
        });
      }

      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            lotes: [
              {
                id: 1,
                titulo: 'Lote Teste',
                tipo: 'periodico',
                liberado_em: '2024-01-01T10:00:00',
                status: 'ativo',
                total_avaliacoes: 10,
                avaliacoes_concluidas: 5,
                avaliacoes_inativadas: 1,
              },
            ],
          }),
        });
      }

      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ laudos: [] }),
        });
      }

      if (url.includes('/api/rh/pendencias')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ anomalias: [] }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    });
  };

  it('deve carregar e exibir dados da empresa após refatoração', async () => {
    setupMocks();

    render(<EmpresaDashboardPage />);

    // Aguardar carregamento
    await waitFor(
      () => {
        expect(
          screen.queryByRole('status', { hidden: true })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar se o header foi renderizado com componente extraído
    await waitFor(() => {
      expect(screen.getByText(/Dashboard Empresa Teste/i)).toBeInTheDocument();
    });
  });

  it('deve navegar entre abas usando componente TabNavigation', async () => {
    setupMocks();

    render(<EmpresaDashboardPage />);

    await waitFor(
      () => {
        expect(
          screen.queryByRole('status', { hidden: true })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar se as abas estão presentes
    await waitFor(() => {
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
      expect(screen.getByText('👥 Funcionários')).toBeInTheDocument();
      expect(screen.getByText('⚠️ Pendências')).toBeInTheDocument();
    });

    // Clicar na aba de funcionários
    const abaFuncionarios = screen.getByText('👥 Funcionários');
    fireEvent.click(abaFuncionarios);

    // Verificar se mudou de aba
    await waitFor(() => {
      expect(abaFuncionarios.closest('button')).toHaveClass('border-primary');
    });
  });

  it('deve exibir lotes usando componente LotesGrid', async () => {
    setupMocks();

    render(<EmpresaDashboardPage />);

    await waitFor(
      () => {
        expect(
          screen.queryByRole('status', { hidden: true })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar se o lote é exibido
    await waitFor(() => {
      expect(screen.getByText('Lote Teste')).toBeInTheDocument();
      expect(screen.getByText('LOTE-001')).toBeInTheDocument();
    });
  });

  it('deve usar hooks customizados para carregar dados', async () => {
    setupMocks();

    render(<EmpresaDashboardPage />);

    await waitFor(
      () => {
        expect(
          screen.queryByRole('status', { hidden: true })
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Verificar se as chamadas de API foram feitas (pelos hooks)
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/session');
    expect(global.fetch).toHaveBeenCalledWith('/api/rh/empresas');
    expect(global.fetch).toHaveBeenCalledWith('/api/rh/dashboard?empresa_id=1');
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/rh/funcionarios?empresa_id=1'
    );
    expect(global.fetch).toHaveBeenCalledWith('/api/rh/lotes?empresa_id=1');
  });

  it('deve redirecionar para login se sessão inválida', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    render(<EmpresaDashboardPage />);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });
});
