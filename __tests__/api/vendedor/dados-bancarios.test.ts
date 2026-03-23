/**
 * @file __tests__/api/vendedor/dados-bancarios.test.ts
 *
 * Testes para GET e PATCH /api/vendedor/dados/bancarios
 * Cobre:
 * - 401 se não autenticado
 * - 404 se usuário não encontrado no banco
 * - GET 200 com dados bancários existentes
 * - GET 200 com null quando sem dados
 * - PATCH 200 UPDATE (registro existente)
 * - PATCH 200 INSERT (registro não existente — fallback)
 * - PATCH 200 com "Nenhum dado para atualizar" quando body vazio
 * - PATCH 400 com tipo_conta inválido (Zod)
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/vendedor/dados/bancarios/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

const VENDEDOR_SESSION = {
  cpf: '12345678901',
  nome: 'Vendedor Teste',
  perfil: 'vendedor' as const,
};

const DADOS_BANCARIOS_ROW = {
  banco_codigo: '001',
  agencia: '1234',
  conta: '56789-0',
  tipo_conta: 'corrente',
  titular_conta: 'Vendedor Teste',
  pix_chave: 'vendedor@email.com',
  pix_tipo: 'email',
  atualizado_em: new Date().toISOString(),
};

function makeReq(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/vendedor/dados/bancarios', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/vendedor/dados/bancarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
  });

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await GET();
    expect(res.status).toBe(401);
    const d = await res.json();
    expect(d.error).toBeDefined();
  });

  it('404 se usuário não existe no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('200 com dados_bancarios populados quando registro existe', async () => {
    // 1) SELECT usuarios
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42 }],
      rowCount: 1,
    } as any);
    // 2) SELECT vendedores_dados_bancarios
    mockQuery.mockResolvedValueOnce({
      rows: [DADOS_BANCARIOS_ROW],
      rowCount: 1,
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.dados_bancarios).toMatchObject({
      banco_codigo: '001',
      tipo_conta: 'corrente',
    });
  });

  it('200 com dados_bancarios null quando sem registro', async () => {
    // 1) SELECT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
    // 2) SELECT vendedores_dados_bancarios → vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.dados_bancarios).toBeNull();
  });
});

// ─── PATCH ───────────────────────────────────────────────────────────────────

describe('PATCH /api/vendedor/dados/bancarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(VENDEDOR_SESSION as any);
  });

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await PATCH(makeReq({ banco_codigo: '001' }));
    expect(res.status).toBe(401);
    const d = await res.json();
    expect(d.error).toBeDefined();
  });

  it('404 se usuário não existe no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await PATCH(makeReq({ banco_codigo: '001' }));
    expect(res.status).toBe(404);
  });

  it('400 com tipo_conta inválido (Zod)', async () => {
    // usuarios ok
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
    const res = await PATCH(makeReq({ tipo_conta: 'invalido' }));
    expect(res.status).toBe(400);
  });

  it('200 "Nenhum dado para atualizar" quando body sem campos reconhecidos', async () => {
    // usuarios ok
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
    const res = await PATCH(makeReq({}));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.message).toMatch(/nenhum dado/i);
  });

  it('200 UPDATE quando registro já existe', async () => {
    // 1) SELECT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
    // 2) UPDATE RETURNING → retorna linha (registro existente)
    mockQuery.mockResolvedValueOnce({
      rows: [DADOS_BANCARIOS_ROW],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeReq({ banco_codigo: '001', tipo_conta: 'corrente' })
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.message).toMatch(/atualizados/i);
    expect(d.dados_bancarios).toMatchObject({ banco_codigo: '001' });
  });

  it('200 INSERT quando registro não existe ainda (UPDATE retorna 0 linhas)', async () => {
    // 1) SELECT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
    // 2) UPDATE RETURNING → vazio (registro não existe)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 3) INSERT RETURNING → nova linha
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...DADOS_BANCARIOS_ROW, banco_codigo: '237' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeReq({ banco_codigo: '237', tipo_conta: 'poupanca' })
    );
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.message).toMatch(/atualizados/i);
    expect(d.dados_bancarios).toMatchObject({ banco_codigo: '237' });
  });

  it('deve chamar UPDATE antes de tentar INSERT (upsert sequencial)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // UPDATE sem linhas
      .mockResolvedValueOnce({
        rows: [DADOS_BANCARIOS_ROW],
        rowCount: 1,
      } as any); // INSERT

    await PATCH(makeReq({ banco_codigo: '001' }));

    const [updateCall, insertCall] = [
      mockQuery.mock.calls[1], // índice 1 = segunda chamada (UPDATE)
      mockQuery.mock.calls[2], // índice 2 = terceira chamada (INSERT)
    ];

    expect(updateCall[0].toUpperCase()).toContain('UPDATE');
    expect(insertCall[0].toUpperCase()).toContain('INSERT');
  });
});
