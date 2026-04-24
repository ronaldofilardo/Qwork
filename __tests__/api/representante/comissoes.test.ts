/**
 * @fileoverview Testes da API GET /api/representante/comissoes
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { GET } from '@/app/api/representante/comissoes/route';
import { query } from '@/lib/db';
import {
  requireRepresentante,
  repAuthErrorResponse,
} from '@/lib/session-representante';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequire = requireRepresentante as jest.MockedFunction<
  typeof requireRepresentante
>;
const mockErrResp = repAuthErrorResponse as jest.MockedFunction<
  typeof repAuthErrorResponse
>;

const sess = {
  representante_id: 1,
  nome: 'Rep',
  email: 'r@t.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

function makeReq(params = '') {
  return new NextRequest(
    `http://localhost/api/representante/comissoes${params}`
  );
}

describe('GET /api/representante/comissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(sess);
    mockErrResp.mockReturnValue({ status: 500, body: { error: 'Erro.' } });
  });

  it('deve retornar 401 sem sessão', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado.' },
    });

    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('deve retornar resumo e lista de comissões', async () => {
    const resumo = {
      pendentes: '2',
      liberadas: '1',
      pagas: '5',
      valor_pendente: '200.00',
      valor_liberado: '100.00',
      valor_pago_total: '5000.00',
    };
    const comissao = {
      id: 1,
      status: 'paga',
      valor_comissao: '1000.00',
      entidade_nome: 'Empresa Z',
      numero_laudo: 'L-001',
    };

    // resumo
    mockQuery.mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any);
    // count
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '8' }],
      rowCount: 1,
    } as any);
    // list
    mockQuery.mockResolvedValueOnce({ rows: [comissao], rowCount: 1 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.resumo.pagas).toBe('5');
    expect(data.resumo.valor_pago_total).toBe('5000.00');
    expect(data.comissoes).toHaveLength(1);
    expect(data.total).toBe(8);
  });

  it('deve filtrar por status', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            pendentes: '0',
            liberadas: '0',
            pagas: '0',
            valor_pendente: '0',
            valor_liberado: '0',
            valor_pago_total: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?status=liberada'));
    expect(res.status).toBe(200);
    // Verifica que o parâmetro de status foi incluído na query
    const countParams = mockQuery.mock.calls[1][1];
    expect(countParams).toContain('liberada');
  });

  it('deve filtrar por mês', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            pendentes: '0',
            liberadas: '0',
            pagas: '0',
            valor_pendente: '0',
            valor_liberado: '0',
            valor_pago_total: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?mes=2026-01'));
    expect(res.status).toBe(200);
    const countParams = mockQuery.mock.calls[1][1];
    expect(countParams).toContain('2026-01-01');
  });

  it('deve usar e.nome (não razao_social) na query JOIN com entidades', async () => {
    const comissao = {
      id: 1,
      status: 'paga',
      valor_comissao: '500.00',
      entidade_nome: 'Empresa Correta',
      numero_laudo: 'L-002',
    };
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            pendentes: '0',
            liberadas: '0',
            pagas: '1',
            valor_pendente: '0',
            valor_liberado: '0',
            valor_pago_total: '500.00',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [comissao], rowCount: 1 } as any);

    await GET(makeReq());

    // A query de lista (3ª chamada) deve usar COALESCE(e.nome, cl.nome) ou e.nome, nunca e.razao_social
    const listSQL = mockQuery.mock.calls[2][0] as string;
    expect(listSQL).toMatch(
      /COALESCE\(e\.nome.*\)\s+AS\s+entidade_nome|e\.nome\s+AS\s+entidade_nome/i
    );
    expect(listSQL).not.toMatch(/e\.razao_social/i);
  });

  it('SQL de resumo deve incluir congelada_aguardando_admin em valor_pendente', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            pendentes: '0',
            liberadas: '0',
            pagas: '0',
            valor_pendente: '0',
            valor_liberado: '0',
            valor_pago_total: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq());

    const resumoSQL = mockQuery.mock.calls[0][0] as string;
    // valor_pendente deve incluir retida E congelada_aguardando_admin
    expect(resumoSQL).toContain("'retida'");
    expect(resumoSQL).toContain("'congelada_aguardando_admin'");
    expect(resumoSQL).toContain('valor_pendente');
    // congelada_rep_suspenso NÃO deve estar no agrupamento de valor_pendente
    // (é filtrado pela lógica de negócio — rep suspenso não recebe)
  });

  it('deve paginar resultados (limit=30)', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            pendentes: '0',
            liberadas: '0',
            pagas: '0',
            valor_pendente: '0',
            valor_liberado: '0',
            valor_pago_total: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?page=2'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(2);
    expect(data.limit).toBe(30);
  });
});
