import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/comercial/representantes/[id]/toggle-ativo/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  extractRequestInfo: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  })),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makePatchRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/comercial/representantes/${id}/toggle-ativo`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

const repAtivo = {
  id: 1,
  cpf: '12345678901',
  nome: 'Rep Ativo',
  status: 'ativo',
  ativo: true,
};

const repInativo = {
  id: 2,
  cpf: '98765432100',
  nome: 'Rep Inativo',
  status: 'ativo',
  ativo: false,
};

describe('PATCH /api/comercial/representantes/[id]/toggle-ativo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000001',
      nome: 'Comercial',
      perfil: 'comercial',
    } as any);
  });

  it('deve inativar acesso de representante ativo', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [repAtivo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(makePatchRequest('1', { ativo: false }), { params: { id: '1' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ativo).toBe(false);
    expect(data.message).toMatch(/inativado/i);
  });

  it('deve ativar acesso de representante inativo', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [repInativo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(makePatchRequest('2', { ativo: true }), { params: { id: '2' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.ativo).toBe(true);
    expect(data.message).toMatch(/ativado/i);
  });

  it('deve retornar 200 idempotente quando representante já está inativo', async () => {
    // Arrange — rep já está inativo, tenta inativar novamente
    mockQuery.mockResolvedValueOnce({ rows: [repInativo], rowCount: 1 } as any);

    // Act
    const res = await PATCH(makePatchRequest('2', { ativo: false }), { params: { id: '2' } });
    const data = await res.json();

    // Assert — idempotente: 200 sem UPDATE
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/já está inativo/i);
  });

  it('deve retornar 200 idempotente quando representante já está ativo', async () => {
    // Arrange — rep já está ativo, tenta ativar novamente
    mockQuery.mockResolvedValueOnce({ rows: [repAtivo], rowCount: 1 } as any);

    // Act
    const res = await PATCH(makePatchRequest('1', { ativo: true }), { params: { id: '1' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/já está ativo/i);
  });

  it('deve retornar 400 para ID inválido (não numérico)', async () => {
    // Act
    const res = await PATCH(makePatchRequest('abc', { ativo: false }), { params: { id: 'abc' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/inválido/i);
  });

  it('deve retornar 404 quando representante não existe', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await PATCH(makePatchRequest('999', { ativo: false }), { params: { id: '999' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 403 quando usuário não tem perfil comercial ou admin', async () => {
    // Arrange — perfil sem permissão
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await PATCH(makePatchRequest('1', { ativo: false }), { params: { id: '1' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });
});
