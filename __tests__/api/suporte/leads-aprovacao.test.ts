import { NextRequest } from 'next/server';
import { PATCH as patchAprovar } from '@/app/api/suporte/leads/[id]/aprovar/route';
import { PATCH as patchRejeitar } from '@/app/api/suporte/leads/[id]/rejeitar/route';

// Factory mocks explícitos garantem que o mesmo jest.fn() é usado por AMBAS as rotas
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(
  path: string,
  body?: unknown
): NextRequest {
  return new NextRequest(`http://localhost${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : JSON.stringify({}),
  });
}

/**
 * Helper para rotas que leem request.json().catch(...).
 * Em jsdom NextRequest.json() pode retornar não-Promise, quebrando o .catch().
 * Este helper garante que json() retorna Promise.resolve(body).
 */
function makeRejeitarRequest(id: string, body: unknown = {}): NextRequest {
  return { json: () => Promise.resolve(body) } as unknown as NextRequest;
}

const leadPendente = {
  id: 5,
  status: 'pendente',
  requer_aprovacao_suporte: true,
};

const leadSemFlag = {
  id: 6,
  status: 'pendente',
  requer_aprovacao_suporte: false,
};

const leadAprovado = {
  id: 7,
  status: 'aprovado',
  requer_aprovacao_suporte: true,
};

describe('PATCH /api/suporte/leads/[id]/aprovar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
  });

  it('deve aprovar lead pendente com flag requer_aprovacao_suporte=true', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await patchAprovar(
      makeRequest('/api/suporte/leads/5/aprovar'),
      { params: { id: '5' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/aprovado/i);
  });

  it('deve retornar 409 quando lead não requer aprovação do suporte', async () => {
    // Arrange — lead sem a flag de aprovação suporte
    mockQuery.mockResolvedValueOnce({ rows: [leadSemFlag], rowCount: 1 } as any);

    // Act
    const res = await patchAprovar(
      makeRequest('/api/suporte/leads/6/aprovar'),
      { params: { id: '6' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/não requer aprovação/i);
  });

  it('deve retornar 409 quando lead não está com status pendente', async () => {
    // Arrange — lead já aprovado não pode ser re-aprovado
    mockQuery.mockResolvedValueOnce({ rows: [leadAprovado], rowCount: 1 } as any);

    // Act
    const res = await patchAprovar(
      makeRequest('/api/suporte/leads/7/aprovar'),
      { params: { id: '7' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/pendentes/i);
  });

  it('deve retornar 404 quando lead não existe', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await patchAprovar(
      makeRequest('/api/suporte/leads/999/aprovar'),
      { params: { id: '999' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 403 quando usuário não tem permissão', async () => {
    // Arrange — perfil sem acesso
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await patchAprovar(
      makeRequest('/api/suporte/leads/5/aprovar'),
      { params: { id: '5' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });
});

describe('PATCH /api/suporte/leads/[id]/rejeitar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve rejeitar lead pendente com motivo', async () => {
    // Arrange — session + query mocks configurados aqui para evitar interferências entre describes
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act — makeRejeitarRequest garante json() retorna Promise (compatibilidade jsdom)
    const res = await patchRejeitar(
      makeRejeitarRequest('5', { motivo: 'Valor abaixo do custo minimo' }),
      { params: { id: '5' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.message).toMatch(/rejeitado/i);
  });

  it('deve rejeitar lead pendente sem motivo (motivo é opcional)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [leadPendente], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act — sem campo motivo no body
    const res = await patchRejeitar(
      makeRejeitarRequest('5'),
      { params: { id: '5' } }
    );
    const data = await res.json();

    // Assert — motivo é opcional: deve funcionar
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('deve retornar 409 quando lead não requer aprovação do suporte', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [leadSemFlag], rowCount: 1 } as any);

    // Act
    const res = await patchRejeitar(
      makeRejeitarRequest('6', { motivo: 'Teste' }),
      { params: { id: '6' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/não requer aprovação/i);
  });

  it('deve retornar 404 quando lead não existe', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11111111111',
      nome: 'Suporte',
      perfil: 'suporte',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await patchRejeitar(
      makeRejeitarRequest('999', { motivo: 'Teste' }),
      { params: { id: '999' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('deve retornar 403 quando usuário não tem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act — 403 não precisa de body (rejeita antes)
    const res = await patchRejeitar(
      makeRejeitarRequest('5'),
      { params: { id: '5' } }
    );
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBeDefined();
  });
});
