/**
 * Testes para PATCH /api/suporte/representantes/[id]
 *
 * Cobre as alterações desta sessão:
 * - Mensagem de erro específica por campo (Zod flatten → fieldLabel)
 * - `details.fieldErrors` retornados para o frontend usar inline
 * - Campos permitidos: nome, email, telefone, status
 * - Segurança: somente perfil suporte
 */
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/suporte/representantes/[id]/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/suporte/representantes/${id}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
}

const baseSession = {
  cpf: '11111111111',
  nome: 'Suporte Dev',
  perfil: 'suporte',
} as any;

describe('PATCH /api/suporte/representantes/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(baseSession);
  });

  // ---------------------------------------------------------------------------
  // Segurança e validação de parâmetros
  // ---------------------------------------------------------------------------
  it('retorna 401 quando sem permissão', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await PATCH(makeRequest('1', { nome: 'X' }), {
      params: { id: '1' },
    });
    expect(res.status).toBe(401);
  });

  it('retorna 400 para ID não numérico', async () => {
    const res = await PATCH(makeRequest('abc', { nome: 'X' }), {
      params: { id: 'abc' },
    });
    expect(res.status).toBe(400);
  });

  it('retorna 404 quando representante não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await PATCH(makeRequest('99', { nome: 'Teste' }), {
      params: { id: '99' },
    });
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // Erro específico por campo (nova feature desta sessão)
  // ---------------------------------------------------------------------------
  it('retorna mensagem específica "E-mail: ..." para email inválido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeRequest('1', { email: 'nao-e-email' }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/e-mail/i);
    expect(data.details?.fieldErrors?.email).toBeDefined();
  });

  it('inclui details.fieldErrors no corpo do erro de validação', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeRequest('1', { nome: 'X' }), // nome < 2 chars
      { params: { id: '1' } }
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.details).toBeDefined();
    expect(data.details.fieldErrors).toBeDefined();
  });

  it('retorna 400 para campo nenhum a atualizar', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(makeRequest('1', {}), { params: { id: '1' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/nenhum campo/i);
  });

  // ---------------------------------------------------------------------------
  // Atualização bem-sucedida
  // ---------------------------------------------------------------------------
  it('retorna 200 e dados ao atualizar nome com sucesso', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'ativo' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Novo Nome',
            email: 'rep@test.com',
            status: 'ativo',
            atualizado_em: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      } as any);

    const res = await PATCH(
      makeRequest('1', { nome: 'Novo Nome' }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).toBeDefined();
    expect(data.representante.nome).toBe('Novo Nome');
  });

  it('aceita telefone nulo explicitamente (limpeza)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'ativo' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Rep',
            email: 'rep@test.com',
            status: 'ativo',
            atualizado_em: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      } as any);

    const res = await PATCH(
      makeRequest('1', { telefone: null }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(200);
  });

  it('aceita status válido apto_pendente', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'ativo' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Rep',
            email: 'rep@test.com',
            status: 'apto_pendente',
            atualizado_em: new Date().toISOString(),
          },
        ],
        rowCount: 1,
      } as any);

    const res = await PATCH(
      makeRequest('1', { status: 'apto_pendente' }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(200);
  });

  it('retorna 400 para status inválido', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const res = await PATCH(
      makeRequest('1', { status: 'inventado' }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(400);
  });
});
