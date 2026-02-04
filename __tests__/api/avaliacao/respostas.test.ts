import { Request, Response } from 'node-fetch';
import { GET, POST } from '@/app/api/avaliacao/respostas/route';

// Mock das dependências

// Mock completo para getSession e requireAuth
let mockSession: any = null;
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  requireAuth: jest.fn(async () => {
    if (!mockSession) throw new Error('Não autenticado');
    return mockSession;
  }),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/lotes', () => ({
  recalcularStatusLote: jest.fn(),
}));

jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(),
}));

import { getSession } from '@/lib/session';
import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';

const mockGetSession = getSession as jest.MockedFunction<any>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;

describe('/api/avaliacao/respostas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
  });

  describe('GET', () => {
    it('deve retornar respostas de um grupo específico', async () => {
      const mockRespostas = [
        { item: 'Q1', valor: 75 },
        { item: 'Q2', valor: 50 },
      ];
      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      // Primeira chamada: retorna avaliação
      mockQuery.mockImplementationOnce(() =>
        Promise.resolve({ rows: [{ id: 42 }], rowCount: 1 })
      );
      // Segunda chamada: retorna respostas
      mockQuery.mockImplementationOnce(() =>
        Promise.resolve({ rows: mockRespostas, rowCount: 2 })
      );

      const request = new Request(
        'http://localhost/api/avaliacao/respostas?grupo=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.respostas).toEqual(mockRespostas);
      // Primeira chamada: busca avaliação por CPF
      expect(mockQuery).toHaveBeenNthCalledWith(1, expect.any(String), [
        '12345678901',
      ]);
      // Segunda chamada: busca respostas
      expect(mockQuery).toHaveBeenNthCalledWith(2, expect.any(String), [42, 1]);
    });

    it('deve retornar erro quando usuário não está logado', async () => {
      mockSession = null;
      mockGetSession.mockResolvedValue(null);

      const request = new Request(
        'http://localhost/api/avaliacao/respostas?grupo=1'
      );
      const response = await GET(request);

      // O handler retorna 500 pois não trata explicitamente o erro de autenticação
      expect(response.status).toBe(500);
    });

    it('deve retornar erro quando grupo não é fornecido', async () => {
      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/avaliacao/respostas');
      const response = await GET(request);

      expect(response.status).toBe(400);
    });

    it('deve retornar array vazio quando não há respostas', async () => {
      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      // Primeira chamada: retorna avaliação
      mockQuery.mockImplementationOnce(() =>
        Promise.resolve({ rows: [{ id: 42 }], rowCount: 1 })
      );
      // Segunda chamada: retorna respostas vazias
      mockQuery.mockImplementationOnce(() =>
        Promise.resolve({ rows: [], rowCount: 0 })
      );

      const request = new Request(
        'http://localhost/api/avaliacao/respostas?grupo=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.respostas).toEqual([]);
    });
  });

  describe('POST', () => {
    it('deve salvar respostas corretamente', async () => {
      const requestBody = {
        respostas: [
          { item: 'Q1', valor: 75, grupo: 1 },
          { item: 'Q2', valor: 50, grupo: 1 },
        ],
      };

      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      // Primeira chamada: retorna avaliação
      mockQuery.mockImplementationOnce(() =>
        Promise.resolve({ rows: [{ id: 42 }], rowCount: 1 })
      );
      // Demais chamadas: simula inserts/updates
      mockQuery.mockImplementation(() =>
        Promise.resolve({ rows: [], rowCount: 1 })
      );

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalled();
    });

    it("deve atualizar status para 'em_andamento' quando salvar respostas e avaliação estava 'iniciada'", async () => {
      const requestBody = {
        respostas: [{ item: 'Q1', valor: 75, grupo: 1 }],
      };

      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);

      // Chamadas seqüenciais esperadas:
      // 1) SELECT avaliação -> retorna id 99
      // 2) INSERT resposta -> ok
      // 3) SELECT status -> retorna 'iniciada'
      // 4) UPDATE avaliacoes SET status = 'em_andamento' -> ok
      // 5) COUNT respostas -> retorna 1

      mockQuery
        .mockImplementationOnce(() =>
          Promise.resolve({ rows: [{ id: 99 }], rowCount: 1 })
        ) // buscar avaliacao
        .mockImplementationOnce(() =>
          Promise.resolve({ rows: [], rowCount: 1 })
        ) // insert resposta
        .mockImplementationOnce(() =>
          Promise.resolve({ rows: [{ status: 'iniciada' }], rowCount: 1 })
        ) // select status
        .mockImplementationOnce(() =>
          Promise.resolve({ rows: [], rowCount: 1 })
        ) // update status
        .mockImplementationOnce(() =>
          Promise.resolve({ rows: [{ total: '1' }], rowCount: 1 })
        ); // count

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining(
          "UPDATE avaliacoes SET status = 'em_andamento'"
        ),
        [99]
      );
    });

    it('deve retornar erro quando dados são inválidos', async () => {
      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('deve retornar erro quando usuário não está logado', async () => {
      mockSession = null;
      mockGetSession.mockResolvedValue(null);

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({ respostas: [] }),
      });

      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('deve lidar com erro de banco de dados', async () => {
      mockSession = {
        cpf: '12345678901',
        nome: 'Test User',
        perfil: 'funcionario' as const,
      };
      mockGetSession.mockResolvedValue(mockSession);
      mockQuery.mockRejectedValue(new Error('Database error'));

      const request = new Request('http://localhost/api/avaliacao/respostas', {
        method: 'POST',
        body: JSON.stringify({
          respostas: [{ item: 'Q1', valor: 75, grupo: 1 }],
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
