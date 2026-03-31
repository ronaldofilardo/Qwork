/**
 * @file __tests__/api/representante/equipe-reenviar-convite.test.ts
 *
 * Testes para POST /api/representante/equipe/vendedores/[id]/reenviar-convite
 * Cobre:
 *  - Retorna convite_url quando vendedor não concluiu onboarding
 *  - Retorna 409 quando aceite_termos = TRUE (já concluiu)
 *  - Retorna 404 quando vendedor não pertence à equipe
 *  - Apenas representantes autenticados podem chamar
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session-representante', () => ({
  requireRepresentante: jest.fn(),
  repAuthErrorResponse: jest.fn((e: Error) => ({
    body: { error: e.message },
    status: 401,
  })),
}));
jest.mock('@/lib/vendedores/gerar-convite', () => ({
  gerarTokenConviteVendedor: jest.fn(),
  logEmailConviteVendedor: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/representante/equipe/vendedores/[id]/reenviar-convite/route';
import { query } from '@/lib/db';
import { requireRepresentante } from '@/lib/session-representante';
import { gerarTokenConviteVendedor } from '@/lib/vendedores/gerar-convite';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRep = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockGerarConvite = gerarTokenConviteVendedor as jest.MockedFunction<
  typeof gerarTokenConviteVendedor
>;

const REP_SESSION = {
  cpf: '11111111111',
  nome: 'Rep Teste',
  representante_id: 1,
};

function makeRequest(id: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/representante/equipe/vendedores/${id}/reenviar-convite`,
    { method: 'POST' }
  );
}

function makeParams(id: string) {
  return { params: { id } };
}

describe('POST /api/representante/equipe/vendedores/[id]/reenviar-convite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRep.mockReturnValue(REP_SESSION as never);
  });

  it('retorna 400 para ID inválido', async () => {
    const res = await POST(makeRequest('abc'), makeParams('abc'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/id inválido/i);
  });

  it('retorna 404 quando vendedor não pertence à equipe', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as never);

    const res = await POST(makeRequest('99'), makeParams('99'));
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('retorna 409 quando vendedor já concluiu o onboarding (aceite_termos = true)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          vendedor_id: 75,
          vendedor_nome: 'Seller Teste',
          vendedor_email: 'seller@test.com',
          aceite_termos: true,
        },
      ],
      rowCount: 1,
    } as never);

    const res = await POST(makeRequest('75'), makeParams('75'));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toMatch(/já concluiu/i);
  });

  it('retorna convite_url quando onboarding pendente', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          vendedor_id: 75,
          vendedor_nome: 'Seller Teste',
          vendedor_email: 'seller@test.com',
          aceite_termos: false,
        },
      ],
      rowCount: 1,
    } as never);
    mockGerarConvite.mockResolvedValueOnce({
      token: 'a'.repeat(64),
      link: 'http://localhost/vendedor/criar-senha?token=' + 'a'.repeat(64),
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const res = await POST(makeRequest('75'), makeParams('75'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.convite_url).toContain('/vendedor/criar-senha?token=');
  });

  it('chama gerarTokenConviteVendedor com o id correto', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          vendedor_id: 75,
          vendedor_nome: 'Seller Teste',
          vendedor_email: 'seller@test.com',
          aceite_termos: false,
        },
      ],
      rowCount: 1,
    } as never);
    mockGerarConvite.mockResolvedValueOnce({
      token: 'b'.repeat(64),
      link: 'http://localhost/vendedor/criar-senha?token=' + 'b'.repeat(64),
      expira_em: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await POST(makeRequest('75'), makeParams('75'));

    expect(mockGerarConvite).toHaveBeenCalledWith(75, expect.any(Object));
  });

  it('retorna 401 quando sessão não autorizada', async () => {
    mockRequireRep.mockImplementationOnce(() => {
      throw new Error('Não autenticado');
    });

    const res = await POST(makeRequest('75'), makeParams('75'));
    expect(res.status).toBe(401);
  });
});
