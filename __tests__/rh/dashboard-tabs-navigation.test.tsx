/**
 * @fileoverview Testes de Sistema de Abas do Dashboard
 * @description Testa navegação entre abas "Ciclos de Coletas Avaliativas" e "Funcionários"
 * @test Sistema de abas do dashboard de empresa
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

describe('📑 Sistema de Abas - Dashboard', () => {
  const mockPush = jest.fn();
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Teste',
    perfil: 'rh',
  };
  const mockFuncionarios = createMockFuncionarios(20);

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
   * @test Verifica exibição das duas abas principais
   * @expected Deve exibir "Ciclos de Coletas Avaliativas" e "Funcionários"
   */
  it('deve exibir abas "Ciclos de Coletas Avaliativas" e "Funcionários"', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Verificar abas presentes
    await waitFor(() => {
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
      expect(screen.getByText(/Funcionários/i)).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica aba inicial ativa
   * @expected Deve iniciar na aba "Ciclos de Coletas Avaliativas"
   */
  it('deve iniciar na aba "Ciclos de Coletas Avaliativas"', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Verificar conteúdo da aba ativa
    await waitFor(() => {
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
      expect(screen.getByText('🚀 Iniciar Novo Ciclo')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica navegação entre abas
   * @expected Deve alternar para aba "Funcionários" ao clicar
   */
  it('deve alternar para aba "Funcionários" ao clicar', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    await waitFor(() => {
      expect(
        screen.getByText('📋 Ciclos de Coletas Avaliativas')
      ).toBeInTheDocument();
    });

    // Act: Clicar em aba Funcionários
    const funcionariosTab = screen.getByText(/Funcionários Ativos/i);
    fireEvent.click(funcionariosTab);

    // Assert: Verificar conteúdo da nova aba
    await waitFor(() => {
      expect(screen.getByText(/Total de Funcionários/i)).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica destaque visual da aba ativa
   * @expected Aba ativa deve ter classe "border-primary"
   */
  it('deve destacar aba ativa visualmente', async () => {
    // Act: Renderizar
    render(<EmpresaDashboardPage />);

    // Assert: Verificar classe inicial
    await waitFor(() => {
      const lotesTab = screen.getByText('📋 Ciclos de Coletas Avaliativas');
      expect(lotesTab).toHaveClass('border-primary');
    });

    // Act: Alternar aba
    const funcionariosTab = screen.getByText(/Funcionários/i);
    fireEvent.click(funcionariosTab);

    // Assert: Verificar nova classe ativa
    await waitFor(() => {
      expect(funcionariosTab).toHaveClass('border-primary');
      const lotesTab = screen.getByText('📋 Ciclos de Coletas Avaliativas');
      expect(lotesTab).not.toHaveClass('border-primary');
    });
  });
});
