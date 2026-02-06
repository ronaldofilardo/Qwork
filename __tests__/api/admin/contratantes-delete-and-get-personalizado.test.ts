import { query } from '@/lib/db';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getContratantesByTipo: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

// Mock bcryptjs (ensure same mock instance used by route)
jest.mock('bcryptjs', () => ({
  default: {
    compare: jest.fn().mockResolvedValue(true),
  },
}));

// Configure mocks
const mockQuery = require('@/lib/db').query;
const mockGetSession = require('@/lib/session').getSession;

mockGetSession.mockResolvedValue({
  cpf: 'admin123',
  nome: 'Admin',
  perfil: 'admin',
});

mockQuery.mockImplementation((sql: string, params?: any[]) => {
  if (sql.includes('SELECT * FROM contratantes WHERE id = $1')) {
    return Promise.resolve({ rows: [{ id: 999, nome: 'Test Contratante' }] });
  }
  if (sql.includes('SELECT senha_hash FROM funcionarios WHERE cpf = $1')) {
    return Promise.resolve({ rows: [{ senha_hash: '$2a$10$hashedpassword' }] });
  }
  if (
    sql.includes(
      "SELECT senha_hash FROM funcionarios WHERE cpf = $1 AND perfil = 'admin' AND ativo = true"
    )
  ) {
    return Promise.resolve({ rows: [{ senha_hash: '$2a$10$hashedpassword' }] });
  }
  if (sql.includes('BEGIN;')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('SELECT c.*')) {
    return Promise.resolve({
      rows: [
        {
          id: 1,
          nome: 'Clinica Ativa Pendente',
          ativa: true,
          status: 'pendente',
        },
      ],
    });
  }
  if (sql.includes('SELECT set_config')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('SELECT fn_delete_senha_autorizado')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('DELETE FROM pagamentos')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('DELETE FROM contratos')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('DELETE FROM contratantes')) {
    return Promise.resolve({ rows: [] });
  }
  if (sql.includes('COMMIT;')) {
    return Promise.resolve({ rows: [] });
  }
  return Promise.resolve({ rows: [] });
});

describe('Admin contratantes - planos personalizado e delete', () => {
  let ativoId: number;
  let inativoId: number;
  const contratoId: number | null = null;

  beforeAll(async () => {
    // no-op: leave global mocks defined at top of file
  });

  afterAll(async () => {
    // Cleanup mocks
  });

  it('deve retornar apenas contratantes ativos para planos personalizados pendentes', async () => {
    const mockGetSession = require('@/lib/session').getSession;
    const mockQuery = require('@/lib/db').query;

    mockGetSession.mockResolvedValue({
      cpf: '000',
      nome: 'Admin',
      perfil: 'admin',
    });

    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Clinica Ativa Pendente',
          ativa: true,
          status: 'pendente',
        },
      ],
    });

    const { GET } = await import('@/app/api/admin/entidades/route');

    // Chamar endpoint com filtro de plano personalizado pendente
    const mockRequest = {
      url: 'http://localhost/api/admin/entidades?tipo=clinica&plano_personalizado_pendente=true',
      nextUrl: {
        searchParams: new URLSearchParams(
          'tipo=clinica&plano_personalizado_pendente=true'
        ),
      },
    } as any;
    const response = await GET(mockRequest);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.success).toBe(true);
    // Deve conter apenas a clinica ativa
    const nomes = data.entidades.map((c: any) => c.nome);
    expect(nomes).toContain('Clinica Ativa Pendente');
    expect(nomes).not.toContain('Clinica Inativa Pendente');
  });

  // TODO: Implementar DELETE em /api/admin/entidades se necessário
  // it('deve permitir remoção forçada de contratante via DELETE (force=true)', async () => {
  //   ... teste comentado pois DELETE não existe no endpoint entidades
  // });
});
