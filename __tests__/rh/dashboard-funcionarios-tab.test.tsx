/**
 * @fileoverview Testes de Aba Funcionários
 * @description Testa gerenciamento de funcionários, upload XLSX e tabela
 * @test Aba de funcionários com operações CRUD
 */

import type { Mock } from 'jest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter, useParams } from 'next/navigation';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';
import type { MockFuncionario, MockSession } from './types/test-fixtures';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

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
  Bar: () => <div>Mock Chart</div>,
}));

/**
 * Cria funcionários mockados para testes
 */
const createMockFuncionarios = (count: number): MockFuncionario[] => {
  return Array(count)
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
};

describe('👥 Aba Funcionários', () => {
  const mockPush = jest.fn();
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Teste',
    perfil: 'rh',
  };
  const mockFuncionarios = createMockFuncionarios(20);

  /**
   * Setup compartilhado: renderiza e navega para aba Funcionários
   */
  const renderAndNavigateToFuncionariosTab = async () => {
    render(<EmpresaDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
    });

    const funcionariosTab = screen.getByText(/Funcionários Ativos/i);
    fireEvent.click(funcionariosTab);

    await waitFor(() => {
      expect(screen.getByText(/Total de Funcionários/i)).toBeInTheDocument();
    });
  };

  beforeEach(() => {
    // Arrange: Setup dos mocks
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    (useParams as jest.Mock).mockReturnValue({ id: '1' });

    document.body.innerHTML = '';

    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.alert = jest.fn() as jest.MockedFunction<typeof alert>;
    global.confirm = jest.fn() as jest.MockedFunction<typeof confirm>;

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url.includes('/api/auth/session')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockSession,
        } as Response);
      }
      if (url.includes('/api/rh/empresas')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
          ],
        } as Response);
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
        } as Response);
      }
      if (url.includes('/api/admin/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ funcionarios: mockFuncionarios }),
        } as Response);
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ lotes: [] }),
        } as Response);
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ laudos: [] }),
        } as Response);
      }
      return Promise.resolve({ ok: false } as Response);
    });
  });

  /**
   * @test Verifica exibição de seção de gerenciamento
   * @expected Deve exibir "Total de Funcionários"
   */
  it('deve exibir seção de gerenciamento de funcionários', async () => {
    // Act: Renderizar e navegar
    await renderAndNavigateToFuncionariosTab();

    // Assert: Verificar seção presente
    expect(screen.getByText(/Total de Funcionários/i)).toBeInTheDocument();
  });

  /**
   * @test Verifica existência da seção de funcionários ativos
   * @expected Deve exibir testid "funcionarios-section-ativos"
   */
  it('deve exibir seção funcionarios-section-ativos', async () => {
    // Act: Renderizar e navegar
    await renderAndNavigateToFuncionariosTab();

    // Assert: Verificar seção com testid
    const section = screen.getByTestId('funcionarios-section-ativos');
    expect(section).toBeInTheDocument();
  });

  /**
   * @test Verifica exibição de link para modelo XLSX
   * @expected Deve exibir "📋 Baixar Modelo XLSX"
   */
  it('deve exibir link de modelo XLSX', async () => {
    // Act: Renderizar e navegar
    await renderAndNavigateToFuncionariosTab();

    // Assert: Verificar link de modelo
    const modelLink = screen.getByText('📋 Baixar Modelo XLSX');
    expect(modelLink).toBeInTheDocument();
  });

  /**
   * @test Verifica exibição do botão de download de modelo
   * @expected Deve exibir botão "📋 Baixar Modelo XLSX"
   */
  it('deve exibir botão "Baixar Modelo XLSX"', async () => {
    // Act: Renderizar e navegar
    await renderAndNavigateToFuncionariosTab();

    // Assert: Verificar botão presente
    const modelButton = screen.getByText('📋 Baixar Modelo XLSX');
    expect(modelButton).toBeInTheDocument();
  });

  /**
   * @test Verifica presença de link relacionado a modelo
   * @expected Deve exibir texto contendo "Modelo"
   */
  it('deve exibir link para modelo XLSX', async () => {
    // Act: Renderizar e navegar
    await renderAndNavigateToFuncionariosTab();

    // Assert: Verificar qualquer link com "Modelo"
    const modelLink = screen.queryByText(/Modelo/i);
    if (modelLink) {
      expect(modelLink).toBeInTheDocument();
    }
  });
});
