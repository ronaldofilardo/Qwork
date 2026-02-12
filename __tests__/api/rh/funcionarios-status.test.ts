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
import { PUT, PATCH } from '@/app/api/rh/funcionarios/status/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/rh/funcionarios/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockReset();
    mockQuery.mockReset();
  });

  describe('PUT/PATCH - Atualizar status do funcionário', () => {
    it('deve ativar funcionário com sucesso (PUT)', async () => {
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
        }) // SELECT funcionário via JOIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SET LOCAL app.current_user_cpf
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SET LOCAL app.current_user_perfil
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // COMMIT (ativar, não atualiza avaliações)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // updateLotesStatus - SELECT lotes

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
      expect(data.message).toContain('reativado com sucesso');
    });

    it('deve desligar funcionário com sucesso (PATCH)', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true }],
          rowCount: 1,
        }) // SELECT funcionário via JOIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SET LOCAL app.current_user_cpf
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // SET LOCAL app.current_user_perfil
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({
          rows: [
            { id: 1, status: 'inativada' },
            { id: 2, status: 'inativada' },
          ],
          rowCount: 2,
        }) // UPDATE avaliacoes retorna avaliações inativadas
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'ativo' }],
          rowCount: 1,
        }) // lotes afetados
        .mockResolvedValueOnce({
          rows: [{ ativas: '3', concluidas: '3' }],
          rowCount: 1,
        }) // estatísticas do lote
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE lote status
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status',
        {
          method: 'PATCH',
          body: JSON.stringify({
            cpf: '12345678901',
            ativo: false,
            empresa_id: 1,
          }),
        }
      );
      const response = await PATCH(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('desligado');
    });

    it('deve retornar sucesso quando status já está correto', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678901', ativo: true }],
        rowCount: 1,
      }); // funcionário já ativo

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
      // Não deve iniciar transação
      expect(mockQuery).not.toHaveBeenCalledWith('BEGIN');
    });

    it('deve validar parâmetros obrigatórios', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

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

    it('deve validar que funcionário pertence à mesma clínica', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // funcionário não encontrado via JOIN

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
  });
});
