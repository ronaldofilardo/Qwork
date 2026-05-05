/**
 * @file __tests__/api/rh/liberar-lote-lote-ativo.test.ts
 * Regressão: /api/rh/liberar-lote deve retornar 409 quando já existe lote ativo para a empresa.
 * Criado como parte do fix do Issue #4 do mecanismo de elegibilidade.
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorRH: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole, requireRHWithEmpresaAccess } from '@/lib/session';
import { POST } from '@/app/api/rh/liberar-lote/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

const RH_USER = {
  cpf: '04703084945',
  nome: 'Triagem Curitiba',
  perfil: 'rh' as const,
  clinica_id: 5,
};

describe('/api/rh/liberar-lote — check lote ativo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(RH_USER as any);
    mockRequireRHWithEmpresaAccess.mockResolvedValue({} as any);
  });

  const makeRequest = (empresaId: number) =>
    new NextRequest('http://localhost:3000/api/rh/liberar-lote', {
      method: 'POST',
      body: JSON.stringify({ empresaId }),
    });

  it('deve retornar 409 quando já existe lote com status "ativo"', async () => {
    // empresa check
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          clinica_id: 5,
          nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
        },
      ],
      rowCount: 1,
    } as any);

    // lote ativo check — lote com status 'ativo' encontrado
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 42, status: 'ativo' }],
      rowCount: 1,
    } as any);

    const response = await POST(makeRequest(7));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.lote_atual_id).toBe(42);
    expect(data.error).toContain('andamento');
  });

  it('deve retornar 409 quando status é "emissao_solicitada"', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          clinica_id: 5,
          nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
        },
      ],
      rowCount: 1,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 43, status: 'emissao_solicitada' }],
      rowCount: 1,
    } as any);

    const response = await POST(makeRequest(7));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.lote_atual_id).toBe(43);
    expect(data.error).toContain('solicitada');
  });

  it('deve retornar 409 quando status é "rascunho"', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          clinica_id: 5,
          nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
        },
      ],
      rowCount: 1,
    } as any);

    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 44, status: 'rascunho' }],
      rowCount: 1,
    } as any);

    const response = await POST(makeRequest(7));
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.lote_atual_id).toBe(44);
    expect(data.error).toContain('rascunho');
  });

  it('deve prosseguir quando último lote está "emitido" (status não bloqueante)', async () => {
    // empresa check
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          clinica_id: 5,
          nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
        },
      ],
      rowCount: 1,
    } as any);

    // lote ativo check — lote com status 'emitido' (não bloqueante)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 40, status: 'emitido' }],
      rowCount: 1,
    } as any);

    // isentoRes
    mockQuery.mockResolvedValueOnce({
      rows: [{ isento_pagamento: false }],
      rowCount: 1,
    } as any);

    // queryAsGestorRH: numero_ordem
    const { queryAsGestorRH } = require('@/lib/db-gestor');
    (queryAsGestorRH as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ numero_ordem: 2 }], rowCount: 1 })
      // elegibilidade — sem funcionários (vai retornar 400, não 409)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await POST(makeRequest(7));

    // 400 significa que passou pelo check de lote ativo (não foi 409)
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('elegível');
  });

  it('deve prosseguir quando não há nenhum lote anterior', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          clinica_id: 5,
          nome: 'Empresa Teste',
          clinica_nome: 'Clínica Teste',
        },
      ],
      rowCount: 1,
    } as any);

    // sem lote anterior
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // isentoRes
    mockQuery.mockResolvedValueOnce({
      rows: [{ isento_pagamento: false }],
      rowCount: 1,
    } as any);

    const { queryAsGestorRH } = require('@/lib/db-gestor');
    (queryAsGestorRH as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ numero_ordem: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const response = await POST(makeRequest(7));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toContain('elegível');
  });
});
