/**
 * @fileoverview Testes da API GET /api/admin/entidades
 * Cobre: ordenação por criado_em DESC, campos de documento, campo tem_documentos
 */

import { GET } from '@/app/api/admin/entidades/route';
import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

let mockQuery: jest.MockedFunction<(...args: unknown[]) => unknown>;
let mockRequireRole: jest.MockedFunction<(...args: unknown[]) => unknown>;

beforeAll(async () => {
  const db = await import('@/lib/db');
  const session = await import('@/lib/session');
  mockQuery = db.query as jest.MockedFunction<typeof db.query>;
  mockRequireRole = (session as any).requireRole as jest.MockedFunction<
    typeof session.requireRole
  >;
});

const adminSession = {
  cpf: '12345678901',
  nome: 'Admin',
  perfil: 'admin' as const,
};

const makeRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  tipo: 'clinica',
  nome: 'Clínica Teste',
  cnpj: '12345678000190',
  endereco: 'Rua A, 1',
  cidade: 'Curitiba',
  estado: 'PR',
  telefone: '(41) 9999-9999',
  email: 'clinica@teste.com',
  ativa: true,
  criado_em: '2026-03-01T10:00:00.000Z',
  responsavel_nome: 'Dr. João',
  responsavel_cpf: '98765432100',
  responsavel_email: 'joao@clinica.com',
  cartao_cnpj_path: '/uploads/cadastros/12345678000190/cartao_cnpj_1234.pdf',
  contrato_social_path: null,
  doc_identificacao_path: null,
  ...overrides,
});

const makeRequest = (params = '') =>
  new NextRequest(`http://localhost/api/admin/entidades${params}`);

describe('GET /api/admin/entidades', () => {
  beforeEach(() => jest.clearAllMocks());

  it('retorna lista com campo tem_documentos derivado dos paths', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [makeRow()],
      rowCount: 1,
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.entidades).toHaveLength(1);

    const t = data.entidades[0];
    expect(t.tem_documentos).toEqual({
      cartao_cnpj: true,
      contrato_social: false,
      doc_identificacao: false,
    });
  });

  it('inclui created_at e ativo no payload de retorno', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [makeRow()],
      rowCount: 1,
    });

    const res = await GET(makeRequest());
    const data = await res.json();
    const t = data.entidades[0];

    expect(t.created_at).toBeDefined();
    expect(typeof t.ativo).toBe('boolean');
    expect(t.gestor).not.toBeNull();
  });

  it('gestor é null quando responsavel_cpf está ausente', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [
        makeRow({
          responsavel_cpf: null,
          responsavel_nome: null,
          responsavel_email: null,
        }),
      ],
      rowCount: 1,
    });

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(data.entidades[0].gestor).toBeNull();
  });

  it('retorna 403 se não for admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('SQL inclui ORDER BY criado_em DESC', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    await GET(makeRequest());

    const sql: string = (mockQuery.mock.calls[0][0] as string).replace(
      /\s+/g,
      ' '
    );
    expect(sql.toLowerCase()).toContain('order by criado_em desc');
  });

  it('SQL inclui colunas de documento quando filtro é clinica', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

    await GET(makeRequest('?tipo=clinica'));

    const sql: string = (mockQuery.mock.calls[0][0] as string).replace(
      /\s+/g,
      ' '
    );
    expect(sql).toContain('cartao_cnpj_path');
    expect(sql).toContain('contrato_social_path');
    expect(sql).toContain('doc_identificacao_path');
  });

  it('retorna total quando filtro por tipo é passado', async () => {
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValue({
      rows: [makeRow({ tipo: 'entidade' })],
      rowCount: 1,
    });

    const res = await GET(makeRequest('?tipo=entidade'));
    const data = await res.json();

    expect(data.total).toBe(1);
  });
});
