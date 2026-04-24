/**
 * @fileoverview Testes da API GET/POST /api/representante/leads
 */
jest.mock('@/lib/db');
jest.mock('@/lib/session-representante');

// Mock dos validators para isolar os testes da lógica de validação de dígitos
jest.mock('@/lib/validators', () => ({
  normalizeCNPJ: (v: string) => v.replace(/\D/g, ''),
  validarCNPJ: (v: string) => v.length === 14 && v !== '00000000000000',
  validarEmail: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  validarTelefone: (v: string) => {
    const d = v.replace(/\D/g, '');
    return d.length === 10 || d.length === 11;
  },
}));

import { GET, POST } from '@/app/api/representante/leads/route';
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

const validSession = {
  representante_id: 1,
  nome: 'Rep Teste',
  email: 'rep@test.dev',
  codigo: 'AB12-CD34',
  status: 'apto',
  tipo_pessoa: 'pf' as const,
  criado_em_ms: Date.now(),
};

function makeGetReq(params = '') {
  return new NextRequest(`http://localhost/api/representante/leads${params}`);
}

function makePostReq(body: Record<string, unknown>) {
  return new NextRequest('http://localhost/api/representante/leads', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('GET /api/representante/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(validSession);
    mockErrResp.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno.' },
    });
  });

  it('deve retornar 401 sem sessão', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado.' },
    });

    const res = await GET(makeGetReq());
    expect(res.status).toBe(401);
  });

  it('deve retornar lista de leads paginada', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '3' }], rowCount: 1 } as any) // count
      .mockResolvedValueOnce({
        rows: [
          { status: 'pendente', count: 1 },
          { status: 'convertido', count: 2 },
        ],
        rowCount: 2,
      } as any) // stats
      .mockResolvedValueOnce({
        rows: [
          { id: 1, status: 'pendente' },
          {
            id: 2,
            status: 'convertido',
            data_conversao: '2026-03-01T10:00:00Z',
          },
          {
            id: 3,
            status: 'convertido',
            data_conversao: '2026-02-20T09:00:00Z',
          },
        ],
        rowCount: 3,
      } as any); // list

    const res = await GET(makeGetReq());
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.leads).toHaveLength(3);
    expect(data.total).toBe(3);
    expect(data.page).toBe(1);
    // leads convertidos devem ter data_conversao
    expect(data.leads[1].data_conversao).toBe('2026-03-01T10:00:00Z');
  });

  it('deve filtrar por status', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [{ status: 'pendente', count: 1 }],
        rowCount: 1,
      } as any) // stats
      .mockResolvedValueOnce({
        rows: [{ id: 1, status: 'pendente' }],
        rowCount: 1,
      } as any);

    const res = await GET(makeGetReq('?status=pendente'));
    expect(res.status).toBe(200);
    // O primeiro parâmetro (count) deve incluir 'pendente'
    expect(mockQuery.mock.calls[0][1]).toContain('pendente');
  });

  it('deve respeitar paginação', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any) // stats
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // list

    const res = await GET(makeGetReq('?page=3'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.page).toBe(3);
    // offset = (3-1)*20 = 40
    const listParams = mockQuery.mock.calls[2][1];
    expect(listParams).toContain(40); // offset
  });
});

