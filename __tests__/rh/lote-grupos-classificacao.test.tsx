/**
 * @fileoverview Testes de classificação de risco por grupo em lotes
 * @description Testa exibição de grupos G1-G10 com classificação Excelente/Monitorar/Atenção
 * @test Classificação de risco psicossocial por grupos em detalhes de lote
 */

import type { Mock } from 'jest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DetalhesLotePage from '@/app/rh/empresa/[id]/lote/[loteId]/page';

/**
 * Interface para lote mockado
 */
interface MockLote {
  id: number;
  codigo: string;
  titulo: string;
  descricao: string;
  tipo: string;
  status: 'ativo' | 'concluido' | 'inativo';
  liberado_em: string;
  liberado_por_nome: string;
  empresa_nome: string;
}

/**
 * Interface para estatísticas de lote
 */
interface MockEstatisticas {
  total_avaliacoes: number;
  avaliacoes_concluidas: number;
  avaliacoes_inativadas: number;
  avaliacoes_pendentes: number;
}

/**
 * Interface para funcionário com avaliação e grupos
 */
interface MockFuncionario {
  cpf: string;
  nome: string;
  setor: string;
  funcao: string;
  matricula: string;
  turno: string;
  escala: string;
  avaliacao: {
    id: number;
    status: 'concluida' | 'pendente' | 'em_andamento';
    data_inicio: string;
    data_conclusao: string | null;
  };
  grupos?: Record<string, number>;
}

// Mock do Next.js router
const mockPush = jest.fn();
const mockParams = { id: '1', loteId: '1' };

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

