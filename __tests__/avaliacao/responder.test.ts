/**
 * Testes para responder questões da avaliação
 * Item 2: Salvar resposta automaticamente ao clicar (sem botão)
 * Item 3: Progresso avança para "X de 37" imediatamente
 * Item 4: Recarregar página retoma na questão atual
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = require('@/lib/session').requireAuth;

describe('Avaliação - Responder Questões', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Test User',
      perfil: 'funcionario',
    });
  });

  describe('Item 2: Salvar resposta automaticamente ao clicar', () => {
    it('deve salvar resposta imediatamente ao clicar na opção', async () => {
      const avaliacaoId = 1;
      const grupo = 1;
      const item = 'Q1';
      const valor = 50;

      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/respostas/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId, grupo, item, valor }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO respostas'),
        expect.arrayContaining([avaliacaoId, grupo, item, valor])
      );
    });

    it('deve salvar resposta sem necessidade de botão "Salvar"', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/respostas/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas',
        {
          method: 'POST',
          body: JSON.stringify({
            avaliacaoId: 1,
            grupo: 1,
            item: 'Q1',
            valor: 75,
          }),
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Não deve haver necessidade de confirmação adicional
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('deve permitir alteração de resposta ao clicar novamente', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/respostas/route');

      // Primeira resposta
      const request1 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas',
        {
          method: 'POST',
          body: JSON.stringify({
            avaliacaoId: 1,
            grupo: 1,
            item: 'Q1',
            valor: 25,
          }),
        }
      );
      await POST(request1);

      // Segunda resposta (alterando)
      const request2 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas',
        {
          method: 'POST',
          body: JSON.stringify({
            avaliacaoId: 1,
            grupo: 1,
            item: 'Q1',
            valor: 75,
          }),
        }
      );
      const response2 = await POST(request2);

      expect(response2.status).toBe(200);
      // A API deve fazer upsert, permitindo alteração
    });
  });

  describe('Item 3: Progresso avança imediatamente', () => {
    it('deve retornar progresso numérico de 0 a 37', async () => {
      const respostas = [
        { item: 'Q1', valor: 50 },
        { item: 'Q2', valor: 75 },
        { item: 'Q3', valor: 25 },
      ];

      mockQuery.mockResolvedValue({
        rows: respostas,
        rowCount: respostas.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.respostas).toHaveLength(3);
      expect(data.total).toBe(3);
      // O frontend deve calcular: "3 de 37"
    });

    it('deve atualizar progresso após cada resposta salva', async () => {
      // Inicialmente sem respostas - precisa mockar verificação de ownership + busca de respostas
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // ownership check
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // respostas vazias

      const { GET: getRespostas } =
        await import('@/app/api/avaliacao/respostas-all/route');
      const request1 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response1 = await getRespostas(request1);
      const data1 = await response1.json();
      expect(data1.total).toBe(0);

      // Salvar uma resposta - POST faz múltiplas queries internas
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
      const { POST } = await import('@/app/api/avaliacao/respostas/route');
      const saveRequest = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas',
        {
          method: 'POST',
          body: JSON.stringify({
            avaliacaoId: 1,
            grupo: 1,
            item: 'Q1',
            valor: 50,
          }),
        }
      );
      await POST(saveRequest);

      // Limpar mocks anteriores e configurar apenas para a próxima chamada GET
      jest.clearAllMocks();
      // Verificar progresso atualizado - API usa rows.length para calcular total
      // Primeira query: verificar ownership da avaliação
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1 }],
        rowCount: 1,
      });
      // Segunda query: buscar respostas
      mockQuery.mockResolvedValueOnce({
        rows: [{ item: 'Q1', valor: 50 }],
        rowCount: 1,
      });
      const request2 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response2 = await getRespostas(request2);
      const data2 = await response2.json();
      expect(data2.total).toBe(1);
      // Frontend deve mostrar "1 de 37"
    });

    it('deve mostrar progresso exato até 37 questões', async () => {
      const respostas = Array.from({ length: 35 }, (_, i) => ({
        item: `Q${i + 1}`,
        valor: 50,
      }));

      mockQuery.mockResolvedValue({
        rows: respostas,
        rowCount: respostas.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(35);
      // Frontend deve mostrar "35 de 37"
    });
  });

  describe('Item 4: Recarregar página retoma na questão atual', () => {
    it('deve retornar todas as respostas já salvas ao recarregar', async () => {
      const respostasExistentes = [
        { item: 'Q1', valor: 50 },
        { item: 'Q2', valor: 75 },
        { item: 'Q13', valor: 25 },
      ];

      mockQuery.mockResolvedValue({
        rows: respostasExistentes,
        rowCount: respostasExistentes.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.respostas).toHaveLength(3);
      expect(data.respostas.map((r: any) => r.item)).toEqual([
        'Q1',
        'Q2',
        'Q13',
      ]);
      // Frontend deve identificar que Q1, Q2 e Q13 já foram respondidas
      // e mostrar Q3 como próxima questão
    });

    it('deve permitir continuar de onde parou após recarregar', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          { item: 'Q1', valor: 50 },
          { item: 'Q2', valor: 75 },
        ],
        rowCount: 2,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');
      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(data.total).toBe(2);
      // Frontend deve mostrar q3 como próxima questão não respondida
    });

    it('deve preservar respostas após múltiplos recarregamentos', async () => {
      const respostas = [
        { item: 'Q1', valor: 50 },
        { item: 'Q2', valor: 75 },
        { item: 'Q3', valor: 100 },
        { item: 'Q9', valor: 0 },
        { item: 'Q13', valor: 25 },
      ];

      mockQuery.mockResolvedValue({
        rows: respostas,
        rowCount: respostas.length,
      });

      const { GET } = await import('@/app/api/avaliacao/respostas-all/route');

      // Primeira "carga" (como se tivesse recarregado)
      const request1 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response1 = await GET(request1);
      const data1 = await response1.json();
      expect(data1.total).toBe(5);

      // Segunda "carga" (outro recarregamento)
      const request2 = new NextRequest(
        'http://localhost:3000/api/avaliacao/respostas-all?avaliacaoId=1'
      );
      const response2 = await GET(request2);
      const data2 = await response2.json();
      expect(data2.total).toBe(5);
      expect(data2.respostas).toEqual(data1.respostas);
    });
  });
});
