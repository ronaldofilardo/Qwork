/**
 * @fileoverview Testes da API POST /api/representante/login
 */

jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { POST } from '@/app/api/representante/login/route';
import { query } from '@/lib/db';
import { criarSessaoRepresentante } from '@/lib/session-representante';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCriarSessao = criarSessaoRepresentante as jest.MockedFunction<
  typeof criarSessaoRepresentante
>;

function makeReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/representante/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/representante/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar 400 quando email ou codigo estão faltando', async () => {
    const res = await POST(makeReq({ email: '' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/obrigatórios/);
  });

  it('deve retornar 400 quando body é vazio', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
  });

  it('deve retornar 401 quando credenciais não correspondem', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    const res = await POST(makeReq({ email: 'x@x.com', codigo: 'XXXX-XXXX' }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/inválidos/);
  });

  it('deve retornar 403 quando status é desativado', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Test',
          email: 'x@x.com',
          codigo: 'AB12-CD34',
          status: 'desativado',
          tipo_pessoa: 'pf',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeReq({ email: 'x@x.com', codigo: 'AB12-CD34' }));
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/inativa|rejeitada/i);
  });

  it('deve retornar 403 quando status é rejeitado', async () => {
    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Test',
          email: 'x@x.com',
          codigo: 'AB12-CD34',
          status: 'rejeitado',
          tipo_pessoa: 'pf',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await POST(makeReq({ email: 'x@x.com', codigo: 'AB12-CD34' }));
    expect(res.status).toBe(403);
  });

  it('deve retornar 200 e criar sessão para credenciais válidas', async () => {
    const repData = {
      id: 42,
      nome: 'Carlos PF',
      email: 'carlos@test.dev',
      codigo: 'REP-PF123',
      status: 'ativo',
      tipo_pessoa: 'pf',
    };
    mockQuery.mockResolvedValue({ rows: [repData], rowCount: 1 } as any);
    const res = await POST(
      makeReq({ email: 'carlos@test.dev', codigo: 'REP-PF123' })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.representante.id).toBe(42);
    expect(data.representante.nome).toBe('Carlos PF');
    expect(mockCriarSessao).toHaveBeenCalledTimes(1);
    expect(mockCriarSessao).toHaveBeenCalledWith(
      expect.objectContaining({
        representante_id: 42,
        status: 'ativo',
      })
    );
  });

  it('deve normalizar email para lowercase e codigo para uppercase', async () => {
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
    await POST(makeReq({ email: ' UPPER@TEST.dev ', codigo: ' rep-pf123 ' }));
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [
      'upper@test.dev',
      'REP-PF123',
    ]);
  });
});
