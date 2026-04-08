/**
 * Testes de API para GET /api/admin/reset-senha/validar
 *
 * Rota pública — valida token de reset de senha.
 * Retorna { valido: true, nome, perfil } ou { valido: false, motivo }.
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/reset-senha/validar/route';

jest.mock('@/lib/db');

import { query } from '@/lib/db';
const mockQuery = query as jest.MockedFunction<typeof query>;

const TOKEN_VALIDO = 'b'.repeat(64);
const TOKEN_CURTO = 'abc';

function makeRequest(token?: string): NextRequest {
  const url = token
    ? `http://localhost/api/admin/reset-senha/validar?token=${token}`
    : `http://localhost/api/admin/reset-senha/validar`;
  return new NextRequest(url);
}

const agora = new Date();
const setesDias = new Date(agora.getTime() + 7 * 24 * 60 * 60 * 1000);

describe('GET /api/admin/reset-senha/validar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Validações básicas', () => {
    it('deve retornar 400 quando token não fornecido', async () => {
      const res = await GET(makeRequest());
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_invalido');
    });

    it('deve retornar 400 para token com comprimento diferente de 64', async () => {
      const res = await GET(makeRequest(TOKEN_CURTO));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_invalido');
    });
  });

  describe('Token de usuário (tabela usuarios)', () => {
    it('deve retornar { valido: true } para token válido de usuario', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          nome: 'Suporte Teste',
          tipo_usuario: 'suporte',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valido).toBe(true);
      expect(data.nome).toBe('Suporte Teste');
      expect(data.perfil).toBe('suporte');
    });

    it('deve retornar token_expirado quando token passou do prazo', async () => {
      const passado = new Date(agora.getTime() - 1000).toISOString();
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          nome: 'Suporte Teste',
          tipo_usuario: 'suporte',
          reset_token_expira_em: passado,
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_expirado');
    });

    it('deve retornar token_ja_usado quando reset_usado_em está preenchido', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          nome: 'Suporte Teste',
          tipo_usuario: 'suporte',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: agora.toISOString(),
        }],
        rowCount: 1,
      } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_ja_usado');
    });

    it('deve retornar token_bloqueado quando tentativas_falhas >= 5', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          cpf: '12345678909',
          nome: 'Suporte Teste',
          tipo_usuario: 'suporte',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 5,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_bloqueado');
    });
  });

  describe('Token de representante (tabela representantes)', () => {
    it('deve retornar { valido: true } para token de representante', async () => {
      // Tabela usuarios: sem resultado
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      // Tabela representantes: encontrado
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nome: 'Rep Teste',
          reset_token_expira_em: setesDias.toISOString(),
          reset_tentativas_falhas: 0,
          reset_usado_em: null,
        }],
        rowCount: 1,
      } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.valido).toBe(true);
      expect(data.perfil).toBe('representante');
    });
  });

  describe('Token inexistente', () => {
    it('deve retornar token_invalido quando token não existe em nenhuma tabela', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const res = await GET(makeRequest(TOKEN_VALIDO));
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.valido).toBe(false);
      expect(data.motivo).toBe('token_invalido');
    });
  });
});
