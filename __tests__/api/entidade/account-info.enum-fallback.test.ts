import { NextRequest } from 'next/server';

// Mocks
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));

describe('📌 API account-info — fallback/status legado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("Deve retornar contrato quando DB contém status legado 'ativo' e garantir que usamos comparação por texto", async () => {
    const mockGetSession = require('@/lib/session').getSession;
    const mockQuery = require('@/lib/db').query;

    const mockSession = { contratante_id: 18, perfil: 'gestor_entidade' };
    const mockContratante = {
      id: 18,
      nome: 'RELEGERE',
      cnpj: '12345678000123',
      email: 'releger@teste.com',
      telefone: '11999999999',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      criado_em: '2025-12-22T20:51:18.804Z',
    };

    // Simular: 1) SELECT contratante 2) SELECT planCols (colunas de plano) 3) SELECT contrato com status legado 'ativo' 4) SELECT pagamentos 5) SELECT reciboCols
    mockGetSession.mockReturnValue(mockSession);
    mockQuery
      .mockResolvedValueOnce({ rows: [mockContratante] })
      .mockResolvedValueOnce({ rows: [] }) // planColsRes
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            plano_id: 1,
            valor_total: 1500.0,
            status: 'ativo',
            numero_funcionarios: 10,
            criado_em: '2025-01-01',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] }) // pagamentos
      .mockResolvedValueOnce({ rows: [] }); // reciboCols

    const { GET } = require('@/app/api/entidade/account-info/route');

    // Chamada (compatível com impl. atual)
    const request = new NextRequest(
      'http://localhost:3000/api/entidade/account-info'
    );
    const response = await GET(request);

    const data = await response.json();

    expect(data.contrato).toBeDefined();
    expect(data.contrato.status).toBe('ativo');

    // Assegurar que a query de contratos usa a comparação por texto (evita erro de enum)
    expect(mockQuery).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('co.status::text'),
      [18]
    );
  });
});
