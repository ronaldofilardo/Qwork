import { NextRequest } from 'next/server';
import { POST } from '@/app/api/suporte/representantes/reset-senha/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
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

function makeRequest(body: unknown): NextRequest {
  return new NextRequest(
    'http://localhost/api/suporte/representantes/reset-senha',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

describe('POST /api/suporte/representantes/reset-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
  });

  it('deve retornar 400 para CPF inválido', async () => {
    const res = await POST(makeRequest({ cpf: '123' }));
    expect(res.status).toBe(400);
  });

  it('deve retornar 404 quando representante não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST(makeRequest({ cpf: '12345678901' }));
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve marcar troca obrigatória no próximo login quando representante existe', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 42,
            nome: 'Representante Teste',
            cpf: '12345678901',
            cpf_responsavel_pj: null,
            status: 'ativo',
            ativo: true,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(makeRequest({ cpf: '12345678901' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/próximo login|nova senha/i);
    expect(mockQuery).toHaveBeenLastCalledWith(
      expect.stringContaining('INSERT INTO public.representantes_senhas'),
      [42, '12345678901'],
      expect.anything()
    );
  });

  it('deve retornar 409 quando representante está desativado', async () => {
    // Arrange — representante com status desativado não pode ter senha resetada
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          nome: 'Rep Desativado',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'desativado',
          ativo: false,
        },
      ],
      rowCount: 1,
    } as any);

    // Act
    const res = await POST(makeRequest({ cpf: '12345678901' }));
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/desativado/i);
  });

  it('deve retornar 409 quando representante está rejeitado', async () => {
    // Arrange — representante rejeitado não pode ter senha resetada
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 11,
          nome: 'Rep Rejeitado',
          cpf: '12345678901',
          cpf_responsavel_pj: null,
          status: 'rejeitado',
          ativo: false,
        },
      ],
      rowCount: 1,
    } as any);

    // Act
    const res = await POST(makeRequest({ cpf: '12345678901' }));
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/rejeitado/i);
  });

  it('deve retornar 403 quando usuário não tem perfil suporte', async () => {
    // Arrange — somente suporte pode resetar senha de representante
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await POST(makeRequest({ cpf: '12345678901' }));
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });
});
