/**
 * Testes para API /api/rh/funcionarios/status/batch
 * - Reativar/desligar funcionários da empresa em lote (status segregado por empresa)
 * - Validações de permissão e consistência de clinica_id (obtido da sessão, não do DB)
 * - Preservação de dados e efeito cascata nas avaliações e lotes
 */

// Mock client para withTransaction
const mockClientQuery = jest.fn();
jest.mock('@/lib/db-transaction', () => ({
  withTransaction: jest
    .fn()
    .mockImplementation(async (cb: (client: unknown) => Promise<unknown>) => {
      return cb({ query: mockClientQuery });
    }),
}));

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
    mockClientQuery.mockReset();
  });

  describe('PUT - Atualizar status de funcionários em lote', () => {
    it('deve desativar múltiplos funcionários com sucesso', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      const cpfs = ['12345678901', '12345678902', '12345678903'];

      // Funcionários encontrados (status do vínculo)
      mockQuery.mockResolvedValueOnce({
        rows: [
          { cpf: '12345678901', vinculo_ativo: true },
          { cpf: '12345678902', vinculo_ativo: true },
          { cpf: '12345678903', vinculo_ativo: false },
        ],
        rowCount: 3,
      });

      // withTransaction client queries
      mockClientQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 2 }) // UPDATE funcionarios_clinicas
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // UPDATE avaliacoes func1
        .mockResolvedValueOnce({ rows: [{ id: 2 }], rowCount: 1 }); // UPDATE avaliacoes func2

      // updateLotesStatus queries (via query, not client)
      mockQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // lotes func1
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }); // lotes func2

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
        clinica_id: 1,
      });

      const cpfs = ['12345678901', '12345678902'];

      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678901', vinculo_ativo: true }], // Apenas 1 encontrado
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
        clinica_id: 1,
      });

      const cpfs = ['12345678901', '12345678902'];

      // func1 já inativo (vinculo_ativo=false), func2 será atualizado
      mockQuery.mockResolvedValueOnce({
        rows: [
          { cpf: '12345678901', vinculo_ativo: false }, // Já inativo
          { cpf: '12345678902', vinculo_ativo: true }, // Será atualizado
        ],
        rowCount: 2,
      });

      // withTransaction client queries
      mockClientQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios_clinicas
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }); // UPDATE avaliacoes

      // updateLotesStatus
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // lotes

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
        clinica_id: 1,
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
        clinica_id: 1,
      });

      const cpfs = ['12345678901'];

      // Funcionário encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678901', vinculo_ativo: true }],
        rowCount: 1,
      });

      // withTransaction client falha durante UPDATE
      mockClientQuery.mockRejectedValueOnce(new Error('Erro no banco'));

      const request = new NextRequest(
        'http://localhost:3000/api/rh/funcionarios/status/batch',
        {
          method: 'PUT',
          body: JSON.stringify({ cpfs, ativo: false }),
        }
      );
      const response = await PUT(request);

      expect(response.status).toBe(500);
    });

    it('deve atualizar status dos lotes afetados', async () => {
      mockRequireRole.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      });

      const cpfs = ['12345678901'];

      mockQuery.mockResolvedValueOnce({
        rows: [{ cpf: '12345678901', vinculo_ativo: true }],
        rowCount: 1,
      });

      // withTransaction client
      mockClientQuery
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // UPDATE funcionarios_clinicas
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE avaliacoes

      // updateLotesStatus
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, status: 'ativo' }],
          rowCount: 1,
        }) // lotes afetados
        .mockResolvedValueOnce({
          rows: [{ ativas: '2', concluidas: '2' }],
          rowCount: 1,
        }) // estatísticas do lote
        .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE lote status

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
