/**
 * Testes para proteção contra desativação de contratantes aguardando pagamento
 * - DELETE /api/admin/contratantes com validações de status
 */

import { NextRequest } from 'next/server';
import { DELETE } from '@/app/api/admin/contratantes/route';
import { query } from '@/lib/db';

// Mocks
jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('bcryptjs');

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('/api/admin/contratantes - DELETE protection', () => {
  let mockSession: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSession = {
      cpf: '12345678901',
      perfil: 'admin',
      nome: 'Admin Teste',
      clinica_id: 1,
    };

    // Mock da sessão
    jest.mock('@/lib/session', () => ({
      getSession: jest.fn(() => mockSession),
    }));

    // Mock do bcrypt
    const bcryptMock = {
      compare: jest.fn(() => true),
    };
    jest.mock('bcryptjs', () => ({
      default: bcryptMock,
    }));
  });

  describe('DELETE - Soft delete com proteção', () => {
    it('deve permitir soft delete de contratante pendente', async () => {
      const contratanteId = 1;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'pendente',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      // Mock do update
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: false,
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('desativado');
    });

    it('deve permitir soft delete de contratante rejeitado', async () => {
      const contratanteId = 2;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'rejeitado',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      // Mock do update
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: false,
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve rejeitar soft delete de contratante aguardando pagamento', async () => {
      const contratanteId = 3;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'aguardando_pagamento',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: false,
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'Não é possível desativar contratante que está aguardando confirmação de pagamento'
      );
    });
  });

  describe('DELETE - Hard delete com proteção', () => {
    it('deve rejeitar hard delete de contratante aguardando pagamento', async () => {
      const contratanteId = 4;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'aguardando_pagamento',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: true,
            admin_password: 'senha123',
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain(
        'Não é possível remover completamente contratante que está aguardando confirmação de pagamento'
      );
    });

    it('deve permitir hard delete de contratante rejeitado com senha válida', async () => {
      const contratanteId = 5;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'rejeitado',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      // Mock da validação de senha
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            senha_hash: 'hashed_password',
          },
        ],
        rowCount: 1,
      });

      // Mock das operações de delete
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // DELETE contratos
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // DELETE pagamentos
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // DELETE contratantes
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // COMMIT

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: true,
            admin_password: 'senha123',
            motivo: 'Teste de remoção',
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('removido permanentemente');
    });

    it('deve rejeitar hard delete sem senha de admin', async () => {
      const contratanteId = 6;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'rejeitado',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: true,
            // Sem senha
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Senha do admin é necessária');
    });

    it('deve rejeitar hard delete com senha inválida', async () => {
      const contratanteId = 7;

      // Mock da busca do contratante
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: contratanteId,
            status: 'rejeitado',
            nome: 'Clínica Teste',
          },
        ],
        rowCount: 1,
      });

      // Mock da validação de senha (falha)
      const bcryptModule = jest.requireMock('bcryptjs');
      bcryptModule.default.compare.mockResolvedValueOnce(false);

      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            senha_hash: 'hashed_password',
          },
        ],
        rowCount: 1,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: contratanteId,
            force: true,
            admin_password: 'senha_errada',
          }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('Senha do admin inválida');
    });
  });

  describe('Validações gerais', () => {
    it('deve rejeitar acesso sem sessão de admin', async () => {
      jest.mock('@/lib/session', () => ({
        getSession: jest.fn(() => null),
      }));

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 1 }),
        }
      );

      const response = await DELETE(request);
      expect(response.status).toBe(403);
    });

    it('deve rejeitar contratante não encontrado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/admin/contratantes',
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: 999 }),
        }
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Contratante não encontrado');
    });
  });
});
