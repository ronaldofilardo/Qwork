/**
 * Testes para validar contexto de segurança no reset de avaliação (Entidade/Gestor)
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
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { POST } from '@/app/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset/route';
import { QueryResult } from 'pg';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/entidade/lote/[id]/avaliacoes/[avaliacaoId]/reset - Security Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contexto de Segurança (app.current_user_cpf)', () => {
    it('deve passar user (sessão) para todas as queries', async () => {
      const mockUser = {
        cpf: '22222222222',
        nome: 'Gestor Entidade',
        perfil: 'gestor',
        entidade_id: 99,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown);

      // Mock sequencial de queries - agora SEM BEGIN/SET LOCAL/COMMIT manuais
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 99, status: 'ativo' }],
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
              id: 2,
              status: 'em_andamento',
              funcionario_cpf: '33333333333',
              funcionario_nome: 'Funcionário Teste',
            },
          ],
          rowCount: 1,
        } as QueryResult<unknown>) // avaliacaoCheck
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 0,
        } as QueryResult<unknown>) // resetCheck
        .mockResolvedValueOnce({
          rows: [{ count: '5' }],
          rowCount: 1,
        } as QueryResult<unknown>) // countResult
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 5,
        } as QueryResult<unknown>) // DELETE respostas
        .mockResolvedValueOnce({
          rows: [],
          rowCount: 1,
        } as QueryResult<unknown>) // UPDATE avaliacoes
        .mockResolvedValueOnce({
          rows: [{ id: 'audit-uuid', created_at: '2026-02-12T11:00:00Z' }],
          rowCount: 1,
        } as QueryResult<unknown>); // INSERT audit

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste de contexto de segurança' }),
      });

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(200);

      // Verificar que query foi chamada com user como terceiro parâmetro
      const queryCalls = mockQuery.mock.calls;

      // Verificar que pelo menos algumas queries recebem o parâmetro user
      const callsWithUser = queryCalls.filter(
        (call) => call.length === 3 && call[2] === mockUser
      );

      // Esperamos que TODAS as queries recebam user
      expect(callsWithUser.length).toBeGreaterThan(0);
    });

    it('não deve executar BEGIN/SET LOCAL/COMMIT manuais', async () => {
      const mockUser = {
        cpf: '22222222222',
        nome: 'Gestor Entidade',
        perfil: 'gestor',
        entidade_id: 99,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 99, status: 'ativo' }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ emitido_em: null }], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 2,
              status: 'em_andamento',
              funcionario_cpf: '33333333333',
              funcionario_nome: 'Func',
            },
          ],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ rows: [], rowCount: 0 })
        .mockResolvedValueOnce({ rows: [{ count: '2' }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [], rowCount: 2 })
        .mockResolvedValueOnce({ rows: [], rowCount: 1 })
        .mockResolvedValueOnce({
          rows: [{ id: 'audit-id', created_at: '2026-02-12T11:00:00Z' }],
          rowCount: 1,
        });

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste' }),
      });

      await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

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

    it('deve rejeitar com acesso negado se user não for gestor', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '22222222222',
        nome: 'RH',
        perfil: 'rh',
      } as unknown);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste' }),
      });

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Acesso negado');

      // Verificar que nenhuma query foi executada
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve rejeitar se reason for inválido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '22222222222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 99,
      } as unknown);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'ab' }), // menos de 5 caracteres
      });

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toContain('Motivo é obrigatório');

      // Verificar que nenhuma query foi executada
      expect(mockQuery).not.toHaveBeenCalled();
    });

    it('deve rejeitar se lote não pertence à entidade do gestor', async () => {
      const mockUser = {
        cpf: '22222222222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 99,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown);

      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, entidade_id: 100 }], // entidade diferente
        rowCount: 1,
      } as QueryResult<unknown>);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste válido' }),
      });

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error_code).toBe('permission_entidade_mismatch');
    });

    it('deve retornar erro 404 se lote não existir', async () => {
      const mockUser = {
        cpf: '22222222222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 99,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown);

      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as QueryResult<unknown>);

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste válido' }),
      });

      const response = await POST(request, {
        params: { id: '999', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Lote não encontrado');
    });

    it('deve bloquear reset se emissão foi solicitada', async () => {
      const mockUser = {
        cpf: '22222222222',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 99,
      };

      mockRequireAuth.mockResolvedValue(mockUser as unknown);

      mockQuery
        .mockResolvedValueOnce({
          rows: [{ id: 1, entidade_id: 99, status: 'ativo' }],
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

      const request = new NextRequest('http://localhost', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Teste válido' }),
      });

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '2' },
      } as { params: { id: string; avaliacaoId: string } });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('emissão do laudo já foi solicitada');
    });
  });
});
