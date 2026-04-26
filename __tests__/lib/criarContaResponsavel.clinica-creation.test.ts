/**
 * @file __tests__/lib/criarContaResponsavel.clinica-creation.test.ts
 * Testes: criarContaResponsavel - cria clínica se ausente
 */

const mockQueryFn = jest.fn();

jest.mock('@/lib/db/query', () => ({
  query: (...args: any[]) => mockQueryFn(...args),
}));

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  })),
  types: { setTypeParser: jest.fn() },
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed'),
  compare: jest.fn().mockResolvedValue(true),
}));

import { criarContaResponsavel } from '@/lib/db';

describe('criarContaResponsavel - cria clínica se ausente', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve tentar criar clinica quando não existe para a entidade', async () => {
    mockQueryFn.mockImplementation(async (sql: string, _params?: any[]) => {
      if (sql.includes('SELECT * FROM clinicas WHERE id = $1')) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('SELECT * FROM entidades WHERE id = $1')) {
        return {
          rows: [
            {
              id: 123,
              cnpj: '12345678000199',
              responsavel_cpf: '11122233344',
              nome: 'Clinica X',
              email: 'x@example.com',
              telefone: '1234',
              endereco: 'Rua A',
              tipo: 'clinica',
            },
          ],
          rowCount: 1,
        };
      }
      if (sql.includes('SELECT id FROM clinicas_senhas WHERE clinica_id')) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('SELECT id FROM funcionarios WHERE cpf = $1')) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('SELECT id FROM clinicas WHERE entidade_id = $1')) {
        return { rows: [], rowCount: 0 };
      }
      if (sql.includes('INSERT INTO clinicas')) {
        return { rows: [{ id: 999 }], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    });

    await criarContaResponsavel(123 as any);

    // assert we attempted to create clinic
    expect(
      mockQueryFn.mock.calls.some((c) =>
        String(c[0]).includes('INSERT INTO clinicas')
      )
    ).toBe(true);
  });
});
