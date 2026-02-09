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
  requireEntity: jest.fn(),
}));

// Mock da lib de DB
jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
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
    tomador_id: 18,
    perfil: 'gestor',
    userId: 1,
  };

  const mocktomador = {
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
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);

      mockQueryAsGestorEntidade
        .mockResolvedValueOnce({ rows: [mocktomador] })
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
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);

      mockQueryAsGestorEntidade
        .mockResolvedValueOnce({ rows: [mocktomador] })
        .mockResolvedValue({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      await GET(request);

      // Verificar que a query da entidade tem filtro tipo = 'entidade'
      expect(mockQueryAsGestorEntidade).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining("e.tipo = 'entidade'"),
        [18]
      );
    });
  });
});
