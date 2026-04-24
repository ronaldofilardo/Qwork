/**
 * @fileoverview Testes da API GET /api/comercial/minhas-comissoes
 * @description Lista comissões do comercial filtradas por gestor_comercial_cpf.
 * Inclui totais pendentes (retida/congelada_aguardando_admin), liberados e pagos.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/comercial/minhas-comissoes/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeRequest(url = 'http://localhost/api/comercial/minhas-comissoes') {
  return new NextRequest(url);
}

const comercialSession = {
  cpf: '22222222222',
  nome: 'Comercial Dev',
  perfil: 'comercial',
};

const emptyResumo = {
  total_laudos: '0',
  total_recebido: '0',
  media_por_laudo: '0',
  valor_pendente: '0',
  valor_liberado: '0',
};

describe('GET /api/comercial/minhas-comissoes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession as any);
  });

  it('deve retornar lista vazia quando não há comissões pagas', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(0);
    expect(data.total).toBe(0);
    expect(data.resumo.total_laudos).toBe('0');
  });

  it('deve retornar resumo com campos valor_pendente e valor_liberado', async () => {
    const resumo = {
      total_laudos: '3',
      total_recebido: '22.50',
      media_por_laudo: '7.50',
      valor_pendente: '15.00',
      valor_liberado: '7.50',
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [resumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '3' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.resumo.valor_pendente).toBe('15.00');
    expect(data.resumo.valor_liberado).toBe('7.50');
    expect(data.resumo.total_recebido).toBe('22.50');
  });

  it('deve retornar comissões com laudo_id e valor_parcela', async () => {
    const mockComissoes = [
      {
        id: 1,
        representante_nome: 'Rep Teste',
        entidade_nome: 'Entidade X',
        laudo_id: 100,
        parcela_numero: 1,
        total_parcelas: 3,
        valor_laudo: '150.00',
        valor_parcela: '50.00',
        percentual_comissao_comercial: '5.00',
        valor_comissao_comercial: '7.50',
        mes_emissao: '2026-04',
        data_aprovacao: '2026-04-01T00:00:00Z',
        data_pagamento: '2026-04-10T00:00:00Z',
        asaas_payment_id: 'pay_abc123',
      },
      {
        id: 2,
        representante_nome: 'Rep Teste',
        entidade_nome: 'Entidade X',
        laudo_id: 100,
        parcela_numero: 2,
        total_parcelas: 3,
        valor_laudo: '150.00',
        valor_parcela: '50.00',
        percentual_comissao_comercial: '5.00',
        valor_comissao_comercial: '7.50',
        mes_emissao: '2026-04',
        data_aprovacao: '2026-04-01T00:00:00Z',
        data_pagamento: '2026-04-15T00:00:00Z',
        asaas_payment_id: 'pay_def456',
      },
    ];

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_laudos: '2',
            total_recebido: '15.00',
            media_por_laudo: '7.50',
            valor_pendente: '0',
            valor_liberado: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: mockComissoes, rowCount: 2 } as any);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(2);
    
    // Verificar que laudo_id está sendo retornado
    expect(data.comissoes[0].laudo_id).toBe(100);
    expect(data.comissoes[1].laudo_id).toBe(100);
    
    // Verificar que parcela_numero e total_parcelas estão sendo retornados
    expect(data.comissoes[0].parcela_numero).toBe(1);
    expect(data.comissoes[0].total_parcelas).toBe(3);
    expect(data.comissoes[1].parcela_numero).toBe(2);
    expect(data.comissoes[1].total_parcelas).toBe(3);
    
    // Verificar que valor_laudo e valor_parcela estão sendo retornados
    expect(data.comissoes[0].valor_laudo).toBe('150.00');
    expect(data.comissoes[0].valor_parcela).toBe('50.00');
    expect(data.comissoes[1].valor_laudo).toBe('150.00');
    expect(data.comissoes[1].valor_parcela).toBe('50.00');
  });

  it('deve retornar comissões com resumo correto', async () => {
    const mockComissoes = [
      {
        id: 1,
        representante_nome: 'Rep Teste',
        entidade_nome: 'Entidade X',
        valor_laudo: '150.00',
        percentual_comissao_comercial: '5.00',
        valor_comissao_comercial: '7.50',
        mes_emissao: '2026-04',
        data_aprovacao: '2026-04-01T00:00:00Z',
        data_pagamento: '2026-04-10T00:00:00Z',
        asaas_payment_id: 'pay_abc123',
      },
    ];

    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_laudos: '1',
            total_recebido: '7.50',
            media_por_laudo: '7.50',
            valor_pendente: '0',
            valor_liberado: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: mockComissoes, rowCount: 1 } as any);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.comissoes).toHaveLength(1);
    expect(data.comissoes[0].representante_nome).toBe('Rep Teste');
    expect(data.comissoes[0].valor_comissao_comercial).toBe('7.50');
    expect(data.resumo.total_laudos).toBe('1');
    expect(data.resumo.total_recebido).toBe('7.50');
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.limit).toBe(30);
  });

  it('deve passar cpf do comercial nas queries (segurança: isolamento por gestor_comercial_cpf)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeRequest());

    // As 3 queries devem receber o CPF do comercial como parâmetro
    expect(mockQuery.mock.calls).toHaveLength(3);

    // Query resumo: primeiro parâmetro é o CPF
    const resumoParams = mockQuery.mock.calls[0][1] as unknown[];
    expect(resumoParams[0]).toBe(comercialSession.cpf);

    // Query total: primeiro parâmetro é o CPF
    const totalParams = mockQuery.mock.calls[1][1] as unknown[];
    expect(totalParams[0]).toBe(comercialSession.cpf);

    // Query listagem: primeiro parâmetro é o CPF
    const listParams = mockQuery.mock.calls[2][1] as unknown[];
    expect(listParams[0]).toBe(comercialSession.cpf);
  });

  it('SQL de resumo deve conter gestor_comercial_cpf e JOIN representantes', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeRequest());

    const resumoSQL = mockQuery.mock.calls[0][0] as string;
    expect(resumoSQL).toContain('gestor_comercial_cpf');
    expect(resumoSQL).toContain('JOIN representantes r ON r.id = cl.representante_id');
  });

  it('SQL de resumo deve incluir retida e congelada_aguardando_admin em valor_pendente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeRequest());

    const resumoSQL = mockQuery.mock.calls[0][0] as string;
    expect(resumoSQL).toContain("'retida'");
    expect(resumoSQL).toContain("'congelada_aguardando_admin'");
    expect(resumoSQL).toContain('valor_pendente');
    expect(resumoSQL).toContain('valor_liberado');
  });

  it('deve usar fallback com todos os campos quando resumo retorna vazio', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.resumo.valor_pendente).toBe('0');
    expect(data.resumo.valor_liberado).toBe('0');
    expect(data.resumo.total_laudos).toBe('0');
  });

  it('SQL de listagem deve incluir laudo_id, valor_laudo e valor_parcela calculado', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [emptyResumo], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ total: '0' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    await GET(makeRequest());

    const listSQL = mockQuery.mock.calls[2][0] as string;
    expect(listSQL).toContain('cl.laudo_id');
    expect(listSQL).toContain('cl.valor_laudo');
    expect(listSQL).toContain('cl.parcela_numero');
    expect(listSQL).toContain('cl.total_parcelas');
    expect(listSQL).toContain('(cl.valor_laudo / cl.total_parcelas)');
    expect(listSQL).toContain('valor_parcela');
  });

  it('deve suportar paginação via query param page', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            total_laudos: '50',
            total_recebido: '375.00',
            media_por_laudo: '7.50',
            valor_pendente: '0',
            valor_liberado: '0',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ total: '50' }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await GET(
      makeRequest('http://localhost/api/comercial/minhas-comissoes?page=2')
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.page).toBe(2);
    expect(data.total).toBe(50);
  });

  it('deve retornar 403 quando usuário não é comercial', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar 500 em erro inesperado de banco', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));

    const res = await GET(makeRequest());
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
