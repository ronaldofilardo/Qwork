import * as db from '@/lib/db';
import { criarContaResponsavel } from '@/lib/db';

describe('criarContaResponsavel - cria clínica se ausente', () => {
  const realQuery = db.query;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    // restore if we replaced
    (db.query as any) = realQuery;
  });

  it('deve tentar criar clinica quando não existe para a entidade', async () => {
    // Mock sequencial responses based on sql snippets
    const mockQuery = jest
      .spyOn(db, 'query')
      .mockImplementation(async (sql: string, params?: any[]) => {
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
          // simulate no clinic present
          return { rows: [], rowCount: 0 };
        }
        if (sql.includes('INSERT INTO clinicas')) {
          return { rows: [{ id: 999 }], rowCount: 1 };
        }
        // default: harmless success
        return { rows: [], rowCount: 0 };
      });

    await criarContaResponsavel(123 as any);

    // assert we attempted to create clinic
    expect(
      mockQuery.mock.calls.some((c) =>
        String(c[0]).includes('INSERT INTO clinicas')
      )
    ).toBe(true);
  });
});
