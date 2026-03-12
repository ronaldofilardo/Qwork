/**
 * @file __tests__/api/auth/trocar-senha.test.ts
 * Testes: POST /api/auth/trocar-senha
 */

import { POST } from '@/app/api/auth/trocar-senha/route';
import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/session');
jest.mock('@/lib/db');
jest.mock('bcryptjs');
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn().mockReturnValue({}),
}));
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue(() => null),
  RATE_LIMIT_CONFIGS: { auth: {} },
}));

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

function makeReq(body: Record<string, unknown>): Request {
  return { json: jest.fn().mockResolvedValue(body) } as unknown as Request;
}

const gestorSession = { cpf: '111', perfil: 'gestor' as const, entidade_id: 5 };

describe('POST /api/auth/trocar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 se não autenticado', async () => {
    mockGetSession.mockReturnValue(null as any);
    const res = await POST(makeReq({ senha_atual: 'a', nova_senha: 'b' }));
    expect(res.status).toBe(401);
  });

  it('403 se perfil não é gestor nem rh', async () => {
    mockGetSession.mockReturnValue({ cpf: '1', perfil: 'emissor' } as any);
    const res = await POST(makeReq({ senha_atual: 'a', nova_senha: 'b' }));
    expect(res.status).toBe(403);
  });

  it('400 se senha_atual ausente', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    const res = await POST(makeReq({ nova_senha: 'novaSenha123' }));
    expect(res.status).toBe(400);
  });

  it('400 se nova_senha ausente', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    const res = await POST(makeReq({ senha_atual: 'antigaSenha' }));
    expect(res.status).toBe(400);
  });

  it('400 se nova_senha < 8 caracteres', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    const res = await POST(
      makeReq({ senha_atual: 'antigaSenha', nova_senha: '1234567' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('mínimo');
  });

  it('400 se nova_senha === senha_atual', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    const res = await POST(
      makeReq({ senha_atual: 'senhaIgual123', nova_senha: 'senhaIgual123' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('diferente');
  });

  it('404 se registro de senha não encontrado', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(
      makeReq({ senha_atual: 'antiga123', nova_senha: 'novaSenha123' })
    );
    expect(res.status).toBe(404);
  });

  it('401 se senha atual incorreta', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: '$2a$hash' }],
      rowCount: 1,
    } as any);
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(false);
    const res = await POST(
      makeReq({ senha_atual: 'errada123', nova_senha: 'novaSenha123' })
    );
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('incorreta');
  });

  it('200 troca com sucesso para gestor', async () => {
    mockGetSession.mockReturnValue(gestorSession as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ senha_hash: '$2a$hash' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rowCount: 1 } as any); // UPDATE
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2a$newHash');

    const res = await POST(
      makeReq({ senha_atual: 'antiga123', nova_senha: 'novaSenha123' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('sucesso');
  });

  it('200 troca com sucesso para rh', async () => {
    mockGetSession.mockReturnValue({
      cpf: '222',
      perfil: 'rh',
      clinica_id: 3,
    } as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ senha_hash: '$2a$hash' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rowCount: 1 } as any);
    (mockBcrypt.compare as jest.Mock).mockResolvedValue(true);
    (mockBcrypt.hash as jest.Mock).mockResolvedValue('$2a$newHash');

    const res = await POST(
      makeReq({ senha_atual: 'velha12345', nova_senha: 'nova12345' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
