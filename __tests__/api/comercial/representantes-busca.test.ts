/**
 * @file __tests__/api/comercial/representantes-busca.test.ts
 *
 * Testes para GET /api/comercial/representantes/busca
 * Busca representantes por nome ou código para o drawer de vínculo retroativo.
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({
    cpf: '00011122233',
    nome: 'Comercial',
    perfil: 'comercial',
  }),
}));

import { query } from '@/lib/db';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/comercial/representantes/busca/route';

const mockQuery = query as jest.MockedFunction<typeof query>;

function makeReq(q?: string): NextRequest {
  const url = `http://localhost/api/comercial/representantes/busca${q !== undefined ? `?q=${encodeURIComponent(q)}` : ''}`;
  return new NextRequest(url);
}

const fakeReps = [
  {
    id: 1,
    nome: 'João Silva',
    codigo: 'REP001',
    cpf: '12345678901',
    modelo_comissionamento: 'percentual',
    percentual_comissao: '10.00',
    status: 'ativo',
  },
  {
    id: 2,
    nome: 'Maria Souza',
    codigo: 'REP002',
    cpf: '98765432100',
    modelo_comissionamento: 'custo_fixo',
    percentual_comissao: null,
    status: 'ativo',
  },
];

describe('GET /api/comercial/representantes/busca', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna array vazio quando q tem menos de 2 chars', async () => {
    const res = await GET(makeReq('J'));
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.representantes).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('retorna array vazio quando q está ausente', async () => {
    const res = await GET(makeReq());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.representantes).toEqual([]);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('retorna representantes filtrados por nome/código com 2+ chars', async () => {
    mockQuery.mockResolvedValueOnce({ rows: fakeReps } as never);

    const res = await GET(makeReq('Jo'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.representantes).toHaveLength(2);
    expect(body.representantes[0].nome).toBe('João Silva');
    expect(mockQuery).toHaveBeenCalledTimes(1);
    // Verifica que o termo é passado como %Jo%
    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('ILIKE'), [
      '%Jo%',
    ]);
  });

  it('retorna array vazio quando nenhum representante encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as never);

    const res = await GET(makeReq('XYZ'));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.representantes).toEqual([]);
  });

  it('retorna 403 quando não autenticado', async () => {
    const { requireRole } = await import('@/lib/session');
    (requireRole as jest.Mock).mockRejectedValueOnce(
      new Error('Não autenticado')
    );

    const res = await GET(makeReq('Jo'));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Não autenticado');
  });

  it('retorna 403 quando sem permissão', async () => {
    const { requireRole } = await import('@/lib/session');
    (requireRole as jest.Mock).mockRejectedValueOnce(
      new Error('Sem permissão')
    );

    const res = await GET(makeReq('Jo'));
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error).toBe('Sem permissão');
  });

  it('retorna 500 em erro inesperado de DB', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down') as never);

    const res = await GET(makeReq('Jo'));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe('Erro interno');
  });
});
