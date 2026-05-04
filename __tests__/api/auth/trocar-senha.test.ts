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
  rateLimitAsync: jest.fn().mockResolvedValue(null),
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
});
