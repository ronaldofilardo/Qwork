/**
 * Testes para API /api/entidade/account-info
 * Simplificados para evitar complexidade excessiva de mocking
 */

import { NextRequest } from 'next/server';

// Mock do Next.js navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock da lib de sessão
jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
  getSession: jest.fn(),
  destroySession: jest.fn(),
}));

// Mock da lib de DB
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock do helper de parcelas
jest.mock('@/lib/parcelas-helper', () => ({
  calcularParcelas: jest.fn().mockReturnValue([]),
}));

describe('📊 API /api/entidade/account-info', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockSession = {
    contratante_id: 18,
    perfil: 'gestor_entidade',
    userId: 1,
  };

  const mockContratante = {
    id: 18,
    nome: 'RELEGERE',
    cnpj: '12345678000123',
    email: 'contato@relegere.com',
    telefone: '11999999999',
    endereco: 'Rua Teste, 123',
    cidade: 'São Paulo',
    estado: 'SP',
    criado_em: '2025-12-22T20:51:18.804Z',
  };

  describe('GET /api/entidade/account-info', () => {
    test('✅ Deve retornar dados da entidade', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockQuery = require('@/lib/db').query;

      mockGetSession.mockReturnValue(mockSession);

      mockQuery
        .mockResolvedValueOnce({ rows: [mockContratante] })
        .mockResolvedValueOnce({ rows: [{ column_name: 'preco' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ column_name: 'criado_em' }] })
        .mockResolvedValue({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.nome).toBe('RELEGERE');
      expect(data.cnpj).toBe('12345678000123');
      expect(data.email).toBe('contato@relegere.com');
      expect(data).toHaveProperty('contrato');
      expect(data).toHaveProperty('pagamentos');
    });

    test('✅ Deve filtrar apenas entidades (tipo = entidade)', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockQuery = require('@/lib/db').query;

      mockGetSession.mockReturnValue(mockSession);

      mockQuery
        .mockResolvedValueOnce({ rows: [mockContratante] })
        .mockResolvedValue({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      await GET(request);

      // Verificar que a query da entidade tem filtro tipo = 'entidade'
      expect(mockQuery).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("c.tipo = 'entidade'"),
        [18]
      );
    });

    test('❌ Deve retornar 404 para contratante inexistente', async () => {
      const mockGetSession = require('@/lib/session').getSession;
      const mockQuery = require('@/lib/db').query;

      mockGetSession.mockReturnValue(mockSession);
      mockQuery.mockResolvedValue({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Entidade não encontrada');
    });

    test('❌ Deve retornar 401 sem sessão válida', async () => {
      const mockGetSession = require('@/lib/session').getSession;

      mockGetSession.mockReturnValue(null);

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Não autorizado');
    });

    test('❌ Deve retornar 401 se perfil não for gestor_entidade', async () => {
      const mockGetSession = require('@/lib/session').getSession;

      mockGetSession.mockReturnValue({
        contratante_id: 18,
        perfil: 'rh',
        userId: 1,
      });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(401);
    });

    test('❌ Deve retornar 400 se não houver contratante_id na sessão', async () => {
      const mockGetSession = require('@/lib/session').getSession;

      mockGetSession.mockReturnValue({
        perfil: 'gestor_entidade',
        userId: 1,
      });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('Contratante não encontrado');
    });
  });
});
