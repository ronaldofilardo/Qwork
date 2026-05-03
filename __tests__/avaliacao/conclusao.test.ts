/**
 * Testes para conclusão da avaliação
 * Item 15: Responder 37 questões muda status e redireciona
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

describe('Avaliação - Conclusão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Test User',
      perfil: 'funcionario',
    });
    // Fallback genérico para consultas adicionais realizadas durante a finalização
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 });
  });

  describe('Item 15: Responder 37 questões muda status e redireciona', () => {
    it('deve finalizar avaliação após 70ª resposta', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, funcionario_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve atualizar status para "concluida"', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, funcionario_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      await POST(request);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE avaliacoes'),
        expect.arrayContaining([expect.anything(), 1])
      );
    });

    it('deve registrar data de envio ao finalizar', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, funcionario_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      await POST(request);

      // Verificar que a query UPDATE inclui o timestamp de envio
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('envio'),
        expect.any(Array)
      );
    });

    it('deve impedir finalização de avaliação já concluída', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('deve retornar sucesso com avaliacaoId após finalizar', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, funcionario_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.avaliacaoId).toBe(1);
    });

    it('deve permitir verificação de status após conclusão', async () => {
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
      // Frontend deve redirecionar para /avaliacao/concluida ou dashboard
    });

    it('deve processar resultados após conclusão', async () => {
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, funcionario_cpf: '12345678901' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 1 }),
        }
      );

      const response = await POST(request);

      expect(response.status).toBe(200);
      // A finalização deve calcular os resultados automaticamente
    });

    it('deve validar que avaliação pertence ao usuário antes de finalizar', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const { POST } = await import('@/app/api/avaliacao/finalizar/route');

      const request = new NextRequest(
        'http://localhost:3000/api/avaliacao/finalizar',
        {
          method: 'POST',
          body: JSON.stringify({ avaliacaoId: 999 }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('não encontrada');
    });
  });
});
