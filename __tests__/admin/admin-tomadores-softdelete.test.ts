/**
 * @file __tests__/admin/admin-tomadores-softdelete.test.ts
 * @description Testes unitários para PATCH /api/admin/tomadores/[id]/softdelete
 *
 * Cobre:
 *   - 200: soft-delete entidade (cascata completa)
 *   - 200: soft-delete clínica (cascata completa)
 *   - 200: reativar entidade
 *   - 200: reativar clínica
 *   - 400: ID inválido
 *   - 400: body inválido
 *   - 401: sem sessão
 *   - 403: perfil sem permissão (não-admin)
 *   - 404: tomador não encontrado
 *   - 500: erro de banco
 */

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/authorization/policies', () => ({
  assertRoles: jest.fn(),
  ROLES: { ADMIN: 'admin' },
  isApiError: (
    e: unknown
  ): e is { message: string; code: string; status: number } =>
    typeof e === 'object' && e !== null && 'status' in e && 'code' in e,
}));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
  extrairContextoRequisicao: jest
    .fn()
    .mockReturnValue({ ip_address: '127.0.0.1', user_agent: 'jest' }),
}));

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/tomadores/[id]/softdelete/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles } from '@/lib/authorization/policies';
import { registrarAuditoria } from '@/lib/auditoria/auditoria';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockAssertRoles = assertRoles as jest.MockedFunction<typeof assertRoles>;
const mockRegistrarAuditoria = registrarAuditoria as jest.MockedFunction<
  typeof registrarAuditoria
>;

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function makeRequest(
  id: string,
  body: Record<string, unknown>
): NextRequest {
  return new NextRequest(
    `http://localhost/api/admin/tomadores/${id}/softdelete`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

const fakeAdminSession = {
  cpf: '00000000000',
  nome: 'Admin',
  perfil: 'admin' as const,
};

// Cascade softdelete entidade: existe + 4 UPDATEs
function mockSoftDeleteEntidade() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 1, ativa: true }] } as any) // existe
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE entidades
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE usuarios
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE funcionarios_entidades
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE funcionarios
}

// Cascade softdelete clínica: existe + 5 UPDATEs
function mockSoftDeleteClinica() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 2, ativa: true }] } as any) // existe
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE clinicas
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE usuarios
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE empresas_clientes
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE funcionarios_clinicas
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE funcionarios
}

// Reativar entidade: existe + 4 UPDATEs
function mockReativarEntidade() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 1, ativa: false }] } as any) // existe
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE entidades
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE usuarios (gestor)
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE funcionarios_entidades
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE funcionarios
}

// Reativar clínica: existe + 5 UPDATEs
function mockReativarClinica() {
  mockQuery
    .mockResolvedValueOnce({ rows: [{ id: 2, ativa: false }] } as any) // existe
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE clinicas
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE usuarios (rh)
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE empresas_clientes
    .mockResolvedValueOnce({ rows: [] } as any) // UPDATE funcionarios_clinicas
    .mockResolvedValueOnce({ rows: [] } as any); // UPDATE funcionarios
}

// ──────────────────────────────────────────────
// Testes
// ──────────────────────────────────────────────
describe('PATCH /api/admin/tomadores/[id]/softdelete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(fakeAdminSession as any);
    mockAssertRoles.mockImplementation(() => undefined);
  });

  // -------- Auth --------
  it('deve retornar 401 quando sem sessão', async () => {
    mockGetSession.mockReturnValue(null as any);
    mockAssertRoles.mockImplementation(() => {
      throw { message: 'Não autenticado', code: 'UNAUTHORIZED', status: 401 };
    });

    const res = await PATCH(makeRequest('1', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 quando perfil não é admin', async () => {
    mockAssertRoles.mockImplementation(() => {
      throw { message: 'Sem permissão', code: 'FORBIDDEN', status: 403 };
    });

    const res = await PATCH(makeRequest('1', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(403);
  });

  // -------- Validação --------
  it('deve retornar 400 para ID não numérico', async () => {
    const res = await PATCH(makeRequest('abc', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: 'abc' },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/inválido/i);
  });

  it('deve retornar 400 para body com action inválida', async () => {
    const res = await PATCH(makeRequest('1', { action: 'remover', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/body inválido/i);
  });

  it('deve retornar 400 para body com tipo inválido', async () => {
    const res = await PATCH(makeRequest('1', { action: 'softdelete', tipo: 'empresa' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(400);
  });

  // -------- Not Found --------
  it('deve retornar 404 quando tomador não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    const res = await PATCH(makeRequest('999', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: '999' },
    });
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  // -------- Soft-delete entidade --------
  it('deve soft-delete entidade com cascata', async () => {
    mockSoftDeleteEntidade();

    const res = await PATCH(makeRequest('1', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('softdelete');

    // Deve ter registrado auditoria
    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'desativar', metadados: { tipo: 'entidade' } })
    );
  });

  // -------- Soft-delete clínica --------
  it('deve soft-delete clínica com cascata', async () => {
    mockSoftDeleteClinica();

    const res = await PATCH(makeRequest('2', { action: 'softdelete', tipo: 'clinica' }), {
      params: { id: '2' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('softdelete');

    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'desativar', metadados: { tipo: 'clinica' } })
    );
  });

  // -------- Reativar entidade --------
  it('deve reativar entidade com cascata', async () => {
    mockReativarEntidade();

    const res = await PATCH(makeRequest('1', { action: 'reativar', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('reativar');

    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'ativar', metadados: { tipo: 'entidade' } })
    );
  });

  // -------- Reativar clínica --------
  it('deve reativar clínica com cascata', async () => {
    mockReativarClinica();

    const res = await PATCH(makeRequest('2', { action: 'reativar', tipo: 'clinica' }), {
      params: { id: '2' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.action).toBe('reativar');

    expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
      expect.objectContaining({ acao: 'ativar', metadados: { tipo: 'clinica' } })
    );
  });

  // -------- Erro banco --------
  it('deve retornar 500 quando o banco lança exceção', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await PATCH(makeRequest('1', { action: 'softdelete', tipo: 'entidade' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toMatch(/erro interno/i);
  });
});
