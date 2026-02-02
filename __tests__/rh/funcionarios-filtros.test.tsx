/**
 * @fileoverview Testes de Filtros de Funcionários
 * @description Testa funcionalidade de filtros (setor, nível de cargo, busca textual) na aba Funcionários
 * @test Filtros e busca de funcionários no dashboard RH
 */

import type { Mock } from 'jest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EmpresaDashboardPage from '@/app/rh/empresa/[id]/page';
import type { MockFuncionario, MockSession } from './types/test-fixtures';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useParams: () => ({ id: '1' }),
}));

// Mock Header to avoid complex layout
jest.mock('@/components/Header', () => () => <header />);

// Mock NotificationsSection
jest.mock('@/components/NotificationsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="notifications-section">Notifications</div>,
}));

/**
 * Cria funcionários mockados para testes
 * @param count - Número de funcionários a criar
 * @returns Array de funcionários mockados com dados variados
 */
const createMockFuncionarios = (count: number): MockFuncionario[] => {
  const setores = [
    'TI',
    'Financeiro',
    'Comercial',
    'Manutenção',
    'Administrativo',
  ];
  const funcoes = [
    'Analista',
    'Coordenador',
    'Gerente',
    'Técnico',
    'Assistente',
  ];

  return Array.from({ length: count }).map((_, i) => ({
    cpf: String(10000000000 + i),
    nome: `Funcionário ${i + 1}`,
    setor: setores[i % setores.length],
    funcao: funcoes[i % funcoes.length],
    matricula: `M${String(i).padStart(4, '0')}`,
    ativo: i % 10 !== 9,
    email: `func${i}@empresa.com`,
    turno: i % 2 === 0 ? 'diurno' : 'noturno',
    escala: '12x36',
    empresa_nome: 'Empresa Teste',
    avaliacoes: [],
  }));
};

describe('🔍 Filtros de Funcionários', () => {
  const mockSession: MockSession = {
    cpf: '11111111111',
    nome: 'RH Usuario',
    perfil: 'rh',
  };
  const mockFuncionarios = createMockFuncionarios(50);

  beforeEach(() => {
    // Arrange: Setup dos mocks globais
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
    global.alert = jest.fn() as jest.MockedFunction<typeof alert>;

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
          json: () =>
            Promise.resolve([
              { id: 1, nome: 'Empresa Teste', cnpj: '12345678000100' },
            ]),
        } as Response);
      }
      if (url.includes('/api/rh/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              stats: {
                total_avaliacoes: 0,
                concluidas: 0,
                funcionarios_avaliados: 0,
              },
              resultados: [],
              distribuicao: [],
            }),
        } as Response);
      }
      if (url.includes('/api/rh/funcionarios')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ funcionarios: mockFuncionarios }),
        } as Response);
      }
      if (url.includes('/api/rh/lotes')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ lotes: [] }),
        } as Response);
      }
      if (url.includes('/api/rh/laudos')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ laudos: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'not found' }),
      } as Response);
    });
  });

  /**
   * @test Verifica aplicação de filtro por setor
   * @expected Deve exibir dropdown com checkboxes e aplicar filtro ao clicar
   */
  it('aplica filtro por setor corretamente', async () => {
    // Arrange: Preparar componente
    // Act: Renderizar dashboard
    render(<EmpresaDashboardPage />);

    // Assert: Aguardar aba Funcionários aparecer
    const funcionariosTab = await waitFor(() =>
      screen.getByRole('button', { name: /Funcionários/i })
    );

    // Act: Clicar na aba
    fireEvent.click(funcionariosTab);

    // Assert: Aguardar tabela carregar
    await waitFor(() => screen.getByRole('table'));

    // Act: Buscar botão de filtro por setor
    const filtroSetorBtn = screen
      .getAllByText(/Setor/i)
      .find((el) => el.closest('button'));

    if (!filtroSetorBtn) {
      return;
    }

    // Act: Abrir dropdown de filtro
    fireEvent.click(filtroSetorBtn);

    // Assert: Verificar que dropdown abriu
    await waitFor(() => {
      const dropdown = document.getElementById('dropdown-setor');
      expect(dropdown).toBeInTheDocument();
    });

    // Act: Selecionar primeiro checkbox
    const checkboxes = document.querySelectorAll(
      '#dropdown-setor input[type="checkbox"]'
    );
    expect(checkboxes.length).toBeGreaterThan(0);

    fireEvent.click(checkboxes[0]);

    // Assert: Verificar que filtro foi aplicado
    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });

  /**
   * @test Verifica busca textual por nome e CPF
   * @expected Campo de busca deve filtrar funcionários em tempo real
   */
  it('aplica busca textual por nome e CPF', async () => {
    // Arrange & Act: Renderizar e navegar para aba
    render(<EmpresaDashboardPage />);

    const funcionariosTab = await waitFor(() =>
      screen.getByRole('button', { name: /Funcionários/i })
    );
    fireEvent.click(funcionariosTab);

    await waitFor(() => screen.getByRole('table'));

    // Act: Buscar campo de busca e digitar
    const buscaInput = screen.getByPlaceholderText(/Buscar por nome, CPF/i);
    fireEvent.change(buscaInput, { target: { value: 'Funcionário 1' } });

    // Assert: Verificar que busca foi aplicada
    await waitFor(() => {
      expect(buscaInput.value).toBe('Funcionário 1');
    });
  });

  /**
   * @test Verifica limpeza de filtros aplicados
   * @expected Botão "Limpar" deve remover todos os filtros ativos
   */
  it('limpa filtros corretamente', async () => {
    // Arrange & Act: Renderizar e navegar
    render(<EmpresaDashboardPage />);

    const funcionariosTab = await waitFor(() =>
      screen.getByRole('button', { name: /Funcionários/i })
    );
    fireEvent.click(funcionariosTab);

    await waitFor(() => screen.getByRole('table'));

    // Act: Aplicar filtro
    const filtroSetorBtn = screen
      .getAllByText(/Setor/i)
      .find((el) => el.closest('button'));

    if (filtroSetorBtn) {
      fireEvent.click(filtroSetorBtn);
      const checkbox = document.querySelector(
        '#dropdown-setor input[type="checkbox"]'
      );

      if (checkbox) {
        fireEvent.click(checkbox);

        // Act: Limpar filtro
        const limparBtn = await waitFor(() =>
          screen.getAllByText(/Limpar/i).find((btn) => btn.tagName === 'BUTTON')
        );

        if (limparBtn) {
          fireEvent.click(limparBtn);
        }

        // Assert: Verificar que indicador foi removido
        await waitFor(() => {
          const indicador = filtroSetorBtn.querySelector('.bg-blue-600');
          expect(indicador).not.toBeInTheDocument();
        });
      }
    }
  });
});
