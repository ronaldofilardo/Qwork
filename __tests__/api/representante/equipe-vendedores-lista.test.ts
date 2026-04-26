/**
 * @file __tests__/api/representante/equipe-vendedores-lista.test.ts
 *
 * Testes para GET /api/representante/equipe/vendedores — lista de vendedores da equipe.
 * Verifica que a resposta inclui aceite_termos e vendedor_perfil_id por vendedor,
 * campos necessários para exibição condicional do botão "Reenviar Convite".
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session-representante', () => ({
  requireRepresentante: jest.fn(),
  repAuthErrorResponse: jest.fn((e: Error) => ({
    body: { error: e.message },
    status: 401,
  })),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRep = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;

const REP_SESSION = {
  cpf: '11111111111',
  nome: 'Rep Teste',
  representante_id: 5,
};

function makeRequest(params = ''): NextRequest {
  return new NextRequest(
    `http://localhost/api/representante/equipe/vendedores${params}`
  );
}

describe('GET /api/representante/equipe/vendedores — lista com aceite_termos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRep.mockReturnValue(REP_SESSION as any);
  });

  function setupListaMocks(vendedores: object[] = []) {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total: String(vendedores.length) }],
        rowCount: 1,
      } as any) // COUNT
      .mockResolvedValueOnce({
        rows: vendedores,
        rowCount: vendedores.length,
      } as any); // SELECT
  }

  it('retorna lista de vendedores com aceite_termos e vendedor_perfil_id', async () => {
    const vendedorPendente = {
      vinculo_id: 1,
      ativo: true,
      percentual_override: null,
      vinculado_em: new Date().toISOString(),
      data_fim: null,
      vendedor_id: 10,
      vendedor_nome: 'João Vendedor',
      vendedor_email: 'joao@test.com',
      vendedor_cpf: '22233344455',
      vendedor_perfil_id: 99,
      aceite_termos: false,
      leads_ativos: '3',
    };

    setupListaMocks([vendedorPendente]);

    const { GET } =
      await import('@/app/api/representante/equipe/vendedores/route');
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data).toHaveProperty('vendedores');
    expect(data.vendedores).toHaveLength(1);

    const v = data.vendedores[0];
    expect(v).toHaveProperty('aceite_termos', false);
    expect(v).toHaveProperty('vendedor_perfil_id', 99);
  });

  it('vendedor com aceite_termos=true tem campo presente na resposta', async () => {
    const vendedorAceito = {
      vinculo_id: 2,
      ativo: true,
      percentual_override: null,
      vinculado_em: new Date().toISOString(),
      data_fim: null,
      vendedor_id: 20,
      vendedor_nome: 'Maria Vendedora',
      vendedor_email: 'maria@test.com',
      vendedor_cpf: '55566677788',
      vendedor_perfil_id: 101,
      aceite_termos: true,
      leads_ativos: '0',
    };

    setupListaMocks([vendedorAceito]);

    const { GET } =
      await import('@/app/api/representante/equipe/vendedores/route');
    const res = await GET(makeRequest());
    const data = await res.json();

    const v = data.vendedores[0];
    expect(v).toHaveProperty('aceite_termos', true);
    expect(v).toHaveProperty('vendedor_perfil_id', 101);
  });

  it('retorna total e paginação', async () => {
    setupListaMocks([]);

    const { GET } =
      await import('@/app/api/representante/equipe/vendedores/route');
    const res = await GET(makeRequest('?page=1'));
    const data = await res.json();

    expect(data).toHaveProperty('total', 0);
    expect(data).toHaveProperty('page', 1);
    expect(data).toHaveProperty('limit', 20);
  });

  it('retorna 401 quando não autenticado', async () => {
    mockRequireRep.mockImplementation(() => {
      throw new Error('Não autenticado');
    });

    const { GET } =
      await import('@/app/api/representante/equipe/vendedores/route');
    const res = await GET(makeRequest());

    expect(repAuthErrorResponse).toHaveBeenCalled();
  });

  it('inclui vendedor_perfil_id nulo quando vendedor não tem perfil cadastrado', async () => {
    const vendedorSemPerfil = {
      vinculo_id: 3,
      ativo: true,
      percentual_override: null,
      vinculado_em: new Date().toISOString(),
      data_fim: null,
      vendedor_id: 30,
      vendedor_nome: 'Carlos Sem Perfil',
      vendedor_email: 'carlos@test.com',
      vendedor_cpf: '99988877766',
      vendedor_perfil_id: null,
      aceite_termos: null,
      leads_ativos: '0',
    };

    setupListaMocks([vendedorSemPerfil]);

    const { GET } =
      await import('@/app/api/representante/equipe/vendedores/route');
    const res = await GET(makeRequest());
    const data = await res.json();

    const v = data.vendedores[0];
    expect(v.vendedor_perfil_id).toBeNull();
    expect(v.aceite_termos).toBeNull();
  });
});