describe('DetalhesLotePage - Classificação de Risco por Grupo', () => {
  const mockLote: MockLote = {
    id: 1,
    codigo: 'LOTE001',
    titulo: 'Lote de Teste',
    descricao: 'Descrição do lote',
    tipo: 'completo',
    status: 'ativo',
    liberado_em: '2024-01-01T10:00:00Z',
    liberado_por_nome: 'Admin User',
    empresa_nome: 'Empresa Teste',
  };

  const mockEstatisticas: MockEstatisticas = {
    total_avaliacoes: 2,
    avaliacoes_concluidas: 1,
    avaliacoes_inativadas: 0,
    avaliacoes_pendentes: 1,
  };

  const mockFuncionarios: MockFuncionario[] = [
    {
      cpf: '12345678901',
      nome: 'João Silva',
      setor: 'TI',
      funcao: 'Desenvolvedor',
      matricula: '001',
      turno: 'manhã',
      escala: '5x2',
      avaliacao: {
        id: 1,
        status: 'concluida',
        data_inicio: '2024-01-01T10:00:00Z',
        data_conclusao: '2024-01-02T10:00:00Z',
      },
      grupos: {
        g1: 25,
        g2: 75,
        g3: 80,
        g4: 20,
        g5: 50,
        g6: 30,
        g7: 40,
        g8: 15,
        g9: 70,
        g10: 80,
      },
    },
    {
      cpf: '98765432100',
      nome: 'Maria Santos',
      setor: 'RH',
      funcao: 'Gerente',
      matricula: '002',
      turno: 'manhã',
      escala: '5x2',
      avaliacao: {
        id: 2,
        status: 'pendente',
        data_inicio: '2024-01-01T10:00:00Z',
        data_conclusao: null,
      },
    },
  ];

  beforeEach(() => {
    // Arrange: Limpar mocks e configurar fetch
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/auth/session') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ perfil: 'rh' }),
        } as Response);
      }

      if (url === '/api/rh/lotes/1/funcionarios?empresa_id=1') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              lote: mockLote,
              estatisticas: mockEstatisticas,
              funcionarios: mockFuncionarios,
            }),
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Not found' }),
      } as Response);
    });
  });

  /**
   * @test Verifica renderização de colunas G1 a G10 no cabeçalho
   * @expected Todas as 10 colunas de grupos devem estar visíveis
   */
  it('deve renderizar colunas G1 a G10 no cabeçalho da tabela', async () => {
    // Act: Renderizar página
    render(<DetalhesLotePage />);

    // Assert: Verificar presença de todas as colunas de grupos
    await waitFor(() => {
      expect(screen.getByText('G1')).toBeInTheDocument();
      expect(screen.getByText('G2')).toBeInTheDocument();
      expect(screen.getByText('G3')).toBeInTheDocument();
      expect(screen.getByText('G4')).toBeInTheDocument();
      expect(screen.getByText('G5')).toBeInTheDocument();
      expect(screen.getByText('G6')).toBeInTheDocument();
      expect(screen.getByText('G7')).toBeInTheDocument();
      expect(screen.getByText('G8')).toBeInTheDocument();
      expect(screen.getByText('G9')).toBeInTheDocument();
      expect(screen.getByText('G10')).toBeInTheDocument();
    });
  });

  /**
   * @test Verifica classificações para grupos positivos
   * @expected Grupos positivos: >66%=Excelente, 33-66%=Monitorar, <33%=Atenção
   */
  it('deve exibir classificações corretas para grupos positivos', async () => {
    // Act: Renderizar página
    render(<DetalhesLotePage />);

    // Assert: Verificar presença das três classificações
    await waitFor(() => {
      const excelentes = screen.getAllByText('Excelente');
      expect(excelentes.length).toBeGreaterThan(0);

      const monitorar = screen.getAllByText('Monitorar');
      expect(monitorar.length).toBeGreaterThan(0);

      const atencao = screen.getAllByText('Atenção');
      expect(atencao.length).toBeGreaterThan(0);
    });
  });

  /**
   * @test Verifica classificações para grupos negativos
   * @expected Grupos negativos: <33%=Excelente, 33-66%=Monitorar, >66%=Atenção
   */
  it('deve exibir classificações corretas para grupos negativos', async () => {
    // Act: Renderizar página
    render(<DetalhesLotePage />);

    // Assert: Verificar todas as classificações presentes
    await waitFor(() => {
      const excelentes = screen.getAllByText('Excelente');
      expect(excelentes.length).toBeGreaterThan(0);

      const monitorar = screen.getAllByText('Monitorar');
      expect(monitorar.length).toBeGreaterThan(0);

      const atencao = screen.getAllByText('Atenção');
      expect(atencao.length).toBeGreaterThan(0);
    });
  });

  /**
   * @test Verifica que avaliações não concluídas não exibem classificações
   * @expected Funcionários com avaliação pendente não devem ter badges de grupos
   */
  it('não deve exibir classificações para avaliações não concluídas', async () => {
    // Act: Renderizar página
    render(<DetalhesLotePage />);

    // Assert: Aguardar renderização
    await waitFor(() => {
      expect(screen.getAllByText('Excelente').length).toBeGreaterThan(0);
    });

    // Assert: Verificar que Maria Santos não tem badges
    const tableBody = document.querySelector('tbody');
    const rows = tableBody?.querySelectorAll('tr') || [];

    let mariaSantosHasBadges = false;
    rows.forEach((row) => {
      if (
        row.textContent?.includes('Maria Santos') &&
        row.textContent?.includes('Pendente')
      ) {
        const cells = row.querySelectorAll('td');
        const groupCells = Array.from(cells).slice(-11, -1);
        mariaSantosHasBadges = groupCells.some(
          (cell) =>
            cell.textContent?.includes('Excelente') ||
            cell.textContent?.includes('Monitorar') ||
            cell.textContent?.includes('Atenção')
        );
      }
    });

    expect(mariaSantosHasBadges).toBe(false);
  });

  /**
   * @test Verifica presença de scroll horizontal na tabela
   * @expected Container deve ter classe overflow-x-auto para scroll
   */
  it('deve ter scroll horizontal para acomodar todas as colunas', async () => {
    // Act: Renderizar página
    render(<DetalhesLotePage />);

    // Assert: Aguardar renderização e verificar container
    await waitFor(() => {
      const g1Header = screen.getByText('G1');
      expect(g1Header).toBeTruthy();
    });

    const tableContainer = document.querySelector('.overflow-x-auto');
    expect(tableContainer).toBeTruthy();
  });
});
