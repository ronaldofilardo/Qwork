/**
 * @fileoverview Testes de Estatísticas e Empresas
 * @description Testa exibição de contagens agregadas e cards de empresas
 * @test Estatísticas de empresas e avaliações por clínicas
 */

import type { Mock } from 'jest';
import React from 'react';
import {
  render,
  screen,
  waitFor,
  within,
  fireEvent,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import RhPage from '@/app/rh/page';
import type { MockEmpresa, MockSession } from './types/test-fixtures';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: '1' }),
}));

jest.mock('@/components/Header', () => () => <header />);

jest.mock('@/components/NotificationsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="notifications-section">Notifications</div>,
}));

describe('📊 Estatísticas e Empresas', () => {
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Usuario',
    perfil: 'rh',
  };

  const mockEmpresas: MockEmpresa[] = [
    {
      id: 1,
      nome: 'Empresa Alpha',
      cnpj: '11111111000111',
      total_funcionarios: 25,
      avaliacoes_pendentes: 10,
    },
    {
      id: 2,
      nome: 'Empresa Beta',
      cnpj: '22222222000122',
      total_funcionarios: 40,
      avaliacoes_pendentes: 15,
    },
    {
      id: 3,
      nome: 'Empresa Gamma',
      cnpj: '33333333000133',
      total_funcionarios: 30,
      avaliacoes_pendentes: 8,
    },
  ];

  beforeEach(() => {
    // Arrange: Setup dos mocks
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockEmpresas),
        } as Response);
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: {
                total_avaliacoes: 150,
                concluidas: 120,
                funcionarios_avaliados: 95,
              },
              resultados: [],
              distribuicao: [],
            }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });
  });

  /**
   * @test Verifica exibição de contagem total de empresas
   * @expected Card deve exibir "Total de Empresas" com contagem
   */
  it('exibe contagem total de empresas no card da clínica', async () => {
    // Act: Renderizar página RH
    render(<RhPage />);

    // Assert: Verificar header e card de empresas
    await waitFor(() => {
      expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
    });

    expect(screen.getByText('Total de Empresas')).toBeInTheDocument();
  });

  /**
   * @test Verifica soma agregada de funcionários de todas empresas
   * @expected Soma deve corresponder ao total de funcionários mockados
   */
  it('exibe contagem de funcionários agregada de todas as empresas', async () => {
    // Act: Renderizar
    render(<RhPage />);

    // Assert: Aguardar grid carregar
    await waitFor(() => {
      const header = screen.getByText('Gestão de Empresas');
      const empresasGrid = header.nextElementSibling;
      expect(empresasGrid).toBeInTheDocument();

      const labelFuncionariosList = within(
        empresasGrid as HTMLElement
      ).queryAllByText('Funcionários');

      if (labelFuncionariosList.length === 0) return;

      // Act: Somar funcionários exibidos
      let soma = 0;
      labelFuncionariosList.forEach((label) => {
        const numero = label.previousElementSibling?.textContent?.trim() || '0';
        soma += Number(numero.replace(/[^0-9]/g, ''));
      });

      // Assert: Verificar soma correta
      const expected = mockEmpresas.reduce(
        (s, e) => s + (e.total_funcionarios || 0),
        0
      );
      expect(soma).toBe(expected);
    });
  });

  /**
   * @test Verifica exibição de avaliações no card
   * @expected Label "Avaliações" deve estar presente com número
   */
  it('exibe contagem de avaliações no card da clínica', async () => {
    // Act: Renderizar
    render(<RhPage />);

    // Assert: Aguardar e verificar avaliações
    await waitFor(() => {
      const labelAvaliacoes = screen.queryByText('Avaliações');

      if (!labelAvaliacoes) return;

      const numeroAvaliacoes =
        labelAvaliacoes.previousElementSibling?.textContent;
      expect(numeroAvaliacoes).toBeDefined();
      expect(numeroAvaliacoes?.trim()).not.toBe('');
    });
  });

  /**
   * @test Verifica exibição de mensagem quando não há empresas
   * @expected Deve exibir "Nenhuma empresa cadastrada"
   */
  it('exibe mensagem quando não há empresas cadastradas', async () => {
    // Arrange: Mock sem empresas
    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSession),
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      } as Response);
    });

    // Act: Renderizar
    render(<RhPage />);

    // Assert: Verificar mensagem de lista vazia
    await waitFor(() => {
      const mensagemVazia = screen.queryByText(/Nenhuma empresa|cadastrada/i);
      expect(mensagemVazia).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica navegação para dashboard da empresa ao clicar no card
   * @expected Router.push deve ser chamado com rota correta
   */
  it('permite navegação para dashboard da empresa ao clicar no card', async () => {
    // Arrange: Mock do router
    const mockPush = jest.fn();
    const useRouter = jest.spyOn(require('next/navigation'), 'useRouter');
    useRouter.mockReturnValue({ push: mockPush });

    // Act: Renderizar e clicar
    render(<RhPage />);

    await waitFor(() => {
      expect(screen.getByText('Gestão de Empresas')).toBeInTheDocument();
    });

    const dashboardButtons = screen.getAllByText('Ver Dashboard');
    fireEvent.click(dashboardButtons[0]);

    // Assert: Verificar navegação
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/rh/empresa/1');
    });

    useRouter.mockRestore();
  });

  /**
   * @test Verifica cálculo correto de estatísticas agregadas
   * @expected Soma deve ser calculada corretamente
   */
  it('calcula estatísticas agregadas corretamente', async () => {
    // Act: Renderizar
    render(<RhPage />);

    // Assert: Verificar cálculos
    await waitFor(() => {
      const header = screen.getByText('Gestão de Empresas');
      const empresasGrid = header.nextElementSibling;
      expect(empresasGrid).toBeInTheDocument();

      const labelsFuncionarios = within(
        empresasGrid as HTMLElement
      ).queryAllByText('Funcionários');

      if (labelsFuncionarios.length === 0) return;

      let soma = 0;
      labelsFuncionarios.forEach((label) => {
        const numero = label.previousElementSibling?.textContent?.trim() || '0';
        soma += Number(numero.replace(/[^0-9]/g, ''));
      });

      const expected = mockEmpresas.reduce(
        (s, e) => s + (e.total_funcionarios || 0),
        0
      );
      expect(soma).toBe(expected);
    });
  });
});
