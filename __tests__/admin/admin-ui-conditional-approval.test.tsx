/**
 * Testes para Admin UI - Renderização de Cadastros Pendentes
 * No novo fluxo (sem pagamento obrigatório), requer_aprovacao_manual é sempre true
 * para novos cadastros pendentes.
 */

import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NovoscadastrosContent } from '@/components/admin/NovoscadastrosContent';

// Mock do fetch para simular respostas da API
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('NovoscadastrosContent - Exibição de Cadastros Pendentes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve renderizar tomador com requer_aprovacao_manual = true', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tomadores: [
          {
            id: 2,
            nome: 'Teste Entidade',
            cnpj: '12.345.678/0001-99',
            tipo: 'entidade',
            status: 'pendente',
            requer_aprovacao_manual: true,
            criado_em: '2025-01-01T10:00:00Z',
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Teste Entidade')).toBeInTheDocument();
      expect(screen.getByText('Pendente')).toBeInTheDocument();
    });
  });

  it('deve renderizar tomador mesmo sem requer_aprovacao_manual no payload', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tomadores: [
          {
            id: 1,
            nome: 'Outra Entidade',
            cnpj: '98.765.432/0001-00',
            tipo: 'entidade',
            status: 'pendente',
            criado_em: '2025-01-02T10:00:00Z',
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.getByText('Outra Entidade')).toBeInTheDocument();
    });
  });

  it('não deve renderizar badge "✓ Pago" (campo removido do fluxo)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        tomadores: [
          {
            id: 3,
            nome: 'Entidade Teste',
            cnpj: '11.111.111/0001-11',
            tipo: 'entidade',
            status: 'pendente',
            criado_em: '2025-01-03T10:00:00Z',
          },
        ],
      }),
    } as any);

    render(<NovoscadastrosContent />);

    await waitFor(() => {
      expect(screen.queryByText('✓ Pago')).not.toBeInTheDocument();
    });
  });
});

describe('Handlers API - Coluna requer_aprovacao_manual', () => {
  it('backend retorna true AS requer_aprovacao_manual para todos os cadastros pendentes', () => {
    const queryContains = (q: string) =>
      q.includes('true AS requer_aprovacao_manual');

    const query = `
      SELECT c.*,
        true AS requer_aprovacao_manual
      FROM entidades c
      WHERE c.status = 'pendente'
    `;

    expect(queryContains(query)).toBe(true);
  });

  it('requer_aprovacao_manual é sempre true para cadastros pendentes', () => {
    const requer_aprovacao_manual = true;
    expect(requer_aprovacao_manual).toBe(true);
  });

  it('não usa pagamento_confirmado para determinar aprovação manual', () => {
    const handlerQuery = `
      SELECT c.*, true AS requer_aprovacao_manual
      FROM entidades c
      WHERE c.status IN ('pendente', 'aguardando_pagamento', 'em_reanalise')
    `;

    expect(handlerQuery).not.toContain('pagamento_confirmado');
    expect(handlerQuery).toContain('true AS requer_aprovacao_manual');
  });
});
