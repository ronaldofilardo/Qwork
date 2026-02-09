import { queryWithContext } from '@/lib/db-security';

const mockQuery = jest.fn();
const mockGetSession = jest.fn();

jest.mock('@/lib/db', () => ({
  query: (...args: any[]) => mockQuery(...args),
}));

jest.mock('@/lib/session', () => ({
  getSession: () => mockGetSession(),
}));

describe('db-security.queryWithContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve setar app.current_user_clinica_id quando perfil for rh', async () => {
    // Simular sessão RH
    mockGetSession.mockReturnValue({
      cpf: '11111111111',
      perfil: 'rh',
      clinica_id: 10,
    });

    // Implementação de mock que responde adequadamente às consultas esperadas
    mockQuery.mockImplementation((sql: string, params?: any[]) => {
      if (sql.includes('SELECT cpf, perfil, ativo')) {
        return Promise.resolve({
          rows: [
            { cpf: '11111111111', perfil: 'rh', ativo: true, clinica_id: 10 },
          ],
          rowCount: 1,
        });
      }
      // set_config, retornos genéricos
      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    await queryWithContext('SELECT 1');

    // Verificar que set_config para clinica foi chamada
    expect(
      mockQuery.mock.calls.some(
        (c) =>
          c[0].includes('set_config') &&
          c[1][0] === 'app.current_user_clinica_id'
      )
    ).toBe(true);
  });

  it('deve setar app.current_user_tomador_id quando perfil for gestor', async () => {
    // Simular sessão gestor
    mockGetSession.mockReturnValue({
      cpf: '22222222222',
      perfil: 'gestor',
      tomador_id: 42,
    });

    mockQuery.mockImplementation((sql: string, params?: any[]) => {
      // Para validacao de gestor, validateSessionContext consulta entidades_senhas/tomadors
      if (sql.includes('FROM entidades_senhas')) {
        return Promise.resolve({
          rows: [{ cpf: '22222222222', tomador_id: 42, ativa: true }],
          rowCount: 1,
        });
      }

      return Promise.resolve({ rows: [], rowCount: 0 });
    });

    await queryWithContext('SELECT 1');

    // Verificar que set_config para tomador foi chamada
    expect(
      mockQuery.mock.calls.some(
        (c) =>
          c[0].includes('set_config') &&
          c[1][0] === 'app.current_user_tomador_id'
      )
    ).toBe(true);
  });
});
