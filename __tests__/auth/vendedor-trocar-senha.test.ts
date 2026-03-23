/**
 * @file __tests__/auth/vendedor-trocar-senha.test.ts
 *
 * Testes para POST /api/vendedor/trocar-senha
 * Cobre:
 * - 401 se não autenticado
 * - 400 se body incompleto
 * - 400 se senha fraca
 * - 404 se usuário não encontrado
 * - 400 se sem senha_hash (ainda não criou senha via convite)
 * - 401 se senha atual incorreta
 * - 400 se nova senha igual à atual
 * - 200: atualiza senha_hash E seta primeira_senha_alterada=TRUE em vendedores_perfil
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/vendedor/trocar-senha/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('nova_hash'),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

const VENDEDOR_SESSION = { cpf: '12345678901', perfil: 'vendedor' as const };

function makeReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/vendedor/trocar-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/vendedor/trocar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('UNAUTHORIZED'));
    const res = await POST(makeReq({ senha_atual: 'A', nova_senha: 'B' }));
    expect(res.status).toBe(401);
  });

  it('400 se body ausente (senha_atual e nova_senha vazios)', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/obrigatórias/i);
  });

  it('400 se nova senha muito curta', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'Ab1' })
    );
    expect(res.status).toBe(400);
  });

  it('400 se nova senha sem maiúscula', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'semmaius1' })
    );
    expect(res.status).toBe(400);
  });

  it('400 se nova senha sem número', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'SemNumero' })
    );
    expect(res.status).toBe(400);
  });

  it('404 se usuário não encontrado no banco', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(404);
  });

  it('400 se usuário não tem senha_hash configurado', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, senha_hash: null }],
      rowCount: 1,
    } as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/convite/i);
  });

  it('401 se senha atual incorreta', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, senha_hash: 'hash_antiga' }],
      rowCount: 1,
    } as any);
    (mockBcryptCompare as any).mockResolvedValue(false); // senha errada
    const res = await POST(
      makeReq({ senha_atual: 'Errada1A', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/incorreta/i);
  });

  it('400 se nova senha igual à senha atual', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, senha_hash: 'hash_antiga' }],
      rowCount: 1,
    } as any);
    // primeiro compare (senha_atual) = true, segundo (nova === atual) = true
    (mockBcryptCompare as any)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const res = await POST(
      makeReq({ senha_atual: 'Mesma1A_', nova_senha: 'Mesma1A_' })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/igual/i);
  });

  it('200: sucesso — retorna { success: true }', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 42, senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE vendedores_perfil
    (mockBcryptCompare as any)
      .mockResolvedValueOnce(true) // senha atual válida
      .mockResolvedValueOnce(false); // nova != atual
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('200: deve atualizar usuarios.senha_hash', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 42, senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    (mockBcryptCompare as any)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await POST(makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' }));

    const updateSenhaCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.toLowerCase().includes('update usuarios') &&
        sql.includes('senha_hash')
    );
    expect(updateSenhaCall).toBeDefined();
  });

  it('200: deve setar primeira_senha_alterada = TRUE em vendedores_perfil', async () => {
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 42, senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    (mockBcryptCompare as any)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    await POST(makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' }));

    const updatePerfilCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('vendedores_perfil') &&
        sql.includes('primeira_senha_alterada')
    );
    expect(updatePerfilCall).toBeDefined();
    expect(updatePerfilCall[0]).toMatch(/primeira_senha_alterada\s*=\s*TRUE/i);
  });
});
