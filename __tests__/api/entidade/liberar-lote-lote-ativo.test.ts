/**
 * @file __tests__/api/entidade/liberar-lote-lote-ativo.test.ts
 * Regressão: /api/entidade/liberar-lote deve retornar 409 quando já existe lote ativo para a entidade.
 * Criado como parte do fix do Issue #4 do mecanismo de elegibilidade.
 */

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { queryAsGestorEntidade } from '@/lib/db-gestor';
import { requireEntity } from '@/lib/session';
import { POST } from '@/app/api/entidade/liberar-lote/route';

const mockQueryAsGestorEntidade = queryAsGestorEntidade as jest.MockedFunction<
  typeof queryAsGestorEntidade
>;
const mockRequireEntity = requireEntity as jest.MockedFunction<
  typeof requireEntity
>;

const GESTOR_SESSION = {
  cpf: '12345678901',
  perfil: 'gestor' as const,
  entidade_id: 10,
};

describe('/api/entidade/liberar-lote — check lote ativo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireEntity.mockResolvedValue(GESTOR_SESSION as any);
  });

  const makeRequest = () =>
    new NextRequest('http://localhost:3000/api/entidade/liberar-lote', {
      method: 'POST',
      body: JSON.stringify({}),
    });

  it('deve retornar 409 quando já existe lote com status "ativo" para a entidade', async () => {
    // 1) hasEntidadeFuncsRes — funcionários existem
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
    } as any);
    // 2) entidadeRes
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste' }],
      rowCount: 1,
    } as any);
    // 3) lote ativo check — lote com status 'ativo'
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ id: 55, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.lote_atual_id).toBe(55);
    expect(data.error).toContain('andamento');
  });

  it('deve retornar 409 quando status é "emissao_em_andamento"', async () => {
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
    } as any);
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste' }],
      rowCount: 1,
    } as any);
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ id: 56, status: 'emissao_em_andamento' }],
      rowCount: 1,
    } as any);

    const response = await POST(makeRequest());
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.lote_atual_id).toBe(56);
    expect(data.error).toContain('andamento');
  });

  it('deve prosseguir quando último lote está "emitido" (status não bloqueante)', async () => {
    // 1) hasEntidadeFuncsRes
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
    } as any);
    // 2) entidadeRes
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste' }],
      rowCount: 1,
    } as any);
    // 3) lote ativo check — 'emitido' (não bloqueante)
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ id: 50, status: 'emitido' }],
      rowCount: 1,
    } as any);
    // 4) numero_ordem (obter_proximo_numero_ordem_entidade)
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ numero_ordem: 3 }],
      rowCount: 1,
    } as any);
    // 5) elegibilidade — sem funcionários elegíveis
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const response = await POST(makeRequest());
    const data = await response.json();

    // Sem funcionários elegíveis → 400 (não 409), confirma que passou pelo check de lote ativo
    expect(response.status).toBe(400);
    expect(data.error).toContain('elegível');
  });

  it('deve prosseguir quando não há nenhum lote anterior', async () => {
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ '?column?': 1 }],
      rowCount: 1,
    } as any);
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ nome: 'Entidade Teste' }],
      rowCount: 1,
    } as any);
    // sem lote anterior
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);
    // numero_ordem
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [{ numero_ordem: 1 }],
      rowCount: 1,
    } as any);
    // elegibilidade — sem funcionários
    mockQueryAsGestorEntidade.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const response = await POST(makeRequest());
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('elegível');
  });
});
