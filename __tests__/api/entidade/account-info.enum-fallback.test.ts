/**
 * @file __tests__/api/entidade/account-info.enum-fallback.test.ts
 * Testes: 📌 API account-info — rota simplificada (dados cadastrais apenas)
 */

import { NextRequest } from 'next/server';

// Mocks
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn(),
}));

jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
}));

describe('📌 API account-info — rota simplificada (dados cadastrais apenas)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('✅ Deve retornar apenas dados cadastrais da entidade (sem contrato/pagamentos)', async () => {
    const mockRequireEntity = require('@/lib/session').requireEntity;
    const mockQueryAsGestorEntidade =
      require('@/lib/db-gestor').queryAsGestorEntidade;

    const mockSession = {
      entidade_id: 18,
      perfil: 'gestor',
      cpf: '12345678901',
    };
    const mockEntidade = {
      id: 18,
      nome: 'RELEGERE',
      cnpj: '12345678000123',
      email: 'releger@teste.com',
      telefone: '11999999999',
      endereco: 'Rua Teste, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      responsavel_nome: 'João Silva',
      criado_em: '2025-12-22T20:51:18.804Z',
      status: 'ativo', // Campo presente no BD mas NÃO retornado
    };

    mockRequireEntity.mockReturnValue(mockSession);
    mockQueryAsGestorEntidade.mockResolvedValueOnce({ rows: [mockEntidade] });

    const { GET } = require('@/app/api/entidade/account-info/route');

    const request = new NextRequest(
      'http://localhost:3000/api/entidade/account-info'
    );
    const response = await GET(request);
    const data = await response.json();

    // ✅ Deve retornar dados cadastrais
    expect(data.nome).toBe('RELEGERE');
    expect(data.cnpj).toBe('12345678000123');
    expect(data.email).toBe('releger@teste.com');
    expect(data.telefone).toBe('11999999999');
    expect(data.endereco).toBe('Rua Teste, 123');
    expect(data.cidade).toBe('São Paulo');
    expect(data.estado).toBe('SP');
    expect(data.responsavel_nome).toBe('João Silva');
    expect(data.criado_em).toBe('2025-12-22T20:51:18.804Z');

    // ✅ NÃO deve retornar status, contrato ou pagamentos
    expect(data).not.toHaveProperty('status');
    expect(data).not.toHaveProperty('contrato');
    expect(data).not.toHaveProperty('pagamentos');
    expect(data).not.toHaveProperty('gestores');
  });
});
