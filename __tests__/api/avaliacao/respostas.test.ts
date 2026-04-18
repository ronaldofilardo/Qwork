/**
 * @file __tests__/api/avaliacao/respostas.test.ts
 * Testes: /api/avaliacao/respostas
 */

import { GET, POST } from '@/app/api/avaliacao/respostas/route';

// ------------------------------------------------------------------ mocks --

let mockSession: any = null;
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  requireAuth: jest.fn(async () => {
    if (!mockSession) {
      const err: any = new Error('Não autenticado');
      err.status = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    return mockSession;
  }),
}));

jest.mock('@/lib/db', () => ({ query: jest.fn() }));

jest.mock('@/lib/db-security', () => ({ queryWithContext: jest.fn() }));

jest.mock('@/lib/avaliacao-conclusao', () => ({
  verificarEConcluirAvaliacao: jest.fn(),
}));

jest.mock('@/lib/lotes', () => ({ recalcularStatusLote: jest.fn() }));

// ---------------------------------------------------------------- imports --

import { queryWithContext } from '@/lib/db-security';
import * as avaliacaoConclusao from '@/lib/avaliacao-conclusao';

const mockQueryWithContext = queryWithContext as jest.MockedFunction<typeof queryWithContext>;

// --------------------------------------------------------------- helpers --

const makeSession = () => ({
  cpf: '12345678901',
  nome: 'Test User',
  perfil: 'funcionario' as const,
});

const makeGetRequest = (params = 'grupo=1') =>
  new Request(`http://localhost/api/avaliacao/respostas?${params}`);

const makePostRequest = (body: object) =>
  new Request('http://localhost/api/avaliacao/respostas', {
    method: 'POST',
    body: JSON.stringify(body),
  });

// ================================================================= suite ==

describe('/api/avaliacao/respostas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = null;
    (avaliacaoConclusao.verificarEConcluirAvaliacao as jest.Mock).mockResolvedValue({
      concluida: false,
      totalRespostas: 1,
      mensagem: 'Em andamento',
    });
  });

  // ----------------------------------------------------------------- GET -

  describe('GET', () => {
    it('deve retornar 401 quando não autenticado', async () => {
      // mockSession = null (sem sessão)
      const response = await GET(makeGetRequest());
      expect(response.status).toBe(401);
    });

    it('deve retornar 400 quando grupo não é fornecido', async () => {
      mockSession = makeSession();
      const response = await GET(makeGetRequest(''));
      expect(response.status).toBe(400);
    });

    it('deve retornar respostas de um grupo específico', async () => {
      const mockRespostas = [
        { item: 'Q1', valor: 75 },
        { item: 'Q2', valor: 50 },
      ];
      mockSession = makeSession();

      // 1ª: SELECT avaliação por CPF
      mockQueryWithContext.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
      // 2ª: SELECT respostas por avaliacao_id + grupo
      mockQueryWithContext.mockResolvedValueOnce({ rows: mockRespostas, rowCount: 2 } as any);

      const response = await GET(makeGetRequest('grupo=1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.respostas).toEqual(mockRespostas);
    });

    it('deve retornar array vazio quando não há respostas', async () => {
      mockSession = makeSession();

      // 1ª: SELECT avaliação
      mockQueryWithContext.mockResolvedValueOnce({ rows: [{ id: 42 }], rowCount: 1 } as any);
      // 2ª: SELECT respostas vazia
      mockQueryWithContext.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await GET(makeGetRequest('grupo=1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.respostas).toEqual([]);
    });

    it('deve retornar array vazio quando avaliação não é encontrada', async () => {
      mockSession = makeSession();

      // SELECT avaliação — sem resultado
      mockQueryWithContext.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      const response = await GET(makeGetRequest('grupo=1'));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.respostas).toEqual([]);
    });
  });

  // ---------------------------------------------------------------- POST -

  describe('POST', () => {
    it('deve retornar 401 quando não autenticado', async () => {
      // mockSession = null
      const response = await POST(makePostRequest({ respostas: [{ item: 'Q1', valor: 75, grupo: 1 }] }));
      expect(response.status).toBe(401);
    });

    it('deve retornar 400 quando dados são inválidos', async () => {
      mockSession = makeSession();
      const response = await POST(makePostRequest({}));
      expect(response.status).toBe(400);
    });

    it('deve salvar respostas corretamente (status em_andamento)', async () => {
      mockSession = makeSession();

      // 1ª SELECT avaliação; 2ª SELECT status; 3ª-4ª INSERT respostas
      mockQueryWithContext
        .mockResolvedValueOnce({ rows: [{ id: 42, lote_id: null }], rowCount: 1 } as any) // SELECT avaliacao
        .mockResolvedValueOnce({ rows: [{ status: 'em_andamento' }], rowCount: 1 } as any) // SELECT status
        .mockResolvedValue({ rows: [], rowCount: 1 } as any); // INSERT respostas

      const response = await POST(makePostRequest({
        respostas: [
          { item: 'Q1', valor: 75, grupo: 1 },
          { item: 'Q2', valor: 50, grupo: 1 },
        ],
      }));

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it("deve atualizar status para 'em_andamento' quando avaliação estava 'iniciada'", async () => {
      mockSession = makeSession();

      mockQueryWithContext
        .mockResolvedValueOnce({ rows: [{ id: 99, lote_id: null }], rowCount: 1 } as any) // SELECT avaliacao
        .mockResolvedValueOnce({ rows: [{ status: 'iniciada' }], rowCount: 1 } as any)   // SELECT status
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any)                          // INSERT resposta
        .mockResolvedValue({ rows: [], rowCount: 1 } as any);                             // UPDATE status

      const response = await POST(makePostRequest({
        respostas: [{ item: 'Q1', valor: 75, grupo: 1 }],
      }));

      expect(response.status).toBe(200);
      expect(mockQueryWithContext).toHaveBeenCalledWith(
        expect.stringContaining("UPDATE avaliacoes SET status = 'em_andamento'"),
        [99]
      );
    });

    it('deve retornar erro 500 quando falha no banco de dados', async () => {
      mockSession = makeSession();
      // SELECT avaliação falha
      mockQueryWithContext.mockRejectedValueOnce(new Error('Database error'));

      const response = await POST(makePostRequest({
        respostas: [{ item: 'Q1', valor: 75, grupo: 1 }],
      }));

      expect(response.status).toBe(500);
    });
  });
});
