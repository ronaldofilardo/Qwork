/**
 * Testes para GET /api/suporte/representantes
 *
 * Cobre as alterações desta sessão (05/05/2026):
 * - Busca por ID numérico (ex: ?busca=2)
 * - Busca por código (ex: ?busca=ABC)
 * - Busca por nome (ex: ?busca=Carlos)
 * - Busca por email (ex: ?busca=test@)
 * - Filtro por status (ex: ?status=ativo)
 * - Filtro por grupo (ex: ?grupo=ativos ou ?grupo=inativos)
 * - Autorização: suporte, comercial, admin
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/suporte/representantes/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(searchParams: Record<string, string> = {}): NextRequest {
  const url = new URL('http://localhost/api/suporte/representantes');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return new NextRequest(url);
}

const baseSession = {
  cpf: '11111111111',
  nome: 'Suporte Dev',
  perfil: 'suporte',
} as any;

const mockRepresentante = {
  id: 2,
  nome: 'Carlos Teste PF',
  email: 'carlos@test.com',
  telefone: '11987654321',
  status: 'ativo',
  tipo_pessoa: 'pf',
  cpf: '12345678901',
  cpf_responsavel_pj: null,
  cnpj: null,
  percentual_comissao: 10.0,
  modelo_comissionamento: 'percentual',
  valor_custo_fixo_entidade: null,
  valor_custo_fixo_clinica: null,
  asaas_wallet_id: null,
  criado_em: '2025-01-01T10:00:00Z',
  total_vendedores: 3,
};

const mockRepresentante2 = {
  ...mockRepresentante,
  id: 5,
  nome: 'Empresa Teste PJ',
  email: 'empresa@test.com',
  status: 'desativado',
  tipo_pessoa: 'pj',
  cpf: null,
  cpf_responsavel_pj: '98765432101',
  cnpj: '12345678000190',
};

describe('GET /api/suporte/representantes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(baseSession);
  });

  // ---------------------------------------------------------------------------
  // Segurança e validação de autorização
  // ---------------------------------------------------------------------------
  it('retorna 403 quando sem permissão (não suporte/comercial/admin)', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('permite acesso com perfil suporte', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('permite acesso com perfil comercial', async () => {
    mockRequireRole.mockResolvedValueOnce({ ...baseSession, perfil: 'comercial' });
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  it('permite acesso com perfil admin', async () => {
    mockRequireRole.mockResolvedValueOnce({ ...baseSession, perfil: 'admin' });
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Busca sem filtros (lista todos ativos)
  // ---------------------------------------------------------------------------
  it('retorna todos os representantes quando sem filtros', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          representante_id: 2,
          vendedor_id: 10,
          nome: 'Vendedor 1',
          email: 'vendor1@test.com',
          cpf: '11111111111',
          vinculo_id: 101,
          vinculado_em: '2025-01-01T10:00:00Z',
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveProperty('representantes');
    expect(data).toHaveProperty('total');
    expect(Array.isArray(data.representantes)).toBe(true);
    expect(data.representantes.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Busca por ID numérico (novo)
  // ---------------------------------------------------------------------------
  it('busca representante por ID (ex: busca=2)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          representante_id: 2,
          vendedor_id: 10,
          nome: 'Vendedor 1',
          email: null,
          cpf: '11111111111',
          vinculo_id: 101,
          vinculado_em: '2025-01-01T10:00:00Z',
        },
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest({ busca: '2' }));
    expect(res.status).toBe(200);

    // Verificar que a query foi chamada com a condição correta
    expect(mockQuery).toHaveBeenCalled();
    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    
    // Deve conter busca por ID exata (r.id = $N)
    expect(sqlQuery).toContain('r.id');
  });

  it('busca representante por nome (ex: busca=Carlos)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ busca: 'Carlos' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter busca por nome
    expect(sqlQuery).toContain('r.nome');
  });

  it('busca representante por código (ex: busca=ABC123)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ busca: 'ABC123' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter busca por código
    expect(sqlQuery).toContain('r.codigo');
  });

  it('busca representante por email (ex: busca=test@)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ busca: 'test@' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter busca por email
    expect(sqlQuery).toContain('r.email');
  });

  // ---------------------------------------------------------------------------
  // Filtro por status
  // ---------------------------------------------------------------------------
  it('filtra representantes por status ativo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ status: 'ativo' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    expect(sqlQuery).toContain("r.status = $");
  });

  it('filtra representantes por status desativado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante2], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ status: 'desativado' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const params = callArgs[1] as unknown[];
    expect(params).toContain('desativado');
  });

  it('ignora status inválido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ status: 'invalid_status' }));
    expect(res.status).toBe(200);

    // Query não deve conter o filtro de status inválido
    const callArgs = mockQuery.mock.calls[0];
    const params = callArgs[1] as unknown[];
    expect(params).not.toContain('invalid_status');
  });

  // ---------------------------------------------------------------------------
  // Filtro por grupo (ativos/inativos)
  // ---------------------------------------------------------------------------
  it('filtra representantes ativos quando grupo=ativos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ grupo: 'ativos' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter "NOT IN ('desativado', 'rejeitado')"
    expect(sqlQuery).toContain("r.status NOT IN");
  });

  it('filtra representantes inativos quando grupo=inativos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante2], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ grupo: 'inativos' }));
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter "IN ('desativado', 'rejeitado')"
    expect(sqlQuery).toContain("r.status IN");
  });

  // ---------------------------------------------------------------------------
  // Combinações de filtros
  // ---------------------------------------------------------------------------
  it('combina busca + status + grupo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(
      makeRequest({
        busca: 'Carlos',
        status: 'ativo',
        grupo: 'ativos',
      })
    );
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter todos os filtros
    expect(sqlQuery).toContain('r.nome');
    expect(sqlQuery).toContain('r.status = $');
    expect(sqlQuery).toContain('r.status NOT IN');
  });

  it('combina busca por ID + filtro de status', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(
      makeRequest({
        busca: '2',
        status: 'ativo',
      })
    );
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter busca por ID
    expect(sqlQuery).toContain('r.id');
    // Deve conter filtro de status
    expect(sqlQuery).toContain("r.status = $");
  });

  // ---------------------------------------------------------------------------
  // Estrutura da resposta
  // ---------------------------------------------------------------------------
  it('retorna representante com vendedores vinculados', async () => {
    const mockVendedores = [
      {
        representante_id: 2,
        vendedor_id: 10,
        nome: 'Vendedor 1',
        email: 'vendor1@test.com',
        cpf: '11111111111',
        vinculo_id: 101,
        vinculado_em: '2025-01-01T10:00:00Z',
      },
      {
        representante_id: 2,
        vendedor_id: 11,
        nome: 'Vendedor 2',
        email: 'vendor2@test.com',
        cpf: '22222222222',
        vinculo_id: 102,
        vinculado_em: '2025-01-02T10:00:00Z',
      },
    ];

    mockQuery.mockResolvedValueOnce({ rows: [mockRepresentante], rowCount: 1 });
    mockQuery.mockResolvedValueOnce({ rows: mockVendedores, rowCount: 2 });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.representantes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 2,
          nome: 'Carlos Teste PF',
          email: 'carlos@test.com',
          vendedores: expect.any(Array),
        }),
      ])
    );
  });

  it('retorna lista vazia quando nenhum representante encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest({ busca: 'nao_existe' }));
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data.representantes)).toBe(true);
    expect(data.representantes.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Ordenação
  // ---------------------------------------------------------------------------
  it('ordena representantes por nome ascendente', async () => {
    const reps = [mockRepresentante, mockRepresentante2].sort((a, b) =>
      a.nome.localeCompare(b.nome)
    );
    mockQuery.mockResolvedValueOnce({ rows: reps, rowCount: 2 });
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const callArgs = mockQuery.mock.calls[0];
    const sqlQuery = callArgs[0] as string;
    // Deve conter ORDER BY
    expect(sqlQuery).toContain('ORDER BY');
    expect(sqlQuery).toContain('r.nome');
  });
});
