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
    responsavel_nome: 'João Silva',
    criado_em: '2025-12-22T20:51:18.804Z',
  };

  describe('GET /api/entidade/account-info', () => {
    test('✅ Deve retornar dados da entidade (campos mínimos cadastrais)', async () => {
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);
      // 1ª chamada: dados da entidade
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [mocktomador] });
      // 2ª chamada: representante vinculado — nenhum
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

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
      expect(data.telefone).toBe('11999999999');
      expect(data.endereco).toBe('Rua Teste, 123');
      expect(data.cidade).toBe('São Paulo');
      expect(data.estado).toBe('SP');
      expect(data.responsavel_nome).toBe('João Silva');
      expect(data.criado_em).toBe('2025-12-22T20:51:18.804Z');
      // representante null quando nenhum vínculo encontrado
      expect(data.representante).toBeNull();
    });

    test('✅ NÃO deve retornar status ou gestores da entidade', async () => {
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);
      // 1ª chamada: dados da entidade
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [mocktomador] });
      // 2ª chamada: representante — nenhum
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).not.toHaveProperty('status');
      expect(data).not.toHaveProperty('gestores');
      expect(data).not.toHaveProperty('contrato');
      expect(data).not.toHaveProperty('pagamentos');
    });

    test('✅ Deve retornar representante quando entidade possui vínculo ativo', async () => {
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);
      // 1ª chamada: dados da entidade
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [mocktomador] });
      // 2ª chamada: representante vinculado
      mockQueryAsGestorEntidade.mockResolvedValueOnce({
        rows: [{ nome: 'Rep Teste', email: 'rep@teste.com', telefone: '11988887777' }],
      });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.representante).not.toBeNull();
      expect(data.representante.nome).toBe('Rep Teste');
      expect(data.representante.email).toBe('rep@teste.com');
      expect(data.representante.telefone).toBe('11988887777');
    });

    test('✅ Deve retornar erro 404 se entidade não encontrada', async () => {
      const mockRequireEntity = require('@/lib/session').requireEntity;
      const mockQueryAsGestorEntidade =
        require('@/lib/db-gestor').queryAsGestorEntidade;

      mockRequireEntity.mockReturnValue(mockSession);
      mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [] });

      const { GET } = require('@/app/api/entidade/account-info/route');

      const request = new NextRequest(
        'http://localhost:3000/api/entidade/account-info'
      );
      const response = await GET(request);

      expect(response.status).toBe(404);
    });
  });
});
