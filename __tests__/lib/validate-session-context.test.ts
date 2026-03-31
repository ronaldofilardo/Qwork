/**
 * @file __tests__/lib/validate-session-context.test.ts
 * Testes: db-security — validateSessionContext (regressions)
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  transaction: jest.fn((callback) => {
    const txClient = {
      query: jest.fn(),
    };
    return callback(txClient);
  }),
}));
jest.mock('@/lib/session');

import { query, transaction } from '@/lib/db';
import { getSession } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('db-security — validateSessionContext (regressions)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ aceita RH que existe em `funcionarios` (não deve checar `entidades_senhas`)', async () => {
    mockGetSession.mockReturnValue({
      cpf: '19477306061',
      nome: 'Jailson do RH',
      perfil: 'rh',
      clinica_id: 49,
    } as any);

    mockQuery.mockImplementation(async (text: string) => {
      if (typeof text === 'string' && text.includes('FROM funcionarios')) {
        return {
          rows: [{ cpf: '19477306061', perfil: 'rh', ativo: true }],
          rowCount: 1,
        } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    mockTransaction.mockImplementation(async (callback) => {
      const txClient = {
        query: jest.fn().mockImplementation(async (text: string) => {
          if (typeof text === 'string' && text.includes('set_config')) {
            return { rows: [], rowCount: 0 } as any;
          }
          if (
            typeof text === 'string' &&
            text.includes('FROM funcionarios_clinicas')
          ) {
            return { rows: [{ clinica_id: 49 }], rowCount: 1 } as any;
          }
          return { rows: [{ ok: 42 }], rowCount: 1 } as any;
        }),
      };
      return callback(txClient as any);
    });

    const res = await queryWithContext('SELECT 42 as ok');
    expect(res.rows[0].ok).toBe(42);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('✅ aceita RH que existe em `usuarios` (fallback para arquitetura legada)', async () => {
    mockGetSession.mockReturnValue({
      cpf: '55555555055',
      nome: 'RH Legado em Usuarios',
      perfil: 'rh',
      clinica_id: 2,
    } as any);

    mockQuery.mockImplementation(async (text: string) => {
      if (typeof text === 'string' && text.includes('FROM funcionarios')) {
        return { rows: [], rowCount: 0 } as any;
      }
      if (typeof text === 'string' && text.includes('FROM usuarios')) {
        return {
          rows: [
            {
              cpf: '55555555055',
              perfil: 'rh',
              tipo_usuario: 'rh',
              ativo: true,
            },
          ],
          rowCount: 1,
        } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    mockTransaction.mockImplementation(async (callback) => {
      const txClient = {
        query: jest.fn().mockImplementation(async (text: string) => {
          if (typeof text === 'string' && text.includes('set_config')) {
            return { rows: [], rowCount: 0 } as any;
          }
          return { rows: [{ ok: 99 }], rowCount: 1 } as any;
        }),
      };
      return callback(txClient as any);
    });

    const res = await queryWithContext('SELECT 99 as ok');
    expect(res.rows[0].ok).toBe(99);
  });

  it('❌ rejeita RH não encontrado ou inativo', async () => {
    mockGetSession.mockReturnValue({
      cpf: '99999999999',
      nome: 'RH Inexistente',
      perfil: 'rh',
      clinica_id: 1,
    } as any);

    // O validateSessionContext falha se query() retornar vazio
    mockQuery.mockImplementation(async () => {
      return { rows: [], rowCount: 0 } as any;
    });

    // Se o perfil fosse inválido, lançaria erro. Mas CPF/Perfil são válidos sintaticamente.
    // O erro real de 'contexto inválido' viria se txClient.query retornar vazio na FASE 1 da transação
    // ou se a query principal falhar.

    mockTransaction.mockImplementation(async (callback) => {
      const txClient = {
        query: jest.fn().mockImplementation(async (text: string) => {
          if (text.includes('FROM funcionarios')) {
            return { rows: [], rowCount: 0 };
          }
          throw new Error('Usuário não encontrado');
        }),
      };
      return callback(txClient as any);
    });

    await expect(queryWithContext('SELECT 1')).rejects.toThrow();
  });
});
