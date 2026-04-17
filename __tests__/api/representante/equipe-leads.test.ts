/**
 * @file __tests__/api/representante/equipe-leads.test.ts
 *
 * Testes do GET /api/representante/equipe/leads
 *
 * Cobre:
 *   - Retorna todos os status (incluindo 'convertido' e 'expirado') sem filtro
 *   - Filtra por status quando o parâmetro ?status= é passado
 *   - Filtra pelo mês atual quando ?mes=true
 *   - Agrupa leads por vendedor corretamente em por_vendedor
 *   - Retorna leads diretos (sem vendedor) em diretos
 *   - 401 quando não autenticado
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/representante/equipe/leads/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session-representante', () => ({
  requireRepresentante: jest.fn(),
  repAuthErrorResponse: jest.fn((e: Error) => ({
    status: e.message === 'Não autenticado' ? 401 : 500,
    body: { error: e.message },
  })),
}));

let mockQuery: jest.MockedFunction<(...args: unknown[]) => unknown>;
let mockRequireRepresentante: jest.MockedFunction<() => unknown>;

beforeAll(async () => {
  const db = await import('@/lib/db');
  const sessRep = await import('@/lib/session-representante');
  mockQuery = db.query as jest.MockedFunction<typeof db.query>;
  mockRequireRepresentante = (sessRep as any)
    .requireRepresentante as jest.MockedFunction<() => unknown>;
});

const repSession = {
  representante_id: 115,
  cpf: '99988877766',
  nome: 'Rep 115',
};

const makeLeadRow = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  cnpj: '12345678000195',
  razao_social: 'Empresa X',
  contato_nome: 'João',
  status: 'pendente',
  origem: null,
  criado_em: '2026-04-01T00:00:00Z',
  data_expiracao: null,
  valor_negociado: null,
  percentual_comissao_representante: null,
  num_vidas_estimado: null,
  requer_aprovacao_comercial: false,
  tipo_cliente: null,
  vendedor_id: 10,
  vendedor_nome: 'Vendedor 10',
  ...overrides,
});

const makeRequest = (search = '') =>
  new NextRequest(`http://localhost/api/representante/equipe/leads${search}`);

describe('GET /api/representante/equipe/leads', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Autenticação ──────────────────────────────────────────────────────────

  it('retorna 401 quando não autenticado', async () => {
    mockRequireRepresentante.mockImplementation(() => {
      throw new Error('Não autenticado');
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  // ── Sem filtro: todos os status incluindo convertido/expirado ─────────────

  it('sem filtro: inclui leads com status convertido na resposta', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leadConvertido = makeLeadRow({ status: 'convertido' });
    mockQuery
      // equipe leads query
      .mockResolvedValueOnce({ rows: [leadConvertido], rowCount: 1 } as any)
      // diretos query
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.por_vendedor).toHaveLength(1);
    expect(data.por_vendedor[0].leads[0].status).toBe('convertido');
    expect(data.total).toBe(1);
  });

  it('sem filtro: inclui leads com status expirado na resposta', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leadExpirado = makeLeadRow({ status: 'expirado' });
    mockQuery
      .mockResolvedValueOnce({ rows: [leadExpirado], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.por_vendedor[0].leads[0].status).toBe('expirado');
  });

  it('sem filtro: SQL da query de equipe NÃO contém NOT IN', async () => {
    // Garante que a exclusão automática foi removida
    mockRequireRepresentante.mockReturnValue(repSession);
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeRequest());

    const equipeSQL = (mockQuery.mock.calls[0] as unknown[])[0] as string;
    expect(equipeSQL).not.toMatch(/NOT IN/i);
    expect(equipeSQL).not.toMatch(/expirado/i);
    expect(equipeSQL).not.toMatch(/convertido/i);
  });

  // ── Com filtro de status ──────────────────────────────────────────────────

  it('com ?status=convertido: filtra apenas leads convertidos', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leadConvertido = makeLeadRow({ status: 'convertido' });
    mockQuery
      .mockResolvedValueOnce({ rows: [leadConvertido], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest('?status=convertido'));
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    // SQL deve conter lr.status = $2
    const equipeSQL = (mockQuery.mock.calls[0] as unknown[])[0] as string;
    expect(equipeSQL).toMatch(/lr\.status = /i);

    const equipeParams = (mockQuery.mock.calls[0] as unknown[])[1] as unknown[];
    expect(equipeParams).toContain('convertido');
    expect(data.por_vendedor[0].leads[0].status).toBe('convertido');
  });

  // ── Agrupamento por vendedor ──────────────────────────────────────────────

  it('agrupa múltiplos leads do mesmo vendedor em por_vendedor', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leads = [
      makeLeadRow({ id: 1, vendedor_id: 10, vendedor_nome: 'Vend 10' }),
      makeLeadRow({
        id: 2,
        vendedor_id: 10,
        vendedor_nome: 'Vend 10',
        status: 'convertido',
      }),
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: leads, rowCount: 2 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(data.por_vendedor).toHaveLength(1);
    expect(data.por_vendedor[0].vendedor_id).toBe(10);
    expect(data.por_vendedor[0].leads).toHaveLength(2);
    expect(data.total).toBe(2);
  });

  it('retorna leads de vendedores diferentes como grupos separados', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leads = [
      makeLeadRow({ id: 1, vendedor_id: 10, vendedor_nome: 'Vend 10' }),
      makeLeadRow({ id: 2, vendedor_id: 20, vendedor_nome: 'Vend 20' }),
    ];
    mockQuery
      .mockResolvedValueOnce({ rows: leads, rowCount: 2 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(data.por_vendedor).toHaveLength(2);
    const vids = data.por_vendedor.map(
      (v: { vendedor_id: number }) => v.vendedor_id
    );
    expect(vids).toContain(10);
    expect(vids).toContain(20);
  });

  // ── Leads diretos ─────────────────────────────────────────────────────────

  it('retorna leads diretos (sem vendedor) no campo diretos', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    const leadDireto = makeLeadRow({ vendedor_id: null, vendedor_nome: null });
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // equipe (sem leads de vendedor)
      .mockResolvedValueOnce({ rows: [leadDireto], rowCount: 1 } as any); // diretos

    // Act
    const res = await GET(makeRequest());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.diretos).toHaveLength(1);
    expect(data.por_vendedor).toHaveLength(0);
    expect(data.total).toBe(1);
  });

  // ── Filtro de mês ─────────────────────────────────────────────────────────

  it('com ?mes=true: SQL inclui filtro de date_trunc', async () => {
    // Arrange
    mockRequireRepresentante.mockReturnValue(repSession);
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    await GET(makeRequest('?mes=true'));

    // Assert
    const equipeSQL = (mockQuery.mock.calls[0] as unknown[])[0] as string;
    expect(equipeSQL).toMatch(/date_trunc/i);
  });
});
