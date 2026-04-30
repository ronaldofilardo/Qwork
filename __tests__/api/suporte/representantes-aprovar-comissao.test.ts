/**
 * Testes para POST /api/suporte/representantes/[id]/aprovar-comissao
 *
 * Cobre:
 * - Autenticação (somente suporte)
 * - Blocklist de status (rejeitado, desativado, suspenso)
 * - Modelo percentual: percentual obrigatório
 * - Modelo custo_fixo: ambos valores obrigatórios, positivos
 * - Ativação para 'apto' no sucesso
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/suporte/representantes/[id]/aprovar-comissao/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(id: string, body: unknown): NextRequest {
  return new NextRequest(
    `http://localhost/api/suporte/representantes/${id}/aprovar-comissao`,
    {
      method: 'POST',
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

describe('POST /api/suporte/representantes/[id]/aprovar-comissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(baseSession);
  });

  // ---------------------------------------------------------------------------
  // Segurança
  // ---------------------------------------------------------------------------
  it('retorna 401 quando não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await POST(
      makeRequest('1', { modelo: 'percentual', percentual: 10 }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(401);
  });

  it('retorna 401 quando sem permissão (não é suporte)', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await POST(
      makeRequest('1', { modelo: 'percentual', percentual: 10 }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(401);
  });

  it('retorna 400 para ID inválido', async () => {
    const res = await POST(
      makeRequest('abc', { modelo: 'percentual', percentual: 10 }),
      { params: { id: 'abc' } }
    );
    expect(res.status).toBe(400);
  });

  // ---------------------------------------------------------------------------
  // Representante não encontrado
  // ---------------------------------------------------------------------------
  it('retorna 404 quando representante não existe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(
      makeRequest('99', { modelo: 'percentual', percentual: 10 }),
      { params: { id: '99' } }
    );
    expect(res.status).toBe(404);
  });

  // ---------------------------------------------------------------------------
  // Blocklist de status
  // ---------------------------------------------------------------------------
  it.each(['rejeitado', 'desativado', 'suspenso'])(
    'retorna 409 quando representante está %s',
    async (status) => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Rep', status }],
        rowCount: 1,
      } as any);

      const res = await POST(
        makeRequest('1', { modelo: 'percentual', percentual: 10 }),
        { params: { id: '1' } }
      );
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.code).toBe('STATUS_INVALIDO');
    }
  );

  // ---------------------------------------------------------------------------
  // Modelo percentual
  // ---------------------------------------------------------------------------
  it('retorna 422 para modelo percentual sem percentual', async () => {
    const res = await POST(
      makeRequest('1', { modelo: 'percentual' }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('retorna 422 para percentual = 0', async () => {
    const res = await POST(
      makeRequest('1', { modelo: 'percentual', percentual: 0 }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('retorna 422 para percentual > 40', async () => {
    const res = await POST(
      makeRequest('1', { modelo: 'percentual', percentual: 50 }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('aprova modelo percentual com sucesso e ativa representante', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, nome: 'Rep Teste', status: 'apto_pendente' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(
      makeRequest('1', { modelo: 'percentual', percentual: 10 }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Valida que o UPDATE foi chamado com status 'apto' no SQL e modelo/percentual nos params
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[0]).toMatch(/SET/i);
    expect(updateCall[0]).toMatch(/status\s*=\s*'apto'/);
    expect(updateCall[1]).toContain('percentual');
    expect(updateCall[1]).toContain(10);
  });

  // ---------------------------------------------------------------------------
  // Modelo custo_fixo
  // ---------------------------------------------------------------------------
  it('retorna 422 para modelo custo_fixo sem valor_custo_fixo_entidade', async () => {
    const res = await POST(
      makeRequest('1', {
        modelo: 'custo_fixo',
        valor_custo_fixo_clinica: 5,
      }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('retorna 422 para modelo custo_fixo sem valor_custo_fixo_clinica', async () => {
    const res = await POST(
      makeRequest('1', {
        modelo: 'custo_fixo',
        valor_custo_fixo_entidade: 12,
      }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('retorna 422 para valor_custo_fixo_entidade = 0', async () => {
    const res = await POST(
      makeRequest('1', {
        modelo: 'custo_fixo',
        valor_custo_fixo_entidade: 0,
        valor_custo_fixo_clinica: 5,
      }),
      { params: { id: '1' } }
    );
    expect(res.status).toBe(422);
  });

  it('aprova modelo custo_fixo com sucesso', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 2, nome: 'Rep CF', status: 'ativo' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(
      makeRequest('2', {
        modelo: 'custo_fixo',
        valor_custo_fixo_entidade: 15,
        valor_custo_fixo_clinica: 8,
        asaas_wallet_id: 'wallet-abc-123',
      }),
      { params: { id: '2' } }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);

    // Valida que o UPDATE salva ambos os valores
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1]).toContain(15); // valor entidade
    expect(updateCall[1]).toContain(8);  // valor clínica
    expect(updateCall[1]).toContain('custo_fixo');
  });

  it('aprova com wallet_id opcional omitido (null)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 3, nome: 'Rep Sem Wallet', status: 'ativo' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    const res = await POST(
      makeRequest('3', {
        modelo: 'percentual',
        percentual: 15,
      }),
      { params: { id: '3' } }
    );
    expect(res.status).toBe(200);
  });
});
