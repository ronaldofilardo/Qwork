/**
 * Testes para validar contexto de segurança no reset de avaliação (RH)
 * Verifica que app.current_user_cpf é configurado corretamente
 * 
 * @see Fix: https://github.com/ronaldofilardo/Qwork/commit/731e136
 * @date 2026-02-12
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { POST } from '@/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route';
import { QueryResult } from 'pg';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

describe('/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset - Security Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contexto de Segurança (app.current_user_cpf)', () => {
    it('deve passar user (sessão) para todas as queries', async () => {
      const mockUser = {
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      };

      mockRequireAuth.mockResolvedValue(mockUser);
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockUser);

      // Mock sequencial de queries - agora SEM BEGIN/SET LOCAL/COMMIT manuais
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 100, status: 'ativo' }],
          rowCount: 1,
        } as QueryResult<unknown>) // loteCheck
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          rowCount: 1,
        } as QueryResult<unknown>) // emissaoSolicitada check
        .mockResolvedValueOnce({
          rows: [{ emitido_em: null }],
          rowCount: 1,
        } as QueryResult<unknown>) // loteEmitido check
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'iniciada',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João Silva',
            },
          ],
          rowCount: 1,
        } as QueryResult<unknown>) // avaliacaoCheck
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as QueryResult<unknown>) // resetCheck
        .mockResolvedValueOnce({
          rows: [{ count: '3' }],
          rowCount: 1,
        } as QueryResult<unknown>) // countResult
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 3,
        } as QueryResult<unknown>) // DELETE respostas
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 1,
        } as QueryResult<unknown>) // UPDATE avaliacoes
        .mockResolvedValueOnce({
          rows: [{ id: 'audit-uuid', created_at: '2026-02-12T10:00:00Z' }],
          rowCount: 1,
        } as QueryResult<unknown>); // INSERT audit

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/100/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Teste de contexto de segurança',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '100', avaliacaoId: '1' },
      });

      expect(response.status).toBe(200);

      // Verificar que query foi chamada com user como terceiro parâmetro
      const queryCalls = mockQuery.mock.calls;
      
      // Todas as queries (exceto a primeira que é loteCheck) devem passar user
      expect(queryCalls.length).toBeGreaterThan(0);
      
      // Verificar que pelo menos algumas queries recebem o parâmetro user
      const callsWithUser = queryCalls.filter(
        (call) => call.length === 3 && call[2] === mockUser
      );
      
      // Esperamos que TODAS as queries (exceto a primeira) recebam user
      expect(callsWithUser.length).toBeGreaterThan(0);
    });

    it('não deve executar BEGIN/SET LOCAL/COMMIT manuais', async () => {
      const mockUser = {
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      };

      mockRequireAuth.mockResolvedValue(mockUser);
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockUser);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 100, status: 'ativo' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ emitido_em: null }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              status: 'iniciada',
              funcionario_cpf: '12345678901',
              funcionario_nome: 'João',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ id: 'audit-id', created_at: '2026-02-12T10:00:00Z' }],
          rowCount: 1,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/100/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Teste' }),
        }
      );

      await POST(request, {
        params: { id: '100', avaliacaoId: '1' },
      });

      // Verificar que NÃO há chamadas para BEGIN, COMMIT, ou ROLLBACK manuais
      const queryCalls = mockQuery.mock.calls;
      const hasBegin = queryCalls.some((call) =>
        String(call[0]).includes('BEGIN')
      );
      const hasCommit = queryCalls.some((call) =>
        String(call[0]).includes('COMMIT')
      );
      const hasRollback = queryCalls.some((call) =>
        String(call[0]).includes('ROLLBACK')
      );
      const hasSetLocal = queryCalls.some((call) =>
        String(call[0]).includes('SET LOCAL')
      );

      expect(hasBegin).toBe(false);
      expect(hasCommit).toBe(false);
      expect(hasRollback).toBe(false);
      expect(hasSetLocal).toBe(false);
    });

    it('deve rejeitar com acesso negado se user não for RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'Funcionário',
        perfil: 'funcionario',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/100/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Teste' }),
        }
      );

      const response = await POST(request, {
        params: { id: '100', avaliacaoId: '1' },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Acesso negado');

      // Verificar que nenhuma query foi executada
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve rejeitar se reason for inválido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/100/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'abc' }), // menos de 5 caracteres
        }
      );

      const response = await POST(request, {
        params: { id: '100', avaliacaoId: '1' },
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toContain('Motivo é obrigatório');

      // Verificar que nenhuma query foi executada
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve retornar erro 404 se lote não existir', async () => {
      const mockUser = {
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      };

      mockRequireAuth.mockResolvedValue(mockUser);
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockUser);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>); // loteCheck vazio

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/999/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Teste válido' }),
        }
      );

      const response = await POST(request, {
        params: { id: '999', avaliacaoId: '1' },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Lote não encontrado');
    });

    it('deve bloquear reset se emissão foi solicitada', async () => {
      const mockUser = {
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
        clinica_id: 1,
      };

      mockRequireAuth.mockResolvedValue(mockUser);
      mockRequireRHWithEmpresaAccess.mockResolvedValue(mockUser);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, empresa_id: 100, status: 'ativo' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }], // emissão foi solicitada
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rows: [{ emitido_em: null }],
          rowCount: 1,
        });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/100/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'Teste válido' }),
        }
      );

      const response = await POST(request, {
        params: { id: '100', avaliacaoId: '1' },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('emissão do laudo já foi solicitada');
    });
  });
});
