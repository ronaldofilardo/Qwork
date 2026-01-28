/**
 * Testes para API /api/rh/funcionarios/status/batch
 * - Reativar/desligar funcionários da empresa em lote
 * - Validações de permissão e consistência de clinica_id
 * - Preservação de dados e efeito cascata nas avaliações e lotes
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
import { PUT } from '@/app/api/rh/funcionarios/status/batch/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/rh/funcionarios/status/batch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PUT - Atualizar status de funcionários em lote', () => {
    it('deve desativar múltiplos funcionários com sucesso', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const cpfs = ['12345678901', '12345678902', '12345678903'];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [
            { cpf: '12345678901', ativo: true },
            { cpf: '12345678902', ativo: true },
            { cpf: '12345678903', ativo: false },
          ],
          rowCount: 3,
        }) // funcionários encontrados
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // UPDATE avaliacoes func1
        .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 }) // UPDATE avaliacoes func2
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // lotes func1
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // lotes func2
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain(
        '2 funcionário(s) desligado(s) da empresa'
      );
    });

    it('deve retornar erro quando alguns funcionários não pertencem à clínica', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const cpfs = ['12345678901', '12345678902'];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true }], // Apenas 1 encontrado
          rowCount: 1,
        }); // funcionários encontrados (faltando 1)

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe(
        'Um ou mais funcionários não foram encontrados ou não pertencem à sua clínica'
      );
    });

    it('deve pular funcionários que já estão no status desejado', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const cpfs = ['12345678901', '12345678902'];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [
            { cpf: '12345678901', ativo: false }, // Já inativo
            { cpf: '12345678902', ativo: true }, // Será atualizado
          ],
          rowCount: 2,
        }) // funcionários encontrados
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios (apenas 1)
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // UPDATE avaliacoes (apenas 1)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // lotes (apenas 1)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toContain(
        '1 funcionário(s) desligado(s) da empresa'
      );
    });

    it('deve validar parâmetros obrigatórios', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      // Sem cpfs
      const request1 = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ ativo: false }),
        }
      );
      const response1 = await PUT(request1);
      expect(response1.status).toBe(400);

      // cpfs vazio
      const request2 = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs: [], ativo: false }),
        }
      );
      const response2 = await PUT(request2);
      expect(response2.status).toBe(400);

      // Sem ativo
      const request3 = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs: ['123'] }),
        }
      );
      const response3 = await PUT(request3);
      expect(response3.status).toBe(400);
    });

    it('deve validar acesso apenas para perfil RH', async () => {
      mockRequireRole.mockRejectedValue(new Error('Acesso negado'));

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs: ['123'], ativo: true }),
        }
      );
      const response = await PUT(request);

      expect(response.status).toBe(500);
      expect(mockRequireRole).toHaveBeenCalledWith('rh');
    });

    it('deve fazer rollback em caso de erro durante transação', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const cpfs = ['12345678901'];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true }],
          rowCount: 1,
        }) // funcionários encontrados
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockRejectedValueOnce(new Error('Erro no banco')); // Erro durante UPDATE avaliacoes

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);

      expect(response.status).toBe(500);
      // Verificar se ROLLBACK foi chamado
      expect(mockQuery).toHaveBeenCalledWith('ROLLBACK');
    });

    it('deve atualizar status dos lotes afetados', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const cpfs = ['12345678901'];

      mockQuery
        .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // RH lookup
        .mockResolvedValueOnce({
          rows: [{ cpf: '12345678901', ativo: true }],
          rowCount: 1,
        }) // funcionários encontrados
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // BEGIN
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE avaliacoes
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'ativo', codigo: 'LOTE-001' }],
          rowCount: 1,
        }) // lotes afetados
        .mockResolvedValueOnce({
          rows: [{ ativas: '2', concluidas: '2' }],
          rowCount: 1,
        }) // estatísticas do lote
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE lote para 'concluido'
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Verificar se UPDATE do lote foi chamado
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE lotes_avaliacao'),
        expect.arrayContaining(['concluido', 1])
      );
    });
  });
});
