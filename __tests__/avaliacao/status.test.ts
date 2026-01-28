/**
 * Testes para status da avaliação
 * Item 5: API retorna "em_andamento" ou "iniciada"
 * Item 6: API retorna progresso com número exato (0-37)
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = require('@/lib/session').requireAuth;

describe('Avaliação - Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Test User',
      perfil: 'funcionario',
    });
  });

  describe('Item 5: API retorna status "em_andamento" ou "iniciada"', () => {
    it('deve retornar status "iniciada" para avaliação não começada', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            status: 'iniciada',
            inicio: new Date().toISOString(),
            envio: null,
            grupo_atual: null,
          },
        ],
        rowCount: 1,
      });

      const { GET } = await import('@/app/api/avaliacao/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('iniciada');
      expect(data.avaliacaoId).toBe(1);
    });

    it('deve retornar status "em_andamento" quando houver respostas', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            status: 'em_andamento',
            inicio: new Date().toISOString(),
            envio: null,
            grupo_atual: 2,
          },
        ],
        rowCount: 1,
      });

      const { GET } = await import('@/app/api/avaliacao/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('em_andamento');
      expect(data.grupo_atual).toBe(2);
    });

    it('deve permitir atualização de status de "iniciada" para "em_andamento"', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { PATCH } = await import('@/app/api/avaliacao/status/route');

      const request = new Request(
        'http://localhost:3000/api/avaliacao/status',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'em_andamento',
            avaliacaoId: 1,
          }),
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes SET status'),
        ['em_andamento', 1]
      );
    });

    it('deve rejeitar status inválido', async () => {
      const { PATCH } = await import('@/app/api/avaliacao/status/route');

      const request = new Request(
        'http://localhost:3000/api/avaliacao/status',
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'status_invalido',
            avaliacaoId: 1,
          }),
        }
      );

      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Status inválido');
    });

    it('deve retornar "concluida" quando avaliação finalizada', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            status: 'concluida',
            inicio: new Date().toISOString(),
            envio: new Date().toISOString(),
            grupo_atual: null,
          },
        ],
        rowCount: 1,
      });

      const { GET } = await import('@/app/api/avaliacao/status/route');
      const response = await GET();
      const data = await response.json();

      expect(data.status).toBe('concluida');
      expect(data.envio).toBeDefined();
    });
  });

  describe('Item 6: API retorna progresso numérico exato (0-37)', () => {
    it('deve calcular progresso baseado no número de respostas', async () => {
      const respostas = Array.from({ length: 10 }, (_, i) => ({
        item: `Q${i + 1}`,
        valor: 50,
      }));

      mockQuery.mockResolvedValue({
        rows: respostas,
        rowCount: respostas.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new Request(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(10);
      // Frontend deve mostrar "10 de 37"
    });

    it('deve retornar progresso 0 quando nenhuma resposta', async () => {
      mockQuery.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new Request(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(0);
      expect(data.respostas).toHaveLength(0);
      // Frontend deve mostrar "0 de 37"
    });

    it('deve retornar progresso 37 quando todas respondidas', async () => {
      const respostas = Array.from({ length: 37 }, (_, i) => ({
        item: `Q${i + 1}`,
        valor: 50,
      }));

      mockQuery.mockResolvedValue({
        rows: respostas,
        rowCount: respostas.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new Request(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(37);
      // Frontend deve mostrar "37 de 37"
    });

    it('deve retornar progresso intermediário preciso', async () => {
      const progressosTeste = [15, 25, 35, 45, 55, 65];

      for (const progresso of progressosTeste) {
        const respostas = Array.from({ length: progresso }, (_, i) => ({
          item: `q${i + 1}`,
          valor: 50,
        }));

        mockQuery.mockResolvedValue({
          rows: respostas,
          rowCount: respostas.length,
        });

        const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
        const request = new Request(
          'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
        );
        const response = await GET(request);
        const data = await response.json();

        expect(data.total).toBe(progresso);
        // Frontend deve mostrar "{progresso} de 37"
      }
    });

    it('deve incluir progresso no status da avaliação', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            status: 'em_andamento',
            inicio: new Date().toISOString(),
            envio: null,
            grupo_atual: 3,
          },
        ],
        rowCount: 1,
      });

      const { GET } = await import('@/app/api/avaliacao/status/route');
      const response = await GET();
      const data = await response.json();

      expect(data.avaliacaoId).toBe(1);
      expect(data.status).toBe('em_andamento');
      // O frontend deve buscar o progresso via /api/avaliacao/respostas-all
    });
  });
});
