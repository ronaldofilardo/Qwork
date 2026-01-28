/**
 * Testes para API /api/rh/funcionarios/status
 * - Reativar/desligar funcionários da empresa
 * - Efeito cascata nas avaliações (preservação de dados)
 * - Validações de permissão
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { PUT } from '@/app/api/rh/funcionarios/status/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/rh/funcionarios/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockReset();
    mockQuery.mockReset();
  });

  describe('PUT - Atualizar status do funcionário', () => {
    it('deve ativar funcionário com sucesso', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: false }],
          rowCount: 1,
        }) // funcionário encontrado
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE avaliacoes
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // lotes afetados (nenhum)

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: true }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe(
        'Funcionário reativado com sucesso. Ele voltará a receber novos lotes de avaliação.'
      );

      // Verifica se UPDATE foi chamado
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE funcionarios SET ativo = $1 WHERE cpf = $2',
        [true, '12345678901']
      );
    });

    it('deve desligar funcionário da empresa e marcar avaliações como inativadas', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true, clinica_id: 1 }],
          rowCount: 1,
        }) // funcionário encontrado
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({
          rows: [
            { id: 1, status: 'inativada' },
            { id: 2, status: 'inativada' },
          ],
          rowCount: 2,
        }) // UPDATE avaliacoes retorna avaliações inativadas
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'ativo', codigo: 'LOTE-001' }],
          rowCount: 1,
        }) // lotes afetados
        .mockResolvedValueOnce({
          rows: [{ ativas: '3', concluidas: '3' }],
          rowCount: 1,
        }) // estatísticas do lote
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE lote status

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: false }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe(
        'Funcionário desligado da empresa. Avaliações não concluídas foram marcadas como inativadas, mas seus dados e histórico foram preservados.'
      );

      // Verifica se UPDATE do funcionário foi chamado
      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE funcionarios SET ativo = $1 WHERE cpf = $2',
        [false, '12345678901']
      );

      // Verifica se UPDATE das avaliações foi chamado com RETURNING
      expect(mockQuery).toHaveBeenCalledWith(
        "UPDATE avaliacoes SET status = 'inativada' WHERE funcionario_cpf = $1 AND status != 'concluida' RETURNING id, status",
        ['12345678901']
      );
    });

    it.skip('deve retornar sucesso quando status já está correto', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true }],
          rowCount: 1,
        }); // funcionário já ativo

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: true }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Status já está atualizado');
    });

    it('deve validar parâmetros obrigatórios', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      // Sem CPF
      const request1 = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ ativo: true }),
        }
      );
      const response1 = await PUT(request1);
      expect(response1.status).toBe(400);

      // Sem ativo
      const request2 = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901' }),
        }
      );
      const response2 = await PUT(request2);
      expect(response2.status).toBe(400);
    });

    it('deve validar acesso apenas para perfil RH', async () => {
      mockRequireRole.mockRejectedValue(new Error('Acesso negado'));

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: true }),
        }
      );
      const response = await PUT(request);

      expect(response.status).toBe(500);
      expect(mockRequireRole).toHaveBeenCalledWith('rh');
    });

    it.skip('deve validar que funcionário pertence à mesma clínica', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // funcionário não encontrado

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: true }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(
        'Funcionário não encontrado ou não pertence à sua clínica'
      );
    });

    it.skip('deve retornar erro 404 quando RH não é encontrado', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '99999999999',
        nome: 'RH Inválido',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // RH não encontrado

      const { PUT } = await import('@/app/api/rh/funcionarios/status/route');

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PUT',
          body: JSON.stringify({ cpf: '12345678901', ativo: true }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Usuário RH não encontrado');
    });
  });
});
