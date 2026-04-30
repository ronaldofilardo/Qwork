/**
 * @fileoverview Testes da API GET /api/representante/minhas-vendas/comissoes
 * @description Lista TODAS as comissões do representante (diretas e via vendedor).
 * O filtro EXISTS foi removido: rep vê todas as comissões atribuídas a ele.
 * valor_pendente inclui retida + congelada_aguardando_admin.
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

import { GET } from '@/app/api/representante/minhas-vendas/comissoes/route';
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
  nome: 'Rep Direto',
  email: 'rd@t.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

function makeReq(params = '') {
  return new NextRequest(
    `http://localhost/api/representante/minhas-vendas/comissoes${params}`
  );
}

const emptyResumo = {
  pendentes: '0',
  liberadas: '0',
  pagas: '0',
  valor_pendente: '0',
  valor_liberado: '0',
  valor_pago_total: '0',
};

describe('GET /api/representante/minhas-vendas/comissoes', () => {
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

  it('deve retornar comissões com laudo_id, lote_pagamento_id, parcelas e valor_parcela', async () => {
    const resumo = {
      pendentes: '0',
      liberadas: '0',
      pagas: '2',
      valor_pendente: '0',
      valor_liberado: '0',
      valor_pago_total: '200.00',
    };
    const comissoes = [
      {
        id: 5,
        laudo_id: 50,
        lote_pagamento_id: 5,
        parcela_numero: 1,
        total_parcelas: 2,
        valor_laudo: '200.00',
        valor_parcela: '100.00',
        status: 'paga',
        valor_comissao: '100.00',
      },
      {
        id: 6,
        laudo_id: 50,
        lote_pagamento_id: 5,
        parcela_numero: 2,
        total_parcelas: 2,
        valor_laudo: '200.00',
        valor_parcela: '100.00',
        status: 'paga',
        valor_comissao: '100.00',
      },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: comissoes, rowCount: 2 } as any);

    const res = await GET(makeReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.comissoes).toHaveLength(2);

    // Verificar laudo_id
    expect(data.comissoes[0].laudo_id).toBe(50);
    expect(data.comissoes[1].laudo_id).toBe(50);

    // Verificar lote_pagamento_id
    expect(data.comissoes[0].lote_pagamento_id).toBe(5);
    expect(data.comissoes[1].lote_pagamento_id).toBe(5);

    // Verificar parcelas
    expect(data.comissoes[0].parcela_numero).toBe(1);
    expect(data.comissoes[0].total_parcelas).toBe(2);
    expect(data.comissoes[1].parcela_numero).toBe(2);
    expect(data.comissoes[1].total_parcelas).toBe(2);

    // Verificar valor_parcela (valor_laudo / total_parcelas)
    expect(data.comissoes[0].valor_parcela).toBe('100.00');
    expect(data.comissoes[1].valor_parcela).toBe('100.00');
  });

  it('deve retornar resumo e lista vazia', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.comissoes).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(data.resumo.valor_pendente).toBe('0');
  });

  it('deve retornar comissões com resumo completo', async () => {
    const resumo = {
      pendentes: '1',
      liberadas: '1',
      pagas: '3',
      valor_pendente: '150.00',
      valor_liberado: '100.00',
      valor_pago_total: '300.00',
    };
    const comissao = {
      id: 5,
      status: 'paga',
      valor_comissao: '100.00',
      entidade_nome: 'Empresa Direta',
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '5' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [comissao], rowCount: 1 } as any);

    const res = await GET(makeReq());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.resumo.valor_pendente).toBe('150.00');
    expect(data.resumo.valor_liberado).toBe('100.00');
    expect(data.resumo.valor_pago_total).toBe('300.00');
    expect(data.comissoes).toHaveLength(1);
    expect(data.total).toBe(5);
  });

  it('SQL de resumo deve incluir congelada_aguardando_admin em valor_pendente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq());

    const resumoSQL = mockQuery.mock.calls[0][0] as string;
    expect(resumoSQL).toContain("'retida'");
    expect(resumoSQL).toContain("'congelada_aguardando_admin'");
    expect(resumoSQL).toContain('valor_pendente');
  });

  it('SQL de resumo deve filtrar apenas por representante_id (sem EXISTS, todas as comissões visíveis)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeReq());

    const resumoSQL = mockQuery.mock.calls[0][0] as string;
    // Filtro: apenas representante_id — sem EXISTS que excluía leads via vendedor
    expect(resumoSQL).toContain('c.representante_id = $1');
    // Não deve mais ter o EXISTS que escondia comissões de leads originados por vendedores
    expect(resumoSQL).not.toContain('lr.vendedor_id IS NULL');
    // Totais ainda corretos
    expect(resumoSQL).toContain("'retida'");
    expect(resumoSQL).toContain("'congelada_aguardando_admin'");
    expect(resumoSQL).toContain('valor_pendente');
  });

  it('deve filtrar por status quando informado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?status=liberada'));
    expect(res.status).toBe(200);

    const countParams = mockQuery.mock.calls[1][1];
    expect(countParams).toContain('liberada');
  });

  it('deve paginar resultados (limit=30)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '100' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeReq('?page=3'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.page).toBe(3);
    expect(data.limit).toBe(30);
    expect(data.total).toBe(100);
  });

  it('deve retornar 500 em erro inesperado', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    const res = await GET(makeReq());
    expect(res.status).toBe(500);
  });
});
