/**
 * @file __tests__/auth/representante-criar-senha-erros.test.ts
 *
 * Testes de cenários de erro para os endpoints:
 *   GET  /api/representante/criar-senha?token=XXX  (valida token)
 *   POST /api/representante/criar-senha             (cria senha)
 *
 * Cenários cobertos:
 *  - Token expirado (GET e POST)
 *  - Token já usado (GET e POST)
 *  - Token bloqueado por tentativas falhadas (GET e POST)
 *  - Representative com status desativado → operação negada
 *  - Senha fraca: muito curta, sem maiúscula, sem número
 *  - Senha e confirmação divergem
 *  - Token inválido (comprimento errado)
 *  - Token não encontrado no banco
 *  - POST cria sessão corretamente e retorna success=true quando dados são válidos
 *  - POST grava primeira_senha_alterada=TRUE (não provoca loop de troca de senha)
 */

import { NextRequest } from 'next/server';
import {
  GET as GET_CRIAR_SENHA,
  POST as POST_CRIAR_SENHA,
} from '@/app/api/representante/criar-senha/route';
import { query } from '@/lib/db';
import { createSession } from '@/lib/session';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ createSession: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hash_falsa123'),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockCreateSession = createSession as jest.MockedFunction<
  typeof createSession
>;

const TOKEN_VALIDO = 'a'.repeat(64);

function makeGetReq(token?: string): NextRequest {
  const url = token
    ? `http://localhost/api/representante/criar-senha?token=${token}`
    : 'http://localhost/api/representante/criar-senha';
  return new NextRequest(url, { method: 'GET' });
}

function makePostReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/representante/criar-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/** Helper: representante base com token válido */
function repValido(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    nome: 'Rep Teste',
    email: 'rep@test.com',
    cpf: '12345678901',
    cpf_responsavel_pj: null,
    status: 'aguardando_senha',
    convite_expira_em: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    convite_tentativas_falhas: 0,
    convite_usado_em: null,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — validar token
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/representante/criar-senha — validação de token', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 400 se token ausente', async () => {
    const res = await GET_CRIAR_SENHA(makeGetReq());
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_invalido');
  });

  it('retorna 400 se token com comprimento errado', async () => {
    const res = await GET_CRIAR_SENHA(makeGetReq('curto'));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_invalido');
  });

  it('retorna 400 se token não encontrado no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await GET_CRIAR_SENHA(makeGetReq(TOKEN_VALIDO));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_invalido');
  });

  it('retorna 400 com motivo token_ja_usado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [repValido({ convite_usado_em: new Date().toISOString() })],
    } as any);
    const res = await GET_CRIAR_SENHA(makeGetReq(TOKEN_VALIDO));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_ja_usado');
  });

  it('retorna 400 com motivo token_expirado quando data no passado', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          repValido({
            convite_expira_em: new Date(Date.now() - 1000).toISOString(),
          }),
        ],
      } as any)
      // mock do UPDATE lazy de expiração
      .mockResolvedValueOnce({ rows: [] } as any);

    const res = await GET_CRIAR_SENHA(makeGetReq(TOKEN_VALIDO));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_expirado');
  });

  it('retorna 400 com motivo token_bloqueado quando tentativas >= 3', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [repValido({ convite_tentativas_falhas: 3 })],
    } as any);
    const res = await GET_CRIAR_SENHA(makeGetReq(TOKEN_VALIDO));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.motivo).toBe('token_bloqueado');
  });

  it('retorna valido=true quando token é válido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [repValido()],
    } as any);
    const res = await GET_CRIAR_SENHA(makeGetReq(TOKEN_VALIDO));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.valido).toBe(true);
    expect(d.nome).toBe('Rep Teste');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST — criar senha
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/representante/criar-senha — cenários de erro de senha', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna 400 se token ausente no body', async () => {
    const res = await POST_CRIAR_SENHA(
      makePostReq({ senha: 'Senha123!', confirmacao: 'Senha123!' })
    );
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/token/i);
  });

  it('retorna 400 se senha e confirmacao divergem', async () => {
    const res = await POST_CRIAR_SENHA(
      makePostReq({
        token: TOKEN_VALIDO,
        senha: 'Senha123!',
        confirmacao: 'Diferente123!',
      })
    );
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/confirma/i);
  });

  it('retorna 400 se senha for muito curta (< 8 chars)', async () => {
    const res = await POST_CRIAR_SENHA(
      makePostReq({ token: TOKEN_VALIDO, senha: 'Ab1!', confirmacao: 'Ab1!' })
    );
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/8 caracteres/i);
  });

  it('retorna 400 se senha não tiver maiúscula', async () => {
    const res = await POST_CRIAR_SENHA(
      makePostReq({
        token: TOKEN_VALIDO,
        senha: 'semmaius1!',
        confirmacao: 'semmaius1!',
      })
    );
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/maiúscula/i);
  });

  it('retorna 400 se senha não tiver número', async () => {
    const res = await POST_CRIAR_SENHA(
      makePostReq({
        token: TOKEN_VALIDO,
        senha: 'SemNumero!',
        confirmacao: 'SemNumero!',
      })
    );
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/número/i);
  });
});

