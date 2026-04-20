/**
 * @fileoverview Testes da API GET /api/admin/comissoes
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { GET } from '@/app/api/admin/comissoes/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeReq(params = '') {
  return new NextRequest(`http://localhost/api/admin/comissoes${params}`);
}

describe('GET /api/admin/comissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000000',
      role: 'admin',
    } as any);
  });

  it('deve retornar 401 para não autenticado', async () => {
    mockRequireRole.mockRejectedValue(new Error('Não autenticado'));
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 para não admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET(makeReq());
    expect(res.status).toBe(403);
  });

  it('deve retornar resumo e lista de comissões', async () => {
    const resumo = {
      total_comissoes: '50',
      aprovadas: '10',
      liberadas: '5',
      pagas: '30',
      congeladas: '2',
      valor_a_pagar: '1500.00',
      valor_pago_total: '30000.00',
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any) // resumo
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 } as any) // count
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'paga' }],
        rowCount: 1,
      } as any); // list

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resumo.total_comissoes).toBe('50');
    expect(data.resumo.valor_pago_total).toBe('30000.00');
    expect(data.comissoes).toHaveLength(1);
  });

  it('deve filtrar por status', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq('?status=liberada'));
    expect(mockQuery.mock.calls[1][1]).toContain('liberada');
  });

  it('deve filtrar por mês', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq('?mes=2026-03'));
    expect(mockQuery.mock.calls[1][1]).toContain('2026-03-01');
  });

  it('deve aplicar os filtros também no resumo', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq('?mes=2026-03&status=retida'));

    expect(String(mockQuery.mock.calls[0][0])).toContain(
      'WHERE c.status::text = $1 AND c.mes_emissao = $2::date'
    );
    expect(mockQuery.mock.calls[0][1]).toEqual(['retida', '2026-03-01']);
  });

  it('deve filtrar por rep_id', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq('?rep_id=5'));
    expect(mockQuery.mock.calls[1][1]).toContain(5);
  });

  it('deve paginar (limit=30)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?page=3'));
    const data = await res.json();
    expect(data.page).toBe(3);
    expect(data.limit).toBe(30);
  });

  // ── Suporte a clínicas (migration 505) ───────────────────────────────────
  it('deve retornar comissão de clínica (sem entidade_id, com clinica_id)', async () => {
    const resumo = {
      total_comissoes: '1',
      aprovadas: '1',
      liberadas: '0',
      pagas: '0',
      congeladas: '0',
      valor_a_pagar: '13.50',
      valor_pago_total: '0',
    };
    const comissaoClinica = {
      id: 7,
      status: 'aprovada',
      entidade_id: null,
      clinica_id: 6,
      entidade_nome: 'RLJ COMERCIAL EXPORTADORA LTDA', // vem do COALESCE(e.razao_social, cl.nome)
      representante_nome: 'Rep Teste PJ',
      valor_comissao: '13.50',
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [comissaoClinica], rowCount: 1 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].clinica_id).toBe(6);
    expect(data.comissoes[0].entidade_id).toBeNull();
    expect(data.comissoes[0].entidade_nome).toBe(
      'RLJ COMERCIAL EXPORTADORA LTDA'
    );
  });

  it('deve ignorar status inválido (não filtrar)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '5' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '5' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq('?status=invalido'));
    // WHERE não deve conter o valor inválido
    const whereParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(whereParams).not.toContain('invalido');
  });

  it('deve incluir JOIN vinculos_comissao e campos representante_percentual na query de listagem', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ total_comissoes: '0' }],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq());

    // Terceira chamada (index 2) = query principal de listagem
    const listSQL = String(mockQuery.mock.calls[2][0]);
    expect(listSQL).toContain('LEFT JOIN vinculos_comissao');
    expect(listSQL).toContain('representante_percentual');
    expect(listSQL).toContain('vinculo_percentual_comercial');
  });
});