describe('POST /api/representante/leads', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequire.mockReturnValue(validSession);
    mockErrResp.mockReturnValue({
      status: 500,
      body: { error: 'Erro interno.' },
    });
  });

  it('deve retornar 401 sem sessão', async () => {
    mockRequire.mockImplementation(() => {
      throw new Error('REP_NAO_AUTENTICADO');
    });
    mockErrResp.mockReturnValue({
      status: 401,
      body: { error: 'Não autenticado.' },
    });

    const res = await POST(makePostReq({ cnpj: '12345678000190' }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 400 para CNPJ inválido', async () => {
    const res = await POST(makePostReq({ cnpj: '123' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/cnpj/i);
  });

  it('deve retornar 400 para email inválido', async () => {
    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
        contato_email: 'nao-e-email',
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/e-mail/i);
  });

  it('deve retornar 400 para telefone inválido', async () => {
    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
        contato_telefone: '123',
      })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/telefone/i);
  });

  it('deve retornar 409 quando rep já possui lead pendente para o CNPJ', async () => {
    // mock rep percentuals query (before lead check)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '5',
          percentual_comissao_comercial: '3',
          modelo_comissionamento: 'percentual',
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, representante_id: 1, status: 'pendente' }],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
      })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/já possui/i);
  });

  it('deve retornar 409 quando outro rep já registrou lead para o CNPJ', async () => {
    // mock rep percentuals query (before lead check)
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '5',
          percentual_comissao_comercial: '3',
          modelo_comissionamento: 'percentual',
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 5, representante_id: 999, status: 'pendente' }],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
      })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/outro representante/i);
  });

  it('deve retornar 409 quando CNPJ já é entidade existente', async () => {
    // mock rep percentuals query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '5',
          percentual_comissao_comercial: '3',
          modelo_comissionamento: 'percentual',
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    // lead check — nenhum pendente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // entidade check — existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 100 }],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
      })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/já está cadastrado/i);
  });

  it('deve retornar 409 quando CNPJ já é clínica existente', async () => {
    // mock rep percentuals query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '5',
          percentual_comissao_comercial: '3',
          modelo_comissionamento: 'percentual',
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    // lead check — nenhum pendente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // entidade check — nenhuma
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // clínica check — existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 200 }],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '09110380000191',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 0,
      })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/clínica/i);
  });

  it('deve criar lead e retornar 201', async () => {
    // mock rep percentuals query
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '5',
          percentual_comissao_comercial: '3',
          modelo_comissionamento: 'percentual',
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    // lead check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // entidade check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // clínica check
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT RETURNING
    const novoLead = {
      id: 20,
      representante_id: 1,
      cnpj: '12345678000190',
      razao_social: 'Teste S.A.',
      status: 'pendente',
    };
    mockQuery.mockResolvedValueOnce({ rows: [novoLead], rowCount: 1 } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        razao_social: 'Teste S.A.',
        contato_nome: 'João',
        contato_email: 'joao@test.dev',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
        percentual_comissao: 5,
      })
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.lead.cnpj).toBe('12345678000190');
  });

  it('deve retornar 403 quando modelo_comissionamento é null (COMISSIONAMENTO_NAO_DEFINIDO)', async () => {
    // mock rep percentuals query — modelo null
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: null,
          percentual_comissao_comercial: null,
          modelo_comissionamento: null,
          valor_custo_fixo_entidade: null,
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        contato_nome: 'Empresa Sem Comissão',
        valor_negociado: 1000,
        num_vidas_estimado: 50,
      })
    );

    expect(res.status).toBe(403);
    const d = await res.json();
    expect(d.code).toBe('COMISSIONAMENTO_NAO_DEFINIDO');
  });

  it('deve retornar 400 quando modelo custo_fixo e valor abaixo do mínimo (custoFixo+CUSTO_POR_AVALIACAO)', async () => {
    // Rep#42 bug: custoFixo=12 (entidade), negociado=15 → margem=3 < CUSTO_POR_AVALIACAO[entidade]=12 → 400
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '0',
          percentual_comissao_comercial: '20',
          modelo_comissionamento: 'custo_fixo',
          valor_custo_fixo_entidade: '12.00',
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    // NOTE: route returns 400 after repResult, before querying existente

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        contato_nome: 'Empresa Teste',
        tipo_cliente: 'entidade',
        valor_negociado: 15,
        num_vidas_estimado: 10,
      })
    );

    expect(res.status).toBe(400);
    const d = await res.json();
    expect(d.error).toMatch(/m[ií]nimo/i);
    expect(d.error).toMatch(/24/); // R$12 + R$12 = R$24
  });

  it('deve aceitar lead custo_fixo entidade com valor igual ao mínimo (R$24)', async () => {
    // custoFixo=12, CUSTO_POR_AVALIACAO[entidade]=12 → mínimo=24
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          percentual_comissao: '0',
          percentual_comissao_comercial: '20',
          modelo_comissionamento: 'custo_fixo',
          valor_custo_fixo_entidade: '12.00',
          valor_custo_fixo_clinica: null,
        },
      ],
      rowCount: 1,
    } as any);
    // sem lead existente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // sem entidade existente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // sem clinica existente
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // INSERT retorna o lead
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 999, cnpj: '12345678000190', status: 'pendente' }],
      rowCount: 1,
    } as any);

    const res = await POST(
      makePostReq({
        cnpj: '12345678000190',
        contato_nome: 'Empresa Limite',
        tipo_cliente: 'entidade',
        valor_negociado: 24,
        num_vidas_estimado: 10,
      })
    );

    expect(res.status).toBe(201);
  });
});
