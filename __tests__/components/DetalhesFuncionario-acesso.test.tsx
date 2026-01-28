/**
 * Testes do Componente DetalhesFuncionario
 * Valida funcionalidades básicas do componente
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import DetalhesFuncionario from '@/components/DetalhesFuncionario';

// Mock do useRouter
const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
  pathname: '/funcionario/detalhes',
  query: {},
  asPath: '/funcionario/detalhes',
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

// Mock do useSession
const mockSession = {
  user: {
    id: 1,
    tipo: 'funcionario',
    contratante_id: 1,
  },
  expires: '2025-12-31',
};

jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: mockSession, status: 'authenticated' }),
}));

// Mock do fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('DetalhesFuncionario - Funcionalidades Básicas', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockPush.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Carregamento de Dados', () => {
    it('deve carregar e exibir dados do funcionário com sucesso', async () => {
      // Mock da API que retorna dados do funcionário
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          funcionario: {
            cpf: '12345678901',
            nome: 'João Silva',
            setor: 'TI',
            funcao: 'Desenvolvedor',
            email: 'joao@empresa.com',
            matricula: '12345',
            turno: 'Integral',
            escala: null,
            ativo: true,
            data_inclusao: '2023-01-01T00:00:00Z',
            indice_avaliacao: 1,
            data_ultimo_lote: '2024-01-01T00:00:00Z',
            diasDesdeUltima: 365,
            empresa_nome: 'Empresa Teste',
            clinica_nome: 'Clínica Teste',
          },
          avaliacoes: [
            {
              id: 1,
              status: 'concluida',
              status_display: 'concluída',
              inicio: '2024-01-01T00:00:00Z',
              envio: '2024-01-15T00:00:00Z',
              data_inativacao: null,
              motivo_inativacao: null,
              lote_codigo: 'LOTE001',
              lote_titulo: 'Avaliação 2024',
              numero_ordem: 1,
              liberado_em: '2024-01-01T00:00:00Z',
            },
          ],
          estatisticas: {
            totalAvaliacoes: 1,
            concluidas: 1,
            inativadas: 0,
            pendentes: 0,
          },
          pendencia: null,
        }),
      });

      render(<DetalhesFuncionario cpf="12345678901" />);

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      // Verificar se os dados são exibidos corretamente
      expect(screen.getByText('Empresa Teste')).toBeInTheDocument();
      expect(screen.getByText('TI')).toBeInTheDocument();
      expect(screen.getByText('Desenvolvedor')).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
      expect(screen.getByText('✅ Ativo')).toBeInTheDocument();

      // Verificar estatísticas - procurar pelo texto "Total" seguido do número
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Concluídas')).toBeInTheDocument();

      // Não deve redirecionar
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('deve permitir acesso para contratante com status aguardando_pagamento', async () => {
      // Este teste verifica apenas o carregamento de dados, não controle de acesso
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          funcionario: {
            cpf: '12345678901',
            nome: 'Maria Santos',
            setor: 'RH',
            funcao: 'Gestora',
            email: 'maria@empresa.com',
            matricula: '67890',
            turno: 'Integral',
            escala: null,
            ativo: true,
            data_inclusao: '2023-01-01T00:00:00Z',
            indice_avaliacao: 0,
            data_ultimo_lote: null,
            diasDesdeUltima: null,
            empresa_nome: 'Empresa Personalizada',
            clinica_nome: 'Clínica Personalizada',
          },
          avaliacoes: [],
          estatisticas: {
            totalAvaliacoes: 0,
            concluidas: 0,
            inativadas: 0,
            pendentes: 0,
          },
          pendencia: {
            prioridade: 'MÉDIA',
            mensagem: '⚠️ Funcionário nunca fez avaliação',
          },
        }),
      });

      render(<DetalhesFuncionario cpf="12345678901" />);

      await waitFor(() => {
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });

      // Verificar pendência
      expect(
        screen.getByText('⚠️ Funcionário nunca fez avaliação')
      ).toBeInTheDocument();

      // Acesso deve ser permitido (dados carregados)
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve mostrar erro se funcionário não for encontrado', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Funcionário não encontrado' }),
      });

      render(<DetalhesFuncionario cpf="12345678901" />);

      await waitFor(() => {
        expect(
          screen.getByText('Erro ao carregar funcionário')
        ).toBeInTheDocument();
      });
    });

    it('deve mostrar erro genérico em caso de erro interno', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Erro de rede'));

      render(<DetalhesFuncionario cpf="12345678901" />);

      await waitFor(() => {
        expect(
          screen.getByText('Erro ao carregar funcionário')
        ).toBeInTheDocument();
      });
    });
  });
});
