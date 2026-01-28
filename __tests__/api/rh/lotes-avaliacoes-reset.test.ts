/**
 * Testes para API /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset
 * - Resetar avaliação (apagar todas as respostas)
 * - Validações de permissão, status do lote e restrições
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/session';
import { POST } from '@/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/reset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST - Resetar avaliação', () => {
    it('deve resetar avaliação com sucesso', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      // Mock BEGIN transaction
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock lote check
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, status: 'ativo' }],
        rowCount: 1,
      });

      // Mock avaliacao check
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluida',
            funcionario_cpf: '12345678901',
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });

      // Mock reset check (não existe reset anterior)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      // Mock count respostas
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '10' }], rowCount: 1 });

      // Mock delete respostas
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 10 });

      // Mock update avaliacao
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 });

      // Mock insert audit
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-123', created_at: '2026-01-16T12:00:00Z' }],
        rowCount: 1,
      });

      // Mock COMMIT
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Funcionário solicitou refazer a avaliação',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('resetada com sucesso');
      expect(data.respostasDeleted).toBe(10);
    });

    it('deve rejeitar se motivo não for fornecido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(422);
      const data = await response.json();
      expect(data.error).toContain('Motivo é obrigatório');
    });

    it('deve rejeitar se lote estiver concluído', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, status: 'concluido' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Motivo válido',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('lote já foi concluído');
    });

    it('deve rejeitar se avaliação já foi resetada', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, status: 'ativo' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'concluida',
            funcionario_cpf: '12345678901',
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });
      // Mock reset check (já existe reset)
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-previous' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Motivo válido',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('já foi resetada anteriormente');
    });

    it('deve rejeitar se usuário não for RH', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'User',
        perfil: 'funcionario',
      });

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Motivo válido',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Acesso negado');
    });

    it('deve rejeitar se lote foi enviado ao emissor', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, status: 'enviado_emissor' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ROLLBACK

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Motivo válido',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(409);
      const data = await response.json();
      expect(data.error).toContain('enviado ao emissor');
    });

    it('deve registrar auditoria após reset bem-sucedido', async () => {
      mockRequireAuth.mockResolvedValue({
        cpf: '11111111111',
        nome: 'RH Teste',
        perfil: 'rh',
      });

      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // BEGIN
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1, status: 'ativo' }],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            status: 'em_andamento',
            funcionario_cpf: '12345678901',
            funcionario_nome: 'João Silva',
          },
        ],
        rowCount: 1,
      });
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // no previous reset
      mockQuery.mockResolvedValueOnce({ rows: [{ count: '5' }], rowCount: 1 }); // count
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 5 }); // delete
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // update
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'uuid-audit', created_at: '2026-01-16T12:00:00Z' }],
        rowCount: 1,
      }); // audit insert
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/rh/lotes/1/avaliacoes/1/reset',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reason: 'Motivo de auditoria',
          }),
        }
      );

      const response = await POST(request, {
        params: { id: '1', avaliacaoId: '1' },
      });

      expect(response.status).toBe(200);

      // Verificar que audit log foi inserido
      const auditCalls = mockQuery.mock.calls.filter((call) =>
        call[0]?.includes('INSERT INTO avaliacao_resets')
      );
      expect(auditCalls.length).toBe(1);
      expect(auditCalls[0][1]).toContain('Motivo de auditoria');
    });
  });
});