describe('POST /api/representante/criar-senha — cenários de erro de token no banco', () => {
  beforeEach(() => jest.clearAllMocks());

  const bodyValido = {
    token: TOKEN_VALIDO,
    senha: 'Senha123!',
    confirmacao: 'Senha123!',
  };

  it('retorna 400 se token não encontrado no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);
    const res = await POST_CRIAR_SENHA(makePostReq(bodyValido));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/token/i);
  });

  it('retorna 400 se convite já foi usado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [repValido({ convite_usado_em: new Date().toISOString() })],
    } as any);
    const res = await POST_CRIAR_SENHA(makePostReq(bodyValido));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/já foi utilizado/i);
  });

  it('retorna 400 se link expirado', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          repValido({
            convite_expira_em: new Date(Date.now() - 1000).toISOString(),
          }),
        ],
      } as any)
      .mockResolvedValueOnce({ rows: [] } as any); // UPDATE expirado

    const res = await POST_CRIAR_SENHA(makePostReq(bodyValido));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/expirado/i);
  });

  it('retorna 400 se link bloqueado por tentativas', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [repValido({ convite_tentativas_falhas: 5 })],
    } as any);
    const res = await POST_CRIAR_SENHA(makePostReq(bodyValido));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/bloqueado/i);
  });
});

describe('POST /api/representante/criar-senha — sucesso e garantia anti-loop', () => {
  beforeEach(() => jest.clearAllMocks());

  const bodyValido = {
    token: TOKEN_VALIDO,
    senha: 'Senha123!',
    confirmacao: 'Senha123!',
  };

  it('retorna 200 com success=true e chama createSession', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [repValido()] } as any) // SELECT representante
      .mockResolvedValueOnce({ rows: [] } as any) // INSERT representantes_senhas
      .mockResolvedValueOnce({ rows: [] } as any); // UPDATE representantes

    const res = await POST_CRIAR_SENHA(makePostReq(bodyValido));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.success).toBe(true);
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ representante_id: 42, perfil: 'representante' })
    );
  });

  it('grava primeira_senha_alterada=TRUE no INSERT (anti-loop)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [repValido()] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await POST_CRIAR_SENHA(makePostReq(bodyValido));

    // A segunda chamada ao query deve ser o INSERT com TRUE
    const insertCall = mockQuery.mock.calls[1];
    const sql = insertCall[0];
    expect(sql).toMatch(/primeira_senha_alterada/i);
    expect(sql).toMatch(/TRUE/);
    expect(sql).not.toMatch(/FALSE/);
  });

  it('o ON CONFLICT DO UPDATE também usa TRUE (não regride o flag)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [repValido()] } as any)
      .mockResolvedValueOnce({ rows: [] } as any)
      .mockResolvedValueOnce({ rows: [] } as any);

    await POST_CRIAR_SENHA(makePostReq(bodyValido));

    const insertCall = mockQuery.mock.calls[1];
    const sql = insertCall[0];
    // Deve conter "primeira_senha_alterada = TRUE" no DO UPDATE
    expect(sql).toMatch(/DO UPDATE SET.*primeira_senha_alterada = TRUE/s);
  });
});
