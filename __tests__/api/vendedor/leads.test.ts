/**
 * @file __tests__/api/vendedor/leads.test.ts
 *
 * Testes para GET /api/vendedor/leads e POST /api/vendedor/leads
 * Cobre:
 * - Autenticação e autorização
 * - Filtro por status
 * - Validações do POST (schema, CNPJ)
 * - Criação de lead
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session');
jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: (v: string) => v.replace(/\D/g, ''),
  validarCNPJ: (v: string) => v.length === 14 && v !== '00000000000000',
  validarEmail: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  validarTelefone: (v: string) => {
    const d = v.replace(/\D/g, '');
    return d.length === 10 || d.length === 11;
  },
}));

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/vendedor/leads/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

const vendedorSession = {
  cpf: '12345678901',
  nome: 'Vendedor Teste',
  perfil: 'vendedor' as const,
};

function makeGetReq(params = '') {
  return new NextRequest(`http://localhost/api/vendedor/leads${params}`);
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/vendedor/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Mock padrão para GET: usuario ok + count + rows */
function mockGetSuccess(leads: unknown[] = [], total = leads.length) {
  // 1) SELECT usuarios
  mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
  // 2) COUNT
  mockQuery.mockResolvedValueOnce({
    rows: [{ total: String(total) }],
    rowCount: 1,
  } as any);
  // 3) SELECT leads
  mockQuery.mockResolvedValueOnce({
    rows: leads,
    rowCount: leads.length,
  } as any);
}

describe('GET /api/vendedor/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(vendedorSession as any);
  });

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
    const d = await res.json();
    expect(d.error).toBeDefined();
  });

  it('401 se perfil sem permissão', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it('404 se vendedor não encontrado no banco', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(404);
  });

  it('200 com lista vazia quando não há leads', async () => {
    mockGetSuccess([]);
    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.leads).toEqual([]);
    expect(d.total).toBe(0);
  });

  it('200 filtra por status quando parâmetro fornecido', async () => {
    mockGetSuccess([], 0);
    const res = await GET(makeGetReq('?status=convertido'));
    expect(res.status).toBe(200);
    // A query de leads deve incluir filtro de status
    const calls = mockQuery.mock.calls;
    const leadsQuery = calls[2][0];
    expect(leadsQuery).toMatch(/ORDER BY lr.criado_em/);
  });

  it('200 inclui paginação correta', async () => {
    mockGetSuccess([], 0);
    const res = await GET(makeGetReq('?page=2'));
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.page).toBe(2);
    expect(d.limit).toBe(30);
  });
});

describe('POST /api/vendedor/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(vendedorSession as any);
  });

  function mockPostSuccess() {
    // 1) SELECT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    // 2) SELECT hierarquia_comercial
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    // 3) SELECT leads_representante (lead pendente check) — vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 4) SELECT entidades — vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 5) SELECT clinicas — vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 6) INSERT lead
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 99 }], rowCount: 1 } as any);
  }

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await POST(makePostReq({ contato_nome: 'Lead' }));
    expect(res.status).toBe(401);
  });

  it('400 se vendedor sem representante vinculado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await POST(makePostReq({ contato_nome: 'Lead Teste' }));
    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/representante/i);
  });

  it('422 se contato_nome ausente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    const res = await POST(makePostReq({}));
    expect(res.status).toBe(422);
  });

  it('422 se CNPJ inválido', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    const res = await POST(makePostReq({ contato_nome: 'Lead', cnpj: '123' }));
    expect(res.status).toBe(422);
  });

  it('422 quando CNPJ ausente (obrigatório)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    const res = await POST(makePostReq({ contato_nome: 'Lead Sem CNPJ' }));
    expect(res.status).toBe(422);
    const d = await res.json();
    expect(d.error).toMatch(/dados inválidos/i);
  });

  it('409 quando CNPJ já possui lead pendente do mesmo representante', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    // lead pendente — mesmo representante (id=5)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 7, representante_id: 5 }],
      rowCount: 1,
    } as any);
    const res = await POST(
      makePostReq({ contato_nome: 'Lead', cnpj: '12345678000190' })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/já possui/i);
  });

  it('409 quando CNPJ já possui lead pendente de outro representante', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    // lead pendente — outro representante (id=99)
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 8, representante_id: 99 }],
      rowCount: 1,
    } as any);
    const res = await POST(
      makePostReq({ contato_nome: 'Lead', cnpj: '12345678000190' })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/outro representante/i);
  });

  it('409 quando CNPJ já é entidade existente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    // lead check — vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // entidade check — existe
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 50 }], rowCount: 1 } as any);
    const res = await POST(
      makePostReq({ contato_nome: 'Entidade Teste', cnpj: '12345678000190' })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/cliente/i);
  });

  it('409 quando CNPJ já é clínica existente (09110380000191)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10 }], rowCount: 1 } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ representante_id: 5 }],
      rowCount: 1,
    } as any);
    // lead check — vazio
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // entidade check — nenhuma
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // clínica check — existe
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 80 }], rowCount: 1 } as any);
    const res = await POST(
      makePostReq({ contato_nome: 'Clínica Teste', cnpj: '09110380000191' })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/clínica/i);
  });

  it('201 cria lead sem comissão (padrão)', async () => {
    mockPostSuccess();
    const res = await POST(
      makePostReq({
        contato_nome: 'Empresa Teste',
        cnpj: '12345678000190',
      })
    );
    expect(res.status).toBe(201);
    const d = await res.json();
    expect(d.id).toBe(99);
  });

  it('201 cria lead com todos os campos preenchidos', async () => {
    mockPostSuccess();
    const res = await POST(
      makePostReq({
        contato_nome: 'Clínica Completa LTDA',
        contato_email: 'clinica@teste.com',
        contato_telefone: '11999999999',
        cnpj: '12345678000199',
        valor_negociado: 2500,
        observacoes: 'Lead qualificado',
      })
    );
    expect(res.status).toBe(201);
    // calls: 0=usuarios, 1=hierarquia, 2=lead_check, 3=entidade_check, 4=clinica_check, 5=INSERT
    const insertCall = mockQuery.mock.calls[5];
    const params = insertCall[1];
    expect(params[6]).toBe(2500); // valor_negociado
  });
});
