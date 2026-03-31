/**
 * Testes unitários: GET /api/funcionarios/[cpf] — formatação de data_nascimento
 *
 * Contexto do bug corrigido:
 *   Antes: new Date("2001-01-01").getDate() em UTC-3 retornava 31 (dia anterior)
 *   Depois: getUTCDate() retorna 1 corretamente, independente do fuso do servidor
 *
 * Cobre:
 * - Data "2001-01-01" deve ser retornada como "2001-01-01" (não "2000-12-31")
 * - Data "2000-12-31" deve ser retornada como "2000-12-31"
 * - Data com timestamp ISO "2001-01-01T00:00:00.000Z" deve ser normalizada para "2001-01-01"
 * - Data null deve retornar null
 * - Data em ano bissexto "2000-02-29" deve ser retornada corretamente
 * - 401 quando não há sessão
 * - 403 quando funcionário tenta acessar dados de outro CPF
 * - 404 quando CPF não encontrado
 */

const mockAssertAuth = jest.fn();

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/authorization/policies', () => ({
  assertAuth: (...args: unknown[]) => mockAssertAuth(...args),
  isApiError: (err: unknown) =>
    err instanceof Error && 'code' in err && 'status' in err,
}));

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { ApiErrorImpl } from '@/lib/application/handlers/api-handler';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

function makeRequest(cpf: string) {
  return new Request(`http://localhost:3000/api/funcionarios/${cpf}`);
}

function mockFuncionarioBase(
  overrides: Partial<{
    cpf: string;
    nome: string;
    data_nascimento: string | null;
  }> = {}
) {
  return {
    cpf: '97687700074',
    nome: 'Entidade masc',
    email: 'teste@email.com',
    setor: 'TI',
    funcao: 'Dev',
    data_nascimento: '2001-01-01',
    nivel_cargo: 'junior',
    ativo: true,
    criado_em: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function mockFuncionarioSession(cpf = '97687700074') {
  return {
    cpf,
    nome: 'Entidade masc',
    perfil: 'funcionario' as const,
  };
}

describe('GET /api/funcionarios/[cpf] — formatação data_nascimento (UTC)', () => {
  let GET: (
    request: Request,
    ctx: { params: { cpf: string } }
  ) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/funcionarios/[cpf]/route');
    GET = mod.GET;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAssertAuth.mockImplementation(() => {}); // padrão: não lança
  });

  // ─── Bug corrigido: fuso horário UTC ──────────────────────────────────────

  it('deve retornar "2001-01-01" para data_nascimento "2001-01-01" (bug UTC corrigido)', async () => {
    // Arrange — sem a correção, UTC-3 retornaria "2000-12-31"
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('97687700074') as any
    );
    mockQuery.mockResolvedValue({
      rows: [mockFuncionarioBase({ data_nascimento: '2001-01-01' })],
    } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data_nascimento).toBe('2001-01-01');
  });

  it('deve retornar "2001-01-01" para timestamp ISO "2001-01-01T00:00:00.000Z"', async () => {
    // Arrange — timestamp com Z, deve comportar igual
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('97687700074') as any
    );
    mockQuery.mockResolvedValue({
      rows: [
        mockFuncionarioBase({ data_nascimento: '2001-01-01T00:00:00.000Z' }),
      ],
    } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data_nascimento).toBe('2001-01-01');
  });

  it('deve retornar "2000-12-31" para data_nascimento "2000-12-31"', async () => {
    // Arrange
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('97687700074') as any
    );
    mockQuery.mockResolvedValue({
      rows: [mockFuncionarioBase({ data_nascimento: '2000-12-31' })],
    } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data_nascimento).toBe('2000-12-31');
  });

  it('deve retornar "2000-02-29" para ano bissexto', async () => {
    // Arrange
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('97687700074') as any
    );
    mockQuery.mockResolvedValue({
      rows: [mockFuncionarioBase({ data_nascimento: '2000-02-29' })],
    } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data_nascimento).toBe('2000-02-29');
  });

  it('deve retornar data_nascimento null quando não cadastrada', async () => {
    // Arrange
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('97687700074') as any
    );
    mockQuery.mockResolvedValue({
      rows: [mockFuncionarioBase({ data_nascimento: null })],
    } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data_nascimento).toBeNull();
  });

  // ─── Autenticação e autorização ───────────────────────────────────────────

  it('deve retornar 401 quando assertAuth lança erro de não autenticado', async () => {
    // Arrange
    mockGetSession.mockReturnValue(null);
    mockAssertAuth.mockImplementation(() => {
      throw new ApiErrorImpl('Autenticação requerida', 'UNAUTHORIZED', 401);
    });

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 quando funcionário tenta acessar dados de outro CPF', async () => {
    // Arrange — sessão de funcionário com CPF diferente do solicitado
    mockGetSession.mockReturnValue(
      mockFuncionarioSession('11111111111') as any
    );
    mockAssertAuth.mockImplementation(() => {}); // sessão válida

    // Act
    const res = await GET(makeRequest('99999999999'), {
      params: { cpf: '99999999999' },
    } as any);

    // Assert
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/sem permissão/i);
  });

  it('deve retornar 404 quando CPF não encontrado', async () => {
    // Arrange — RH tem permissão de acessar qualquer funcionário
    mockGetSession.mockReturnValue({
      cpf: '11111111111',
      nome: 'RH',
      perfil: 'rh' as const,
      clinica_id: 1,
    } as any);
    mockQuery.mockResolvedValue({ rows: [] } as any);

    // Act
    const res = await GET(makeRequest('97687700074'), {
      params: { cpf: '97687700074' },
    } as any);

    // Assert
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toMatch(/não encontrado/i);
  });
});
