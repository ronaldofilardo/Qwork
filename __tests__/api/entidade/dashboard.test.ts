/**
 * Testes para a API /api/entidade/dashboard
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/entidade/dashboard/route';
import { query } from '@/lib/db';

// Mock do db
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock da sessão
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireEntity = require('@/lib/session').requireEntity;

describe('/api/entidade/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar dados do dashboard com sucesso', async () => {
    // Mock da sessão
    mockRequireEntity.mockResolvedValue({
      tomador_id: 1,
    });

    // Mock das consultas
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: 10,
            concluidas: 8,
            total_funcionarios: 5,
            funcionarios_ativos: 4,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            grupo: 1,
            dominio: 'Demanda Quantitativa',
            media_score: 75.5,
            total_avaliacoes: 5,
            baixo: 1,
            medio: 2,
            alto: 2,
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { categoria: 'baixo', total: 2 },
          { categoria: 'medio', total: 3 },
          { categoria: 'alto', total: 3 },
        ],
      });

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/dashboard'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.stats.total_avaliacoes).toBe(10);
    expect(data.stats.concluidas).toBe(8);
    expect(data.resultados).toHaveLength(1);
    expect(data.distribuicao).toHaveLength(3);
  });

  it('deve retornar erro 403 quando usuário não autorizado', async () => {
    mockRequireEntity.mockRejectedValueOnce(
      new Error('Acesso restrito a gestores de entidade')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/dashboard'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso restrito a gestores de entidade');
  });

  it('deve retornar erro 500 quando ocorre erro na consulta', async () => {
    mockRequireEntity.mockResolvedValue({
      tomador_id: 1,
    });

    mockQuery.mockRejectedValueOnce(new Error('Erro de banco'));

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/dashboard'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Erro ao buscar dados');
  });
});
