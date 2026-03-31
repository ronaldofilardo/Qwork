/**
 * @file __tests__/representante/criar-senha.test.ts
 *
 * Testes para POST /api/representante/criar-senha
 * Verifica criação de senha via link de convite, incluindo que
 * primeira_senha_alterada = TRUE (não exige troca de senha no primeiro login).
 */

import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashedpassword'),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

const VALID_TOKEN = 'a'.repeat(64);
const FUTURE_DATE = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
).toISOString();

function mockRepresentanteRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 10,
    nome: 'Representante Teste',
    email: 'rep@test.com',
    status: 'aguardando_senha',
    convite_expira_em: FUTURE_DATE,
    convite_tentativas_falhas: 0,
    convite_usado_em: null,
    ...overrides,
  };
}

function makePostRequest(body: Record<string, string>): any {
  return { json: () => Promise.resolve(body) };
}

function makeGetRequest(token: string): any {
  return {
    url: `http://localhost/api/representante/criar-senha?token=${token}`,
  };
}

describe('POST /api/representante/criar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sucesso — primeira_senha_alterada = TRUE', () => {
    it('grava primeira_senha_alterada = TRUE no INSERT de representantes_senhas', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow()],
          rowCount: 1,
        } as any) // SELECT representante FOR UPDATE
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', cpf_responsavel_pj: null }],
          rowCount: 1,
        } as any) // SELECT cpf
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any) // INSERT representantes_senhas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE representantes

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(200);

      // Verificar chamada ao INSERT de senhas com primeira_senha_alterada = TRUE
      const senhaInsertCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' &&
          sql.includes('representantes_senhas') &&
          (sql.includes('INSERT') || sql.includes('ON CONFLICT'))
      );
      expect(senhaInsertCall).toBeDefined();
      const sqlUpdate = senhaInsertCall![0];
      expect(sqlUpdate).toMatch(/primeira_senha_alterada\s*=\s*TRUE/i);
    });

    it('NÃO usa FALSE para primeira_senha_alterada (evita loop de troca de senha)', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow()],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', cpf_responsavel_pj: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      const senhaInsertCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('representantes_senhas')
      );
      expect(senhaInsertCall).toBeDefined();
      const sqlUpdate = senhaInsertCall![0];
      // Não deve conter FALSE para primeira_senha_alterada
      expect(sqlUpdate).not.toMatch(/primeira_senha_alterada\s*=\s*FALSE/i);
    });

    it('atualiza status do representante para apto', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow()],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', cpf_responsavel_pj: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'SenhaForte1',
          confirmacao: 'SenhaForte1',
        })
      );
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // UPDATE deve definir status = 'apto'
      const updateCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' &&
          sql.includes('UPDATE representantes') &&
          sql.includes('apto')
      );
      expect(updateCall).toBeDefined();
    });

    it('apaga convite_token após uso', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow()],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', cpf_responsavel_pj: null }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'SenhaForte1',
          confirmacao: 'SenhaForte1',
        })
      );

      const updateCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' &&
          sql.includes('convite_token') &&
          sql.includes('NULL')
      );
      expect(updateCall).toBeDefined();
    });

    it('usa cpf_responsavel_pj para PJ quando cpf é null', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow({ id: 20 })],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({
          rows: [{ cpf: null, cpf_responsavel_pj: '98765432100' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'SenhaForte1',
          confirmacao: 'SenhaForte1',
        })
      );

      expect(res.status).toBe(200);

      // O cpf passado no INSERT de senhas deve ser o cpf_responsavel_pj
      const senhaInsertCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' && sql.includes('representantes_senhas')
      );
      expect(senhaInsertCall).toBeDefined();
      const params = senhaInsertCall![1] as unknown[];
      expect(params).toContain('98765432100');
    });
  });

  describe('Validações — 400', () => {
    it('retorna 400 quando token é inválido (comprimento errado)', async () => {
      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: 'curtodemais',
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(400);
    });

    it('retorna 400 quando senha e confirmação não conferem', async () => {
      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Diferente1',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/não conferem/i);
    });

    it('retorna 400 quando token não é encontrado no banco', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/token/i);
    });

    it('retorna 400 quando convite já foi usado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          mockRepresentanteRow({ convite_usado_em: '2026-01-01T00:00:00Z' }),
        ],
        rowCount: 1,
      } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/já foi utilizado/i);
    });

    it('retorna 400 quando convite expirou', async () => {
      const pastDate = new Date(Date.now() - 1000).toISOString();
      mockQuery
        .mockResolvedValueOnce({
          rows: [mockRepresentanteRow({ convite_expira_em: pastDate })],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE status expirado

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/expirado/i);
    });

    it('retorna 400 quando convite está bloqueado por tentativas', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [mockRepresentanteRow({ convite_tentativas_falhas: 3 })],
        rowCount: 1,
      } as any);

      const { POST } =
        await import('@/app/api/representante/criar-senha/route');

      const res = await POST(
        makePostRequest({
          token: VALID_TOKEN,
          senha: 'Senha1234',
          confirmacao: 'Senha1234',
        })
      );

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/bloqueado/i);
    });
  });
});

describe('GET /api/representante/criar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna valido:true quando token válido e não expirado', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          nome: 'Representante Teste',
          email: 'rep@test.com',
          status: 'aguardando_senha',
          convite_expira_em: FUTURE_DATE,
          convite_tentativas_falhas: 0,
          convite_usado_em: null,
        },
      ],
      rowCount: 1,
    } as any);

    const { GET } = await import('@/app/api/representante/criar-senha/route');

    const res = await GET(makeGetRequest(VALID_TOKEN));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.valido).toBe(true);
    expect(data.nome).toBe('Representante Teste');
  });

  it('retorna valido:false quando token inválido', async () => {
    const { GET } = await import('@/app/api/representante/criar-senha/route');

    const res = await GET(makeGetRequest('tokenCurto'));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.valido).toBe(false);
    expect(data.motivo).toBe('token_invalido');
  });
});
