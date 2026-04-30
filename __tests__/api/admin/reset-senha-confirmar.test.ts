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

import { query, transaction } from '@/lib/db';
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;

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
    // Simula transaction executando o callback com tx que delega para mockQuery
    mockTransaction.mockImplementation(async (cb: any) =>
      cb({ query: mockQuery })
    );
  });

  describe('Validações de entrada', () => {
    it('deve retornar 400 para body sem token', async () => {
      const res = await POST(
        makeRequest({ senha: SENHA_VALIDA, confirmacao: SENHA_VALIDA })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 quando senha e confirmação não conferem', async () => {
      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: 'SenhaErrada1',
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/não conferem/i);
    });

    it('deve retornar 400 para senha com menos de 8 caracteres', async () => {
      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: 'Ab1',
          confirmacao: 'Ab1',
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/8 caracteres/i);
    });

    it('deve retornar 400 para senha sem letra maiúscula', async () => {
      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: 'senhaforte123',
          confirmacao: 'senhaforte123',
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/maiúscula/i);
    });

    it('deve retornar 400 para senha sem número', async () => {
      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: 'SenhaForte',
          confirmacao: 'SenhaForte',
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toMatch(/número/i);
    });
  });

  describe('Token inválido / expirado', () => {
    it('deve retornar 400 para token inexistente', async () => {
      // usuarios: vazio, representantes: vazio
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 para token já usado', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '12345678909',
            tipo: 'usuario',
            tipo_usuario: 'suporte',
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: agora.toISOString(),
          },
        ],
        rowCount: 1,
      } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBeDefined();
    });

    it('deve retornar 400 para token expirado', async () => {
      const passado = new Date(agora.getTime() - 1000).toISOString();
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '12345678909',
            tipo: 'usuario',
            tipo_usuario: 'suporte',
            reset_token_expira_em: passado,
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(400);
    });
  });

  describe('Sucesso — usuário da tabela usuarios', () => {
    it('deve confirmar reset e ativar usuário suporte (sem tabela dedicada)', async () => {
      // SELECT FOR UPDATE
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '12345678909',
            tipo: 'usuario',
            tipo_usuario: 'suporte',
            entidade_id: null,
            clinica_id: null,
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);
      // UPDATE usuarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // Apenas 2 queries: SELECT + UPDATE (sem tabela dedicada para suporte)
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });

    it('deve sincronizar senha em entidades_senhas para gestor', async () => {
      // SELECT FOR UPDATE — gestor com entidade_id
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '56394479071',
            nome: 'Gestor Teste',
            tipo_usuario: 'gestor',
            entidade_id: 45,
            clinica_id: null,
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);
      // UPDATE usuarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      // INSERT INTO entidades_senhas (upsert)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // 3 queries: SELECT usuarios + UPDATE usuarios + INSERT entidades_senhas
      expect(mockQuery).toHaveBeenCalledTimes(3);

      // Verificar que a 3ª query é o upsert em entidades_senhas
      const terceiraQuery = (mockQuery as jest.Mock).mock.calls[2][0] as string;
      expect(terceiraQuery).toMatch(/entidades_senhas/i);
    });

    it('deve sincronizar senha em clinicas_senhas para rh', async () => {
      // SELECT FOR UPDATE — rh com clinica_id
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '98765432100',
            nome: 'Gestor RH Teste',
            tipo_usuario: 'rh',
            entidade_id: null,
            clinica_id: 10,
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);
      // UPDATE usuarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      // INSERT INTO clinicas_senhas (upsert)
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      // 3 queries: SELECT usuarios + UPDATE usuarios + INSERT clinicas_senhas
      expect(mockQuery).toHaveBeenCalledTimes(3);

      // Verificar que a 3ª query é o upsert em clinicas_senhas
      const terceiraQuery = (mockQuery as jest.Mock).mock.calls[2][0] as string;
      expect(terceiraQuery).toMatch(/clinicas_senhas/i);
    });

    it('não deve fazer upsert em entidades_senhas quando gestor sem entidade_id', async () => {
      // Gestor sem entidade_id — caso incomum mas deve ser tratado com segurança
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            cpf: '56394479071',
            nome: 'Gestor Sem Entidade',
            tipo_usuario: 'gestor',
            entidade_id: null,
            clinica_id: null,
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);
      // UPDATE usuarios
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(200);
      // Apenas 2 queries — sem upsert por falta de entidade_id
      expect(mockQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe('Sucesso — representante', () => {
    it('deve confirmar reset e ativar representante', async () => {
      // SELECT FOR UPDATE — usuarios: vazio
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // SELECT FOR UPDATE — representantes: encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 99,
            tipo: 'representante',
            tipo_usuario: null,
            reset_token_expira_em: setesDias.toISOString(),
            reset_tentativas_falhas: 0,
            reset_usado_em: null,
          },
        ],
        rowCount: 1,
      } as any);
      // UPDATE representantes
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
      // INSERT INTO representantes_senhas
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

      const res = await POST(
        makeRequest({
          token: TOKEN_VALIDO,
          senha: SENHA_VALIDA,
          confirmacao: SENHA_VALIDA,
        })
      );
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });
  });
});
