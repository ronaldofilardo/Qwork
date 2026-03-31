/**
 * @file __tests__/auth/vendedor-criar-senha.test.ts
 *
 * Testes para POST /api/vendedor/criar-senha
 * Cobre:
 * - Token inválido → 400
 * - Token inexistente → 400
 * - Token já usado → 400
 * - Token expirado → 400
 * - Token bloqueado → 400
 * - Senha fraca → 400
 * - Sucesso: atualiza senha_hash + ativo=true + marca convite usado + primeira_senha_alterada=FALSE
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/vendedor/criar-senha/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed_nova_senha'),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

const VALID_TOKEN = 'a'.repeat(64);

function makePostRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/vendedor/criar-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Mock de token válido, não usado, não expirado */
function mockTokenValido(
  override: Partial<{
    convite_expira_em: string;
    convite_tentativas_falhas: number;
    convite_usado_em: string | null;
  }> = {}
) {
  mockQuery.mockResolvedValueOnce({
    rows: [
      {
        perfil_id: 1,
        usuario_id: 42,
        nome: 'Vendedor Teste',
        email: 'v@test.com',
        convite_expira_em: new Date(Date.now() + 86400000).toISOString(),
        convite_tentativas_falhas: 0,
        convite_usado_em: null,
        ...override,
      },
    ],
    rowCount: 1,
  } as any);
}

describe('POST /api/vendedor/criar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('400 se token ausente', async () => {
    const res = await makePostRequest({
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    // token undefined → validação falha
    const req = new NextRequest(
      'http://localhost:3000/api/vendedor/criar-senha',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha: 'Senha123', confirmacao: 'Senha123' }),
      }
    );
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('400 se token com comprimento errado (< 64 chars)', async () => {
    const req = makePostRequest({
      token: 'curto',
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('400 se token inexistente no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/inválido/i);
  });

  it('400 se token já foi utilizado', async () => {
    mockTokenValido({ convite_usado_em: new Date().toISOString() });
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/utilizado/i);
  });

  it('400 se token expirado', async () => {
    mockTokenValido({
      convite_expira_em: new Date(Date.now() - 1000).toISOString(),
    });
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/expira/i);
  });

  it('400 se token bloqueado por excesso de tentativas', async () => {
    mockTokenValido({ convite_tentativas_falhas: 3 });
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/bloqueado/i);
  });

  it('400 se senha muito curta', async () => {
    // Validação ocorre antes do SELECT — sem mock de DB necessário
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Ab1',
      confirmacao: 'Ab1',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('400 se senha sem maiúscula', async () => {
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'senhasem1',
      confirmacao: 'senhasem1',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('400 se senha sem número', async () => {
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'SenhaSemNumero',
      confirmacao: 'SenhaSemNumero',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('400 se confirmação não confere', async () => {
    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Diferente1',
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/confere/i);
  });

  it('200: sucesso — atualiza senha_hash, ativa user e marca convite', async () => {
    mockTokenValido();
    // UPDATE usuarios SET senha_hash, ativo=true
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // UPDATE vendedores_perfil (marca convite + primeira_senha_alterada=FALSE)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    const response = await POST(req);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('200: UPDATE usuarios deve incluir ativo = true', async () => {
    mockTokenValido();
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    await POST(req);

    // Segunda chamada de query é o UPDATE usuarios
    const updateUsuariosCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' && sql.toLowerCase().includes('update usuarios')
    );
    expect(updateUsuariosCall).toBeDefined();
    expect(updateUsuariosCall[0]).toMatch(/ativo\s*=\s*true/i);
  });

  it('200: UPDATE vendedores_perfil deve setar primeira_senha_alterada = FALSE', async () => {
    mockTokenValido();
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    await POST(req);

    // SELECT=1ª, UPDATE usuarios=2ª, UPDATE vendedores_perfil=3ª
    expect(mockQuery).toHaveBeenCalledTimes(3);
    const sql3 = mockQuery.mock.calls[2][0];
    expect(sql3).toMatch(/vendedores_perfil/i);
    expect(sql3).toMatch(/primeira_senha_alterada/i);
    expect(sql3).toMatch(/FALSE/i);
  });

  it('200: bcrypt.hash chamado com rounds=12', async () => {
    mockTokenValido();
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const req = makePostRequest({
      token: VALID_TOKEN,
      senha: 'Senha123',
      confirmacao: 'Senha123',
    });
    await POST(req);

    expect(mockBcryptHash).toHaveBeenCalledWith('Senha123', 12);
  });
});
