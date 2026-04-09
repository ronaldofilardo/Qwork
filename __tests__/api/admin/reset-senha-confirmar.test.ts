/**
 * Testes de API para POST /api/admin/reset-senha/confirmar
 *
 * Rota pública — usuário define nova senha utilizando o token de reset.
 * Efeitos:
 *   - Atualiza senha_hash via bcrypt
 *   - Ativa usuário (ativo=true / status='ativo')
 *   - Marca token como usado (reset_usado_em = NOW())
 *   - Limpa reset_token (NULL)
 */

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/reset-senha/confirmar/route';

jest.mock('@/lib/db');
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$2b$12$hashed_senha'),
}));

import { query } from '@/lib/db';
const mockQuery = query as jest.MockedFunction<typeof query>;

const TOKEN_VALIDO = 'c'.repeat(64);
const SENHA_VALIDA = 'SenhaForte123';
const agora = new Date();
const setesDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/admin/reset-senha/confirmar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/admin/reset-senha/confirmar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validações de entrada', () => {
    it('deve retornar 400 para body sem token', async () => {
      const res = await POST(makeRequest({ senha: SENHA_VALIDA, confirmacao: SENHA_VALIDA }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 quando senha e confirmação não conferem', async () => {
      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: 'SenhaErrada1',
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/não conferem/i);
    });

    it('deve retornar 400 para senha com menos de 8 caracteres', async () => {
      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: 'Ab1',
        confirmacao: 'Ab1',
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/8 caracteres/i);
    });

    it('deve retornar 400 para senha sem letra maiúscula', async () => {
      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: 'senhaforte123',
        confirmacao: 'senhaforte123',
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/maiúscula/i);
    });

    it('deve retornar 400 para senha sem número', async () => {
      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: 'SenhaForte',
        confirmacao: 'SenhaForte',
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/número/i);
    });
  });

  describe('Token inválido / expirado', () => {
    it('deve retornar 400 para token inexistente', async () => {
      // usuarios: vazio, representantes: vazio
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: SENHA_VALIDA,
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 para token já usado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          tipo: 'usuario',
          tipo_usuario: 'suporte',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: agora.toISOString(),
        }],
        rowCount: 1,
      } as any);

      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: SENHA_VALIDA,
      }));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 para token expirado', async () => {
      const passado = new Date(agora.getTime() - 1000).toISOString();
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          tipo: 'usuario',
          tipo_usuario: 'suporte',
          reset_token_expira_em: passado,
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);

      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: SENHA_VALIDA,
      }));
      expect(res.status).toBe(400);
    });
  });

  describe('Sucesso — usuário da tabela usuarios', () => {
    it('deve confirmar reset e ativar usuário', async () => {
      // SELECT FOR UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          tipo: 'usuario',
          tipo_usuario: 'suporte',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);
      // UPDATE usuarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: SENHA_VALIDA,
      }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });

  describe('Sucesso — representante', () => {
    it('deve confirmar reset e ativar representante', async () => {
      // SELECT FOR UPDATE — usuarios: vazio
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // SELECT FOR UPDATE — representantes: encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 99,
          tipo: 'representante',
          tipo_usuario: null,
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);
      // UPDATE representantes
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      // INSERT INTO representantes_senhas
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(makeRequest({
        token: TOKEN_VALIDO,
        senha: SENHA_VALIDA,
        confirmacao: SENHA_VALIDA,
      }));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
