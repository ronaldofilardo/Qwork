/**
 * @fileoverview Testes do botão Reset em detalhes de lote
 * @description Testa funcionalidade de reset de avaliação concluída em lote ativo
 * @test Botão Reset para reabrir avaliações já concluídas
 */

import type { Mock } from 'jest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DetalhesLotePage from '@/app/entidade/lote/[id]/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: () => ({ id: '1' }),
}));

/**
 * Interface para resposta da API de detalhes do lote
 */
interface MockLoteDetalhes {
  success: boolean;
  lote: {
    id: number;
    codigo: string;
    status: 'ativo' | 'concluido' | 'inativo';
  };
  estatisticas: {
    total_funcionarios: number;
    funcionarios_concluidos: number;
    funcionarios_pendentes: number;
  };
  funcionarios: Array<{
    cpf: string;
    nome: string;
    nivel_cargo: string;
    avaliacao: {
      id: number;
      status: 'concluida' | 'pendente' | 'em_andamento';
      data_inicio: string;
    };
    grupos: Record<string, unknown>;
  }>;
}

describe('DetalhesLote - botão Reset', () => {
  beforeEach(() => {
    // Arrange: Limpar mocks antes de cada teste
    jest.clearAllMocks();
    global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;
  });

  /**
   * @test Verifica exibição do botão Reset para avaliação concluída em lote ativo
   * @expected Botão Reset deve aparecer e abrir modal ao clicar
   */
  it('exibe botão Reset para avaliação concluída quando lote ativo', async () => {
    // Arrange: Mock de resposta da API com lote ativo e avaliação concluída
    const mockResponse: MockLoteDetalhes = {
      success: true,
      lote: { id: 1, codigo: 'LOT', status: 'ativo' },
      estatisticas: {
        total_funcionarios: 1,
        funcionarios_concluidos: 1,
        funcionarios_pendentes: 0,
      },
      funcionarios: [
        {
          cpf: '123',
          nome: 'João',
          nivel_cargo: 'gestao',
          avaliacao: {
            id: 10,
            status: 'concluida',
            data_inicio: '2026-01-01',
          },
          grupos: {},
        },
      ],
    };

    (global.fetch as Mock).mockImplementation((url: string) => {
      if (url === '/api/entidade/lote/1') {
        return Promise.resolve({
          ok: true,
          json: async () => mockResponse,
        } as Response);
      }

      return Promise.resolve({
        ok: false,
        json: async () => ({ error: 'not found' }),
      } as Response);
    });

    // Act: Renderizar página de detalhes do lote
    render(<DetalhesLotePage />);

    // Assert: Aguardar botão Reset aparecer após carregamento
    expect(await screen.findByText('↻ Reset')).toBeInTheDocument();

    // Act: Clicar no botão Reset
    fireEvent.click(screen.getByText('↻ Reset'));

    // Assert: Modal de confirmação deve abrir com campo de motivo
    expect(await screen.findByText(/Motivo do reset/)).toBeInTheDocument();
  });
});
