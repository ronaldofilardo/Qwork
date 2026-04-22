/**
 * @fileoverview Testes da API GET /api/comercial/minhas-comissoes
 * @description Lista todos os laudos pagos com valor_comissao_comercial > 0
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/comercial/minhas-comissoes/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(url = 'http://localhost/api/comercial/minhas-comissoes') {
  return new NextRequest(url);
}

const comercialSession = {
  cpf: '22222222222',
  nome: 'Comercial Dev',
  perfil: 'comercial',
};

describe('GET /api/comercial/minhas-comissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession as any);
  });

  it('deve retornar lista vazia quando não há comissões pagas', async () => {
    // Arrange: resumo, total e comissões vazios
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { total_laudos: '0', total_recebido: '0', media_por_laudo: '0' },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(data.resumo.total_laudos).toBe('0');
  });

  it('deve retornar comissões com resumo correto', async () => {
    // Arrange
    const mockComissoes = [
      {
        id: 1,
        representante_nome: 'Rep Teste',
        entidade_nome: 'Entidade X',
        valor_laudo: '150.00',
        percentual_comissao_comercial: '5.00',
        valor_comissao_comercial: '7.50',
        mes_emissao: '2026-04',
        data_aprovacao: '2026-04-01T00:00:00Z',
        data_pagamento: '2026-04-10T00:00:00Z',
        asaas_payment_id: 'pay_abc123',
      },
    ];

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_laudos: '1',
            total_recebido: '7.50',
            media_por_laudo: '7.50',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: mockComissoes, rowCount: 1 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].representante_nome).toBe('Rep Teste');
    expect(data.comissoes[0].valor_comissao_comercial).toBe('7.50');
    expect(data.resumo.total_laudos).toBe('1');
    expect(data.resumo.total_recebido).toBe('7.50');
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(30);
  });

  it('deve suportar paginação via query param page', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_laudos: '50',
            total_recebido: '375.00',
            media_por_laudo: '7.50',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act — page=2
    const res = await GET(
      makeRequest('http://localhost/api/comercial/minhas-comissoes?page=2')
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.total).toBe(50);
  });

  it('deve retornar 403 quando usuário não é comercial', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar 500 em erro inesperado de banco', async () => {
    // Arrange
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
