import { GET } from '@/app/api/admin/cobranca/route';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn().mockResolvedValue({ cpf: 'admin', perfil: 'admin' }),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('API /api/admin/cobranca', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna campos esperados e suporta filtro por cnpj', async () => {
    const fakeRows = [
      {
        contratante_id: 1,
        cnpj: '02494916000170',
        contrato_id: 35,
        plano_id: 4,
        plano_nome: 'Plano Fixo',
        plano_preco: '20.00',
        pagamento_id: 21,
        pagamento_valor: '20.00',
        pagamento_status: 'pago',
        data_pagamento: '2025-12-24T14:18:47.37561',
      },
    ];

    // Primeiro call (colunas detect) retornará vazio (simulação)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // Segundo call: contagem total (COUNT)
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '1' }],
      rowCount: 1,
    } as any);
    // Terceiro call: a query principal
    mockQuery.mockResolvedValueOnce({ rows: fakeRows, rowCount: 1 } as any);

    const req = new Request(
      'http://localhost/api/admin/cobranca?cnpj=02494916000170'
    );
    const res = await GET(req as any);
    const data = await res.json();
    console.log('Resposta da API:', data);

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.contratos)).toBe(true);
    expect(data.contratos[0]).toMatchObject({
      contratante_id: 1,
      cnpj: '02494916000170',
      contrato_id: 35,
      plano_id: 4,
      plano_nome: 'Plano Fixo',
      plano_preco: '20.00',
      pagamento_id: 21,
      pagamento_valor: '20.00',
      pagamento_status: 'pago',
    });

    // Verificar que a query foi chamada com parâmetro de cnpj
    expect(mockQuery.mock.calls[mockQuery.mock.calls.length - 1][0]).toContain(
      'regexp_replace(ct.cnpj'
    );
  });

  test('suporta paginação e ordenação (page/limit/sort_by/sort_dir)', async () => {
    // Mocks: col detection, count (0), main query (no rows)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // col detection
    mockQuery.mockResolvedValueOnce({
      rows: [{ total: '0' }],
      rowCount: 1,
    } as any); // count
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // main

    const req = new Request(
      'http://localhost/api/admin/cobranca?page=2&limit=10&sort_by=data_pagamento&sort_dir=asc'
    );
    const res = await GET(req as any);
    // Deve retornar 200 mesmo sem resultados
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('contratos');
    expect(data).toHaveProperty('total');
    expect(data.total).toBe(0);
    expect(data).toHaveProperty('page');
    expect(data).toHaveProperty('limit');
  });
});
