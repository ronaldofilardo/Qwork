/**
 * @file __tests__/auth/representante-trocar-senha.test.ts
 *
 * Testes para POST /api/representante/trocar-senha
 * Cobre:
 * - 401 se não autenticado (REP_NAO_AUTENTICADO)
 * - 400 se body incompleto
 * - 400 se senha fraca (curta, sem maiúscula, sem número)
 * - 400 se nova senha igual à atual
 * - 404 se registro de senha não encontrado
 * - 401 se senha atual incorreta
 * - 200: atualiza representantes_senhas + representantes.senha_repres + retorna codigo
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/representante/trocar-senha/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session-representante', () => ({
  requireRepresentante: jest.fn(),
  repAuthErrorResponse: jest.fn((err: Error) => {
    if (err.message === 'REP_NAO_AUTENTICADO')
      return { status: 401, body: { error: 'Não autenticado.' } };
    return { status: 500, body: { error: 'Erro interno.' } };
  }),
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('novo_hash'),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRepresentante = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

const REP_SESSION = {
  representante_id: 7,
  nome: 'Rep Teste',
  cpf: '99988877766',
  status: 'ativo',
};

function makeReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest(
    'http://localhost:3000/api/representante/trocar-senha',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

describe('POST /api/representante/trocar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('401 se não autenticado', async () => {
    mockRequireRepresentante.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    const res = await POST(makeReq({ senha_atual: 'A', nova_senha: 'B' }));
    expect(res.status).toBe(401);
  });

  it('400 se senha_atual ausente', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(makeReq({ nova_senha: 'Nova1A_seg' }));
    expect(res.status).toBe(400);
  });

  it('400 se nova_senha ausente', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(makeReq({ senha_atual: 'Antiga1A' }));
    expect(res.status).toBe(400);
  });

  it('400 se nova senha muito curta', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'Ab1' })
    );
    expect(res.status).toBe(400);
  });

  it('400 se nova senha sem maiúscula', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'semmaius1' })
    );
    expect(res.status).toBe(400);
  });

  it('400 se nova senha sem número', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'SemNumero' })
    );
    expect(res.status).toBe(400);
  });

  it('400 se nova senha igual à atual (string compare)', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    const res = await POST(
      makeReq({ senha_atual: 'Mesma1A_', nova_senha: 'Mesma1A_' })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/diferente/i);
  });

  it('404 se registro de senha não encontrado', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/senha/i);
  });

  it('401 se senha atual incorreta', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ senha_hash: 'hash_antiga' }],
      rowCount: 1,
    } as any);
    (mockBcryptCompare as any).mockResolvedValue(false);
    const res = await POST(
      makeReq({ senha_atual: 'Errada1A', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/incorreta/i);
  });

  it('200: sucesso — retorna { success: true, codigo }', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any) // SELECT senha_hash
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE representantes_senhas
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // UPDATE representantes.senha_repres
      .mockResolvedValueOnce({
        rows: [{ codigo: '105' }],
        rowCount: 1,
      } as any); // SELECT codigo
    (mockBcryptCompare as any).mockResolvedValue(true);
    const res = await POST(
      makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.codigo).toBe('105');
  });

  it('200: deve atualizar representantes_senhas com nova hash', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{ codigo: '105' }],
        rowCount: 1,
      } as any);
    (mockBcryptCompare as any).mockResolvedValue(true);

    await POST(makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' }));

    const updateSenhasCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('representantes_senhas') &&
        sql.includes('senha_hash') &&
        sql.includes('primeira_senha_alterada')
    );
    expect(updateSenhasCall).toBeDefined();
  });

  it('200: deve atualizar representantes.senha_repres para retrocompatibilidade', async () => {
    mockRequireRepresentante.mockReturnValue(REP_SESSION as any);
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ senha_hash: 'hash_antiga' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{ codigo: '105' }],
        rowCount: 1,
      } as any);
    (mockBcryptCompare as any).mockResolvedValue(true);

    await POST(makeReq({ senha_atual: 'Antiga1A_', nova_senha: 'Nova1A_seg' }));

    const updateRepCall = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        sql.includes('UPDATE') &&
        sql.includes('representantes') &&
        sql.includes('senha_repres') &&
        !sql.includes('representantes_senhas')
    );
    expect(updateRepCall).toBeDefined();
  });
});
