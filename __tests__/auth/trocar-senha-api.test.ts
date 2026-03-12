/**
 * Testes para POST /api/auth/trocar-senha
 *
 * Cobre:
 * - Autenticação obrigatória (apenas gestor/rh)
 * - Validações de entrada (senha_atual, nova_senha)
 * - Verificação da senha atual via bcrypt
 * - Atualização de primeira_senha_alterada = true
 * - Registro de auditoria correto
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/trocar-senha/route';
import * as db from '@/lib/db';
import * as session from '@/lib/session';
import bcrypt from 'bcryptjs';
import * as auditoria from '@/lib/auditoria/auditoria';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('bcryptjs', () => ({ compare: jest.fn(), hash: jest.fn() }));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'jest-test',
  })),
}));
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => jest.fn(() => null)),
  RATE_LIMIT_CONFIGS: { auth: {} },
}));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));

const mockQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockGetSession = session.getSession as jest.MockedFunction<
  typeof session.getSession
>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;
const mockBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockRegistrarAuditoria =
  auditoria.registrarAuditoria as jest.MockedFunction<
    typeof auditoria.registrarAuditoria
  >;

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/trocar-senha', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/auth/trocar-senha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRegistrarAuditoria.mockResolvedValue(undefined as any);
  });

  // ── Autenticação ──────────────────────────────────────────────────────────

  describe('Autenticação', () => {
    it('deve retornar 401 quando não há sessão', async () => {
      mockGetSession.mockReturnValue(null);

      const response = await POST(
        makeRequest({ senha_atual: '123', nova_senha: 'NovaSenha123' })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/não autenticado/i);
    });

    it('deve retornar 403 para perfil admin', async () => {
      mockGetSession.mockReturnValue({
        cpf: '00000000000',
        nome: 'Admin',
        perfil: 'admin',
      } as any);

      const response = await POST(
        makeRequest({ senha_atual: '123', nova_senha: 'NovaSenha123' })
      );
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toMatch(/gestor|rh/i);
    });

    it('deve retornar 403 para perfil funcionario', async () => {
      mockGetSession.mockReturnValue({
        cpf: '11111111111',
        nome: 'Func',
        perfil: 'funcionario',
      } as any);

      const response = await POST(
        makeRequest({ senha_atual: '123', nova_senha: 'NovaSenha123' })
      );
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it('deve aceitar perfil gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'Gestor',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
      mockQuery.mockResolvedValue({
        rows: [{ senha_hash: 'hash_atual' }],
        rowCount: 1,
      } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash');

      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'NovaSenha@123' })
      );

      // Não deve ser 401 nem 403
      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('deve aceitar perfil rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        nome: 'RH',
        perfil: 'rh',
        clinica_id: 1,
      } as any);
      mockQuery.mockResolvedValue({
        rows: [{ senha_hash: 'hash_atual' }],
        rowCount: 1,
      } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash');

      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'NovaSenha@123' })
      );

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });

  // ── Validações de entrada ─────────────────────────────────────────────────

  describe('Validações de entrada', () => {
    beforeEach(() => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
    });

    it('deve retornar 400 quando senha_atual está ausente', async () => {
      const response = await POST(makeRequest({ nova_senha: 'NovaSenha@123' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/senha atual/i);
    });

    it('deve retornar 400 quando nova_senha está ausente', async () => {
      const response = await POST(makeRequest({ senha_atual: 'Senha@123' }));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/nova senha/i);
    });

    it('deve retornar 400 quando nova_senha tem menos de 8 caracteres', async () => {
      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'Curta1' })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/mínimo/i);
    });

    it('deve retornar 400 quando nova_senha === senha_atual', async () => {
      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'Senha@123' })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/diferente/i);
    });

    it('deve retornar 400 quando gestor não tem entidade_id na sessão', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: undefined,
      } as any);

      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'NovaSenha@123' })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/sessão/i);
    });

    it('deve retornar 400 quando rh não tem clinica_id na sessão', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'rh',
        clinica_id: undefined,
      } as any);

      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'NovaSenha@123' })
      );
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toMatch(/sessão/i);
    });
  });

  // ── Verificação de senha atual ────────────────────────────────────────────

  describe('Verificação de senha atual', () => {
    beforeEach(() => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
    });

    it('deve retornar 404 quando registro de senha não existe no banco', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const response = await POST(
        makeRequest({ senha_atual: 'Senha@123', nova_senha: 'NovaSenha@123' })
      );
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toMatch(/não encontrado/i);
    });

    it('deve retornar 401 quando senha_atual está incorreta', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ senha_hash: 'hash_correto' }],
        rowCount: 1,
      } as any);
      (mockBcryptCompare as any).mockResolvedValue(false);

      const response = await POST(
        makeRequest({ senha_atual: 'SenhaErrada', nova_senha: 'NovaSenha@123' })
      );
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toMatch(/senha atual incorreta/i);
    });

    it('deve registrar auditoria de falha quando senha_atual está incorreta', async () => {
      mockQuery.mockResolvedValue({
        rows: [{ senha_hash: 'hash_correto' }],
        rowCount: 1,
      } as any);
      (mockBcryptCompare as any).mockResolvedValue(false);

      await POST(
        makeRequest({ senha_atual: 'SenhaErrada', nova_senha: 'NovaSenha@123' })
      );

      expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade_tipo: 'usuario',
          acao: 'login_falha',
          metadados: expect.objectContaining({
            motivo: 'senha_atual_incorreta_troca',
          }),
        })
      );
    });
  });

  // ── Troca de senha com sucesso ────────────────────────────────────────────

  describe('Troca bem-sucedida', () => {
    it('deve retornar 200 e atualizar senha para gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash_atual' }],
          rowCount: 1,
        } as any) // SELECT
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any); // UPDATE
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash');

      const response = await POST(
        makeRequest({
          senha_atual: 'SenhaAtual@123',
          nova_senha: 'NovaSenha@456',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve retornar 200 e atualizar senha para rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '98765432100',
        perfil: 'rh',
        clinica_id: 2,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash_atual' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash_rh');

      const response = await POST(
        makeRequest({
          senha_atual: 'SenhaAtual@123',
          nova_senha: 'NovaSenha@456',
        })
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('deve fazer UPDATE em entidades_senhas para gestor', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 5,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('hash_novo');

      await POST(
        makeRequest({ senha_atual: 'SenhaAtual@1', nova_senha: 'NovaSenha@2' })
      );

      // A segunda query deve ser o UPDATE em entidades_senhas com primeira_senha_alterada = true
      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toMatch(/UPDATE entidades_senhas/i);
      expect(updateCall[0]).toMatch(/primeira_senha_alterada = true/i);
      expect(updateCall[1]).toEqual(
        expect.arrayContaining(['hash_novo', '12345678901', 5])
      );
    });

    it('deve fazer UPDATE em clinicas_senhas para rh', async () => {
      mockGetSession.mockReturnValue({
        cpf: '98765432100',
        perfil: 'rh',
        clinica_id: 3,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('hash_novo_rh');

      await POST(
        makeRequest({ senha_atual: 'SenhaAtual@1', nova_senha: 'NovaSenha@2' })
      );

      const updateCall = mockQuery.mock.calls[1];
      expect(updateCall[0]).toMatch(/UPDATE clinicas_senhas/i);
      expect(updateCall[0]).toMatch(/primeira_senha_alterada = true/i);
    });

    it('deve registrar auditoria de sucesso com entidade_tipo=usuario e acao=atualizar', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash_atual' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash');

      await POST(
        makeRequest({
          senha_atual: 'SenhaAtual@123',
          nova_senha: 'NovaSenha@456',
        })
      );

      expect(mockRegistrarAuditoria).toHaveBeenCalledWith(
        expect.objectContaining({
          entidade_tipo: 'usuario',
          acao: 'atualizar',
          metadados: expect.objectContaining({
            operacao: 'trocar_senha_primeiro_acesso',
          }),
        })
      );
    });

    it('deve usar bcrypt.hash com salt 12 na nova senha', async () => {
      mockGetSession.mockReturnValue({
        cpf: '12345678901',
        perfil: 'gestor',
        entidade_id: 1,
      } as any);
      mockQuery
        .mockResolvedValueOnce({
          rows: [{ senha_hash: 'hash_atual' }],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      (mockBcryptCompare as any).mockResolvedValue(true);
      (mockBcryptHash as any).mockResolvedValue('novo_hash');

      await POST(
        makeRequest({
          senha_atual: 'SenhaAtual@123',
          nova_senha: 'NovaSenha@456',
        })
      );

      expect(mockBcryptHash).toHaveBeenCalledWith('NovaSenha@456', 12);
    });
  });
});
