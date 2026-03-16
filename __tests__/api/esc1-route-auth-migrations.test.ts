/**
 * @file __tests__/api/esc1-route-auth-migrations.test.ts
 * @description Testes de autorização para as rotas migradas (ESC-1)
 *
 * Verifica que as rotas migrantes de assertRoles/assertAuth
 * respondem corretamente para sessões inválidas e válidas.
 *
 * Estratégia: mock de @/lib/authorization/policies para isolar
 * a lógica de routing dos detalhes de implementação de auth.
 */

import { NextRequest } from 'next/server';
import { ApiErrorImpl } from '@/lib/application/handlers/api-handler';

// ─── Mocks globais ───────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
  requireEntity: jest.fn(),
}));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ip_address: '127.0.0.1',
    user_agent: 'test-agent',
  })),
}));
jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => () => null),
  RATE_LIMIT_CONFIGS: { auth: {} },
}));
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Mock centralized policies - controla comportamento nos testes
const mockAssertRoles = jest.fn();
const mockAssertAuth = jest.fn();
jest.mock('@/lib/authorization/policies', () => ({
  assertRoles: (...args: any[]) => mockAssertRoles(...args),
  assertAuth: (...args: any[]) => mockAssertAuth(...args),
  checkRoles: jest.fn(() => true),
  isApiError: (err: unknown) =>
    err instanceof Error && 'code' in err && 'status' in err,
  ROLES: {
    ADMIN: 'admin',
    RH: 'rh',
    GESTOR: 'gestor',
    EMISSOR: 'emissor',
    FUNCIONARIO: 'funcionario',
  },
}));

import { query } from '@/lib/db';
import { getSession, requireAuth } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRhSession() {
  return {
    cpf: '12345678901',
    nome: 'RH Teste',
    perfil: 'rh' as const,
    clinica_id: 1,
  };
}

function makeGestorSession() {
  return {
    cpf: '98765432100',
    nome: 'Gestor Teste',
    perfil: 'gestor' as const,
    entidade_id: 5,
  };
}

function throwForbidden() {
  const err = new ApiErrorImpl('Acesso negado', 'FORBIDDEN', 403);
  throw err;
}

function throwUnauthorized() {
  const err = new ApiErrorImpl('Autenticação requerida', 'UNAUTHORIZED', 401);
  throw err;
}

beforeEach(() => {
  jest.clearAllMocks();
  // mockReset limpa filas "once" sem afetar outros mocks de módulo
  mockAssertRoles.mockReset();
  mockAssertAuth.mockReset();
  mockAssertRoles.mockImplementation(() => {}); // padrão: não lança
  mockAssertAuth.mockImplementation(() => {}); // padrão: não lança
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/trocar-senha
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/auth/trocar-senha', () => {
  let POST: (req: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/auth/trocar-senha/route');
    POST = mod.POST;
  });

  const makeReq = (body: any) =>
    new Request('http://localhost/api/auth/trocar-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('deve retornar 401 quando não autenticado', async () => {
    mockGetSession.mockReturnValue(null);
    mockAssertRoles.mockImplementationOnce(throwUnauthorized);

    const res = await POST(makeReq({ senha_atual: 'old', nova_senha: 'new' }));
    expect(res.status).toBe(401);
  });

  it('deve retornar 403 quando perfil não autorizado', async () => {
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      perfil: 'admin',
    } as any);
    mockAssertRoles.mockImplementationOnce(throwForbidden);

    const res = await POST(makeReq({ senha_atual: 'old', nova_senha: 'new' }));
    expect(res.status).toBe(403);
  });

  it('deve retornar 400 quando senha_atual não fornecida', async () => {
    mockGetSession.mockReturnValue(makeRhSession() as any);
    // assertRoles não lança — sessão válida
    const res = await POST(makeReq({ nova_senha: 'novasenha123' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('obrigatória');
  });

  it('deve retornar 400 quando nova senha muito curta', async () => {
    mockGetSession.mockReturnValue(makeRhSession() as any);
    const res = await POST(makeReq({ senha_atual: 'velha', nova_senha: '123' }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('mínimo');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/entidade/lote/[id]
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/entidade/lote/[id]', () => {
  let GET: (req: Request, ctx: any) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/entidade/lote/[id]/route');
    GET = mod.GET;
  });

  const makeCtx = (id: string) => ({ params: { id } });

  it('deve retornar 401 quando não autenticado', async () => {
    mockGetSession.mockReturnValue(null);
    mockAssertRoles.mockImplementationOnce(throwUnauthorized);

    const res = await GET(
      new Request('http://localhost/api/entidade/lote/1'),
      makeCtx('1')
    );
    expect(res.status).toBe(401);
  });

  it('deve retornar 404 quando lote não encontrado', async () => {
    mockGetSession.mockReturnValue(makeGestorSession() as any);
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);

    const res = await GET(
      new Request('http://localhost/api/entidade/lote/999'),
      makeCtx('999')
    );
    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notificacoes/contagem
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/notificacoes/contagem', () => {
  let GET: () => Promise<Response>;

  jest.mock('@/lib/notification-service', () => ({
    NotificationService: {
      contarNaoLidas: jest.fn(),
    },
  }));

  beforeAll(async () => {
    const mod = await import('@/app/api/notificacoes/contagem/route');
    GET = mod.GET;
  });

  it('deve retornar 401 quando não autenticado', async () => {
    mockGetSession.mockReturnValue(null);
    mockAssertAuth.mockImplementationOnce(throwUnauthorized);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('deve retornar 200 com total quando autenticado', async () => {
    mockGetSession.mockReturnValue(makeRhSession() as any);
    const { NotificationService } = jest.requireMock(
      '@/lib/notification-service'
    );
    NotificationService.contarNaoLidas.mockResolvedValueOnce({
      total_nao_lidas: 5,
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.total_nao_lidas).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/rh/funcionarios/[cpf]
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/rh/funcionarios/[cpf]', () => {
  let GET: (req: NextRequest, ctx: any) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/rh/funcionarios/[cpf]/route');
    GET = mod.GET;
  });

  const makeReq = (cpf: string) =>
    new NextRequest(`http://localhost/api/rh/funcionarios/${cpf}`);

  const makeCtx = (cpf: string) => ({
    params: Promise.resolve({ cpf }),
  });

  it('deve retornar 401 quando não autenticado', async () => {
    mockRequireAuth.mockRejectedValueOnce(
      new ApiErrorImpl('Autenticação requerida', 'UNAUTHORIZED', 401)
    );
    mockAssertRoles.mockImplementationOnce(throwUnauthorized);

    const res = await GET(makeReq('12345678901'), makeCtx('12345678901'));
    expect(res.status).toBe(401);
  });

  it('deve retornar dados do funcionário para RH autorizado', async () => {
    mockRequireAuth.mockResolvedValue(makeRhSession() as any);
    // assertRoles não lança
    // 1ª query: dados do funcionário
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '12345678901',
          nome: 'João',
          setor: 'TI',
          clinica_nome: 'Clínica X',
          empresa_nome: 'Empresa Y',
          empresa_id: 1,
          indice_avaliacao: 1,
          data_ultimo_lote: null,
        },
      ],
      rowCount: 1,
    } as any);
    // 2ª query: histórico de avaliações
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    } as any);

    const res = await GET(makeReq('12345678901'), makeCtx('12345678901'));
    expect(res.status).toBe(200);
  });
});
