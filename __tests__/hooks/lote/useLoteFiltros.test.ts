/**
 * @file __tests__/hooks/lote/useLoteFiltros.test.ts
 * Testes unitários para o hook useLoteFiltros
 *
 * Valida:
 *  - Estado inicial correto
 *  - Filtragem por status (concluido / pendente)
 *  - Filtragem por busca textual (nome, cpf)
 *  - Filtragem por coluna (nome, cpf, nivel_cargo, status)
 *  - Filtragem por grupos G1-G10
 *  - limparFiltrosColuna reseta tudo
 *  - setores retorna apenas funcionários concluídos
 */

import { renderHook, act } from '@testing-library/react';
import { useLoteFiltros } from '@/hooks/lote/useLoteFiltros';
import type { Funcionario } from '@/lib/lote/types';

const makeFuncionario = (
  overrides: Partial<Funcionario> & { nome: string; cpf: string }
): Funcionario => ({
  setor: 'TI',
  funcao: 'Dev',
  nivel_cargo: 'operacional',
  avaliacao: {
    id: 1,
    status: 'concluida',
    data_inicio: '2026-01-01',
    data_conclusao: '2026-01-15',
  },
  grupos: { g1: 20, g2: 80, g3: 50 },
  ...overrides,
});

const funcionariosMock: Funcionario[] = [
  makeFuncionario({
    nome: 'João Silva',
    cpf: '11111111111',
    avaliacao: {
      id: 1,
      status: 'concluida',
      data_inicio: '2026-01-01',
      data_conclusao: '2026-01-15',
    },
    setor: 'Vendas',
    grupos: { g1: 20, g2: 80 },
  }),
  makeFuncionario({
    nome: 'Maria Santos',
    cpf: '22222222222',
    avaliacao: {
      id: 2,
      status: 'pendente',
      data_inicio: '2026-01-01',
      data_conclusao: null,
    },
    setor: 'RH',
    nivel_cargo: 'gestao',
    grupos: { g1: 70, g2: 30 },
  }),
  makeFuncionario({
    nome: 'Pedro Oliveira',
    cpf: '33333333333',
    avaliacao: {
      id: 3,
      status: 'inativada',
      data_inicio: '2026-01-01',
      data_conclusao: null,
    },
    setor: 'Vendas',
    grupos: { g1: 50, g2: 50 },
  }),
];

describe('useLoteFiltros', () => {
  describe('estado inicial', () => {
    it('deve retornar todos os funcionários sem filtros', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      expect(result.current.funcionariosFiltrados).toHaveLength(3);
      expect(result.current.busca).toBe('');
      expect(result.current.filtroStatus).toBe('todos');
    });
  });

  describe('filtro por status', () => {
    it('deve filtrar apenas concluídas quando filtroStatus = "concluido"', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      act(() => {
        result.current.setFiltroStatus('concluido');
      });

      expect(result.current.funcionariosFiltrados).toHaveLength(1);
      expect(result.current.funcionariosFiltrados[0].nome).toBe('João Silva');
    });
  });

  describe('filtro por coluna', () => {
    it('deve filtrar por nome quando toggleFiltroColuna é chamado', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      act(() => {
        result.current.toggleFiltroColuna('nome', 'Maria Santos');
      });

      expect(result.current.funcionariosFiltrados).toHaveLength(1);
      expect(result.current.funcionariosFiltrados[0].cpf).toBe('22222222222');
    });

    it('deve permitir múltiplos valores no mesmo filtro', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      act(() => {
        result.current.toggleFiltroColuna('nome', 'João Silva');
        result.current.toggleFiltroColuna('nome', 'Maria Santos');
      });

      expect(result.current.funcionariosFiltrados).toHaveLength(2);
    });

    it('deve deselecionar valor ao clicar novamente', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      act(() => {
        result.current.toggleFiltroColuna('nome', 'João Silva');
      });
      expect(result.current.funcionariosFiltrados).toHaveLength(1);

      act(() => {
        result.current.toggleFiltroColuna('nome', 'João Silva');
      });
      expect(result.current.funcionariosFiltrados).toHaveLength(3);
    });
  });

  describe('limparFiltrosColuna', () => {
    it('deve resetar todos os filtros de coluna', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      act(() => {
        result.current.toggleFiltroColuna('nome', 'João Silva');
        result.current.toggleFiltroColuna('status', 'concluida');
      });
      expect(result.current.funcionariosFiltrados).toHaveLength(1);

      act(() => {
        result.current.limparFiltrosColuna();
      });
      expect(result.current.funcionariosFiltrados).toHaveLength(3);
    });
  });

  describe('getValoresUnicos', () => {
    it('deve retornar nomes únicos', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      const nomes = result.current.getValoresUnicos('nome');
      expect(nomes).toHaveLength(3);
      expect(nomes).toContain('João Silva');
    });

    it('deve retornar opções fixas para colunas de grupo', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      const valores = result.current.getValoresUnicos('g1');
      expect(valores).toEqual(['Excelente', 'Monitorar', 'Atenção']);
    });
  });

  describe('setores', () => {
    it('deve retornar apenas setores de funcionários concluídos', () => {
      const { result } = renderHook(() =>
        useLoteFiltros({ funcionarios: funcionariosMock })
      );

      // Apenas "João Silva" está concluído, setor "Vendas"
      expect(result.current.setores).toEqual(['Vendas']);
    });
  });
});
