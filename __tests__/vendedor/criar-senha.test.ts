/**
 * Testes unitários: POST /api/vendedor/criar-senha
 *
 * Cobre:
 * - Após criar senha via convite, primeira_senha_alterada deve ser TRUE (não FALSE)
 * - Token inválido/expirado/já usado → 400
 * - Senha com confirmação divergente → 400
 * - Senha fraca (sem maiúscula, sem número, < 8 chars) → 400
 * - Sucesso → HTTP 200 + { success: true }
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/vendedor/criar-senha/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;

// token de 64 caracteres
const VALID_TOKEN = 'a'.repeat(64);
const FUTURE_DATE = new Date(Date.now() + 3_600_000).toISOString();

function makeRequest(body: object) {
  return new NextRequest('http://localhost/api/vendedor/criar-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockVendedorRow(
  overrides: Partial<{
    convite_usado_em: string | null;
    convite_expira_em: string | null;
    convite_tentativas_falhas: number;
  }> = {}
) {
  return {
    perfil_id: 1,
    usuario_id: 42,
    nome: 'Vendedor Teste',
    email: 'vendedor@test.com',
    convite_usado_em: null,
    convite_expira_em: FUTURE_DATE,
    convite_tentativas_falhas: 0,
    ...overrides,
  };
}

describe('POST /api/vendedor/criar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBcryptHash.mockResolvedValue('$2b$12$hashedpassword');
    mockQuery.mockResolvedValue({ rows: [] });
  });

  // ─── Validação de campos ──────────────────────────────────────────────────

  it('deve retornar 400 se token ausente', async () => {
    const res = await POST(
      makeRequest({ senha: 'Senha123', confirmacao: 'Senha123' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Token inválido');
  });

  it('deve retornar 400 se token com comprimento errado', async () => {
    const res = await POST(
      makeRequest({
        token: 'curto',
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );
    expect(res.status).toBe(400);
  });

  it('deve retornar 400 se senha ausente', async () => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, confirmacao: 'Senha123' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Senha obrigatória');
  });

  it('deve retornar 400 se senha e confirmação divergem', async () => {
    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Diferente1',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/não conferem/i);
  });

  it('deve retornar 400 se senha < 8 caracteres', async () => {
    const res = await POST(
      makeRequest({ token: VALID_TOKEN, senha: 'Ab1', confirmacao: 'Ab1' })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/8 caracteres/i);
  });

  it('deve retornar 400 se senha sem maiúscula', async () => {
    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'senha1234',
        confirmacao: 'senha1234',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/maiúscula/i);
  });

  it('deve retornar 400 se senha sem número', async () => {
    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'SenhaSemNum',
        confirmacao: 'SenhaSemNum',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/número/i);
  });

  // ─── Token inválido / expirado / bloqueado ────────────────────────────────

  it('deve retornar 400 se token não encontrado no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe('Token inválido');
  });

  it('deve retornar 400 se convite já usado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockVendedorRow({ convite_usado_em: '2025-01-01T00:00:00Z' })],
    });

    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/já foi utilizado/i);
  });

  it('deve retornar 400 se convite expirado', async () => {
    const pastDate = new Date(Date.now() - 3_600_000).toISOString();
    mockQuery.mockResolvedValueOnce({
      rows: [mockVendedorRow({ convite_expira_em: pastDate })],
    });

    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/expirado/i);
  });

  it('deve retornar 400 se convite bloqueado por tentativas', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [mockVendedorRow({ convite_tentativas_falhas: 3 })],
    });

    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/bloqueado/i);
  });

  // ─── Bug fix: primeira_senha_alterada = TRUE ──────────────────────────────

  it('[BUG FIX] deve definir primeira_senha_alterada = TRUE ao criar senha via convite', async () => {
    // 1ª query: buscar vendedor pelo token
    mockQuery.mockResolvedValueOnce({ rows: [mockVendedorRow()] });
    // 2ª query: UPDATE usuarios (senha_hash + ativo)
    mockQuery.mockResolvedValueOnce({ rows: [] });
    // 3ª query: UPDATE vendedores_perfil (token + primeira_senha_alterada)
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );

    // A 3ª chamada ao query contém o UPDATE que define primeira_senha_alterada
    expect(mockQuery).toHaveBeenCalledTimes(3);
    const terceiraQuery = mockQuery.mock.calls[2];
    const sqlUpdate: string = terceiraQuery[0];

    // Garante que não contém FALSE (o bug antigo)
    expect(sqlUpdate).not.toMatch(/primeira_senha_alterada\s*=\s*FALSE/i);
    // Garante que contém TRUE (o fix)
    expect(sqlUpdate).toMatch(/primeira_senha_alterada\s*=\s*TRUE/i);
  });

  it('deve retornar success: true ao criar senha com token válido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockVendedorRow()] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toBeTruthy();
  });

  it('deve hashear a senha antes de salvar (nunca gravar plaintext)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockVendedorRow()] });
    mockQuery.mockResolvedValueOnce({ rows: [] });
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await POST(
      makeRequest({
        token: VALID_TOKEN,
        senha: 'Senha123',
        confirmacao: 'Senha123',
      })
    );

    // bcrypt.hash deve ter sido chamado com a senha
    expect(mockBcryptHash).toHaveBeenCalledWith('Senha123', 12);

    // O UPDATE de usuarios deve usar o hash, não a senha em texto claro
    const segundaQuery = mockQuery.mock.calls[1];
    const paramsUpdate: unknown[] = segundaQuery[1];
    expect(paramsUpdate[0]).toBe('$2b$12$hashedpassword');
    expect(paramsUpdate[0]).not.toBe('Senha123');
  });
});
