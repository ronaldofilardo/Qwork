import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/usuarios/route';
import { PATCH } from '@/app/api/admin/usuarios/[id]/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/audit', () => ({
  logAudit: jest.fn().mockResolvedValue(undefined),
  extractRequestInfo: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'test-agent',
  })),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makePatchRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/usuarios/1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('admin usuários do sistema', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '00000000001',
      nome: 'Admin',
      perfil: 'admin',
    } as any);
  });

  describe('GET /api/admin/usuarios', () => {
    it('deve listar usuários suporte/comercial', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            nome: 'Suporte 1',
            cpf: '11111111111',
            email: null,
            tipo_usuario: 'suporte',
            ativo: true,
            criado_em: '2026-04-15',
          },
          {
            id: 2,
            nome: 'Comercial 1',
            cpf: '22222222222',
            email: null,
            tipo_usuario: 'comercial',
            ativo: false,
            criado_em: '2026-04-15',
          },
        ],
        rowCount: 2,
      } as any);

      // Act
      const res = await GET();
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.total).toBe(2);
      expect(data.usuarios).toHaveLength(2);
    });

    it('deve retornar 403 quando não é admin', async () => {
      // Arrange
      mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

      // Act
      const res = await GET();
      const data = await res.json();

      // Assert
      expect(res.status).toBe(403);
      expect(data.error).toMatch(/acesso negado/i);
    });

    it('deve retornar 500 em erro de banco de dados', async () => {
      // Arrange
      mockQuery.mockRejectedValueOnce(new Error('DB connection error'));

      // Act
      const res = await GET();
      const data = await res.json();

      // Assert
      expect(res.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });

  describe('PATCH /api/admin/usuarios/[id]', () => {
    it('deve inativar usuário ativo', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 1,
              cpf: '11111111111',
              nome: 'Suporte 1',
              tipo_usuario: 'suporte',
              ativo: true,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '1' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.ativo).toBe(false);
    });

    it('deve ativar usuário inativo', async () => {
      // Arrange
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 2,
              cpf: '22222222222',
              nome: 'Comercial 1',
              tipo_usuario: 'comercial',
              ativo: false,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      // Act
      const req = new NextRequest('http://localhost/api/admin/usuarios/2', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true }),
      });
      const res = await PATCH(req, { params: { id: '2' } });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.ativo).toBe(true);
    });

    it('deve retornar 200 idempotente quando usuário já está inativo', async () => {
      // Arrange — usuário já está inativo, tenta inativar novamente
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            cpf: '11111111111',
            nome: 'Suporte 1',
            tipo_usuario: 'suporte',
            ativo: false,
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '1' },
      });
      const data = await res.json();

      // Assert — idempotente: 200 sem UPDATE
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/já está inativo/i);
    });

    it('deve retornar 200 idempotente quando usuário já está ativo', async () => {
      // Arrange — usuário já está ativo, tenta ativar novamente
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            cpf: '11111111111',
            nome: 'Suporte 1',
            tipo_usuario: 'suporte',
            ativo: true,
          },
        ],
        rowCount: 1,
      } as any);

      // Act
      const req = new NextRequest('http://localhost/api/admin/usuarios/1', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: true }),
      });
      const res = await PATCH(req, { params: { id: '1' } });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toMatch(/já está ativo/i);
    });

    it('deve retornar 400 para ID inválido (não numérico)', async () => {
      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: 'abc' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(400);
      expect(data.error).toMatch(/inválido/i);
    });

    it('deve retornar 404 quando usuário não existe', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '999' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('deve retornar 403 quando não é admin', async () => {
      // Arrange
      mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '1' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(403);
      expect(data.error).toMatch(/acesso negado/i);
    });

    it('deve inativar usuário com perfil emissor', async () => {
      // Arrange — emissor agora está no whitelist permitido
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              id: 3,
              cpf: '33333333333',
              nome: 'Emissor 1',
              tipo_usuario: 'emissor',
              ativo: true,
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      // Act
      const req = new NextRequest('http://localhost/api/admin/usuarios/3', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ativo: false }),
      });
      const res = await PATCH(req, { params: { id: '3' } });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.ativo).toBe(false);
    });

    it('deve retornar 404 para usuário com perfil não permitido (gestor)', async () => {
      // Arrange — gestores não são gerenciados por esta rota
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '10' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(404);
      expect(data.error).toBeDefined();
    });

    it('deve retornar 500 em erro inesperado de banco', async () => {
      // Arrange
      mockQuery.mockRejectedValueOnce(new Error('Connection timeout'));

      // Act
      const res = await PATCH(makePatchRequest({ ativo: false }), {
        params: { id: '1' },
      });
      const data = await res.json();

      // Assert
      expect(res.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
