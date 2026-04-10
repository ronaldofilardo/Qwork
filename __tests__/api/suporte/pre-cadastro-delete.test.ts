/**
 * @file __tests__/api/suporte/pre-cadastro-delete.test.ts
 * @description Testes unitários para DELETE /api/suporte/pre-cadastro/[id]
 *
 * Cobre:
 *   - 200: soft-delete pré-cadastro entidade (UPDATE ativa = false)
 *   - 200: soft-delete pré-cadastro clínica (UPDATE ativa = false)
 *   - 400: ID inválido
 *   - 400: tipo ausente/inválido
 *   - 401: sem autenticação
 *   - 403: perfil sem permissão
 *   - 404: pré-cadastro não encontrado
 *   - 409: contrato já aceito (guard de segurança)
 *   - 500: erro de banco
 */

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/authorization/policies', () => ({
  assertRoles: jest.fn(),
  ROLES: { SUPORTE: 'suporte' },
  isApiError: (
    e: unknown
  ): e is { message: string; code: string; status: number } =>
    typeof e === 'object' && e !== null && 'status' in e && 'code' in e,
}));

import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/suporte/pre-cadastro/[id]/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles } from '@/lib/authorization/policies';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockAssertRoles = assertRoles as jest.MockedFunction<typeof assertRoles>;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function makeRequest(id: string, tipo?: string): NextRequest {
  const url = tipo
    ? `http://localhost/api/suporte/pre-cadastro/${id}?tipo=${tipo}`
    : `http://localhost/api/suporte/pre-cadastro/${id}`;
  return new NextRequest(url, { method: 'DELETE' });
}

const fakeSuporteSession = {
  cpf: '99999999999',
  nome: 'Suporte',
  perfil: 'suporte' as const,
};

// Cascade DELETE entidade: check + UPDATE ativa + UPDATE contratos
function mockDeleteEntidade() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 1, aceito: null }] } as any) // check
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE ativa = false
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE contratos status='cancelado'
}

// Cascade DELETE clínica: check + UPDATE ativa + UPDATE contratos
function mockDeleteClinica() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 2, aceito: null }] } as any) // check
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE ativa = false
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE contratos status='cancelado'
}

// ──────────────────────────────────────────────
// Testes
// ──────────────────────────────────────────────
describe('DELETE /api/suporte/pre-cadastro/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(fakeSuporteSession as any);
    mockAssertRoles.mockImplementation(() => undefined);
  });

  // -------- Auth --------
  it('deve retornar 401 quando sem sessão', async () => {
    mockGetSession.mockReturnValue(null as any);
    mockAssertRoles.mockImplementation(() => {
      throw { message: 'Não autenticado', code: 'UNAUTHORIZED', status: 401 };
    });

    const res = await DELETE(makeRequest('1', 'entidade'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 quando perfil não é suporte', async () => {
    mockAssertRoles.mockImplementation(() => {
      throw { message: 'Sem permissão', code: 'FORBIDDEN', status: 403 };
    });

    const res = await DELETE(makeRequest('1', 'entidade'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(403);
  });

  // -------- Validação --------
  it('deve retornar 400 para ID não numérico', async () => {
    const res = await DELETE(makeRequest('xyz', 'entidade'), {
      params: { id: 'xyz' },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/inválido/i);
  });

  it('deve retornar 400 quando tipo ausente', async () => {
    const res = await DELETE(makeRequest('1'), { params: { id: '1' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/tipo/i);
  });

  it('deve retornar 400 para tipo inválido', async () => {
    const res = await DELETE(makeRequest('1', 'empresa'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(400);
  });

  // -------- Not Found --------
  it('deve retornar 404 quando pré-cadastro não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const res = await DELETE(makeRequest('999', 'entidade'), {
      params: { id: '999' },
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  // -------- Guard: contrato aceito --------
  it('deve retornar 409 se contrato já foi aceito', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, aceito: true }],
    } as any);

    const res = await DELETE(makeRequest('1', 'entidade'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/contrato aceito/i);
  });

  // -------- Success entidade --------
  it('deve marcar pré-cadastro entidade como inativo (ativa=false) e retornar 200', async () => {
    mockDeleteEntidade();

    const res = await DELETE(makeRequest('1', 'entidade'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/removido/i);

    // Verifica exatamente 3 queries: check + UPDATE ativa + UPDATE contratos
    expect(mockQuery).toHaveBeenCalledTimes(3);
    // 1ª call: SELECT check em entidades
    expect(mockQuery.mock.calls[0][0]).toMatch(/entidades/);
    // 2ª call: UPDATE ativa = false
    expect(mockQuery.mock.calls[1][0]).toMatch(
      /UPDATE entidades SET ativa = false/i
    );
    expect(mockQuery.mock.calls[1][1]).toEqual([1]);
    // 3ª call: UPDATE contratos SET status = 'inativa'
    expect(mockQuery.mock.calls[2][0]).toMatch(
      /UPDATE contratos SET status = 'inativa'/i
    );
    expect(mockQuery.mock.calls[2][1]).toEqual([1, 'entidade']);
  });

  // -------- Success clínica --------
  it('deve marcar pré-cadastro clínica como inativo (ativa=false) e retornar 200', async () => {
    mockDeleteClinica();

    const res = await DELETE(makeRequest('2', 'clinica'), {
      params: { id: '2' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockQuery).toHaveBeenCalledTimes(3);
    // 1ª call: SELECT check em clinicas
    expect(mockQuery.mock.calls[0][0]).toMatch(/clinicas/);
    // 2ª call: UPDATE ativa = false em clinicas
    expect(mockQuery.mock.calls[1][0]).toMatch(
      /UPDATE clinicas SET ativa = false/i
    );
    expect(mockQuery.mock.calls[1][1]).toEqual([2]);
    // 3ª call: UPDATE contratos SET status = 'inativa'
    expect(mockQuery.mock.calls[2][0]).toMatch(
      /UPDATE contratos SET status = 'inativa'/i
    );
    expect(mockQuery.mock.calls[2][1]).toEqual([2, 'clinica']);
  });

  // -------- Erro banco --------
  it('deve retornar 500 quando o banco lança exceção', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB crash'));

    const res = await DELETE(makeRequest('1', 'entidade'), {
      params: { id: '1' },
    });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/erro interno/i);
  });
});
