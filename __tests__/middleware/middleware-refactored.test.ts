/**
 * @file __tests__/middleware/middleware-refactored.test.ts
 * Testes: resolveSession, PERFIL_GUARDS, table-driven guards
 */

// Mock next/server antes de imports
const MockNextResponse = jest.fn().mockImplementation((body, options) => ({
  status: options?.status || 200,
  body,
}));

const mockNextResponse = {
  next: jest.fn(() => ({ status: 200 })),
  json: jest.fn((data, options) => ({
    status: options?.status || 200,
    json: () => Promise.resolve(data),
  })),
  redirect: jest.fn((url: URL) => ({
    status: 302,
    headers: new Map([['location', url.toString()]]),
  })),
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: Object.assign(MockNextResponse, mockNextResponse),
}));

const {
  middleware,
  resolveSession,
  PERFIL_GUARDS,
} = require('@/middleware');

// === Helper ===

function makeReq(
  pathname: string,
  cookies: Record<string, string> = {},
  headers: Record<string, string> = {}
) {
  const headerMap = new Map(Object.entries(headers));
  if (!headerMap.has('x-forwarded-for')) {
    headerMap.set('x-forwarded-for', '127.0.0.1');
  }
  return {
    nextUrl: { pathname },
    url: `http://localhost:3000${pathname}`,
    headers: {
      get: (name: string) => headerMap.get(name) ?? null,
    },
    cookies: {
      get: (name: string) => {
        const val = cookies[name];
        return val ? { value: val } : undefined;
      },
    },
    ip: '127.0.0.1',
  } as any;
}

// === Tests ===

describe('resolveSession', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  test('retorna sessão do cookie bps-session', () => {
    const session = { cpf: '12345678901', perfil: 'rh' };
    const req = makeReq('/rh', { 'bps-session': JSON.stringify(session) });
    const result = resolveSession(req);
    expect(result).toEqual(session);
  });

  test('retorna null para cookie inválido (JSON malformado)', () => {
    const req = makeReq('/rh', { 'bps-session': 'not-json' });
    const result = resolveSession(req);
    expect(result).toBeNull();
  });

  test('retorna null sem cookie nem mock-session', () => {
    const req = makeReq('/rh');
    const result = resolveSession(req);
    expect(result).toBeNull();
  });

  test('retorna sessão do x-mock-session em NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    const session = { cpf: '00000000000', perfil: 'admin' };
    const req = makeReq('/admin', {}, {
      'x-mock-session': JSON.stringify(session),
    });
    const result = resolveSession(req);
    expect(result).toEqual(session);
  });

  test('retorna sessão do x-mock-session em NODE_ENV=development', () => {
    process.env.NODE_ENV = 'development';
    const session = { cpf: '11111111111', perfil: 'gestor' };
    const req = makeReq('/entidade', {}, {
      'x-mock-session': JSON.stringify(session),
    });
    const result = resolveSession(req);
    expect(result).toEqual(session);
  });

  test('ignora x-mock-session em NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production';
    const req = makeReq('/admin', {}, {
      'x-mock-session': JSON.stringify({ perfil: 'admin' }),
    });
    const result = resolveSession(req);
    expect(result).toBeNull();
  });

  test('retorna null para x-mock-session com JSON inválido', () => {
    process.env.NODE_ENV = 'test';
    const req = makeReq('/admin', {}, { 'x-mock-session': '{bad-json' });
    const result = resolveSession(req);
    expect(result).toBeNull();
  });

  test('cookie tem prioridade sobre x-mock-session', () => {
    process.env.NODE_ENV = 'test';
    const cookieSession = { cpf: '11111111111', perfil: 'rh' };
    const mockSession = { cpf: '99999999999', perfil: 'admin' };
    const req = makeReq(
      '/rh',
      { 'bps-session': JSON.stringify(cookieSession) },
      { 'x-mock-session': JSON.stringify(mockSession) }
    );
    const result = resolveSession(req);
    expect(result).toEqual(cookieSession);
  });
});

describe('PERFIL_GUARDS', () => {
  test('contém 5 guards (RH, Entidade, Suporte, Comercial, Vendedor)', () => {
    expect(PERFIL_GUARDS).toHaveLength(5);
  });

  test.each([
    ['rh', 'RH'],
    ['gestor', 'Entidade'],
    ['suporte', 'Suporte'],
    ['comercial', 'Comercial'],
    ['vendedor', 'Vendedor'],
  ])('guard para perfil %s tem label %s', (perfil, label) => {
    const guard = PERFIL_GUARDS.find(
      (g: { perfil: string }) => g.perfil === perfil
    );
    expect(guard).toBeDefined();
    expect(guard.label).toBe(label);
  });

  test('cada guard tem pelo menos 2 rotas (página + API)', () => {
    for (const guard of PERFIL_GUARDS) {
      expect(guard.routes.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('Middleware — Segregação table-driven', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test.each([
    ['/rh', 'rh'],
    ['/api/rh/lotes', 'rh'],
    ['/entidade', 'gestor'],
    ['/api/entidade/lotes', 'gestor'],
    ['/suporte', 'suporte'],
    ['/api/suporte/tickets', 'suporte'],
    ['/comercial', 'comercial'],
    ['/api/comercial/leads', 'comercial'],
    ['/vendedor/dashboard', 'vendedor'],
    ['/api/vendedor/leads', 'vendedor'],
  ])('permite %s com perfil %s', (route, perfil) => {
    const session = { cpf: '12345678901', perfil };
    const req = makeReq(route, { 'bps-session': JSON.stringify(session) });
    const result = middleware(req);
    expect(result.status).toBe(200);
  });

  test.each([
    ['/rh', 'gestor', 'RH'],
    ['/rh', 'funcionario', 'RH'],
    ['/entidade', 'rh', 'Entidade'],
    ['/entidade', 'funcionario', 'Entidade'],
    ['/suporte', 'admin', 'Suporte'],
    ['/comercial', 'suporte', 'Comercial'],
    ['/vendedor', 'rh', 'Vendedor'],
  ])('bloqueia %s com perfil %s (guard %s)', (route, perfil) => {
    const session = { cpf: '12345678901', perfil };
    const req = makeReq(route, { 'bps-session': JSON.stringify(session) });
    const result = middleware(req);
    expect(result.status).toBe(403);
  });
});

describe('Middleware — Rotas públicas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test.each([
    '/api/auth/login',
    '/api/auth/logout',
    '/api/public/health',
    '/api/contratacao/cadastro-inicial',
    '/api/cadastro',
    '/vendedor/criar-senha',
    '/representante/criar-senha',
  ])('permite %s sem autenticação', (route) => {
    const req = makeReq(route);
    middleware(req);
    expect(mockNextResponse.next).toHaveBeenCalled();
  });
});

describe('Middleware — Contratação', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test('permite admin acessar /api/admin/contratacao', () => {
    const req = makeReq('/api/admin/contratacao', {
      'bps-session': JSON.stringify({ perfil: 'admin' }),
    });
    middleware(req);
    expect(mockNextResponse.next).toHaveBeenCalled();
  });

  test('bloqueia gestor em /api/admin/contratacao (403)', () => {
    const req = makeReq('/api/admin/contratacao', {
      'bps-session': JSON.stringify({ perfil: 'gestor' }),
    });
    const result = middleware(req);
    expect(result.status).toBe(403);
  });

  test('bloqueia acesso sem sessão a /api/admin/contratacao/pendentes (401)', () => {
    const req = makeReq('/api/admin/contratacao/pendentes');
    const result = middleware(req);
    expect(result.status).toBe(401);
  });
});

describe('Middleware — MFA', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test('bloqueia admin sem MFA em /api/admin/financeiro', () => {
    const req = makeReq('/api/admin/financeiro', {
      'bps-session': JSON.stringify({
        cpf: '00000000000',
        perfil: 'admin',
        mfaVerified: false,
      }),
    });
    middleware(req);
    expect(mockNextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'MFA_REQUIRED' }),
      { status: 403 }
    );
  });

  test('permite admin com MFA em /api/admin/financeiro', () => {
    const req = makeReq('/api/admin/financeiro', {
      'bps-session': JSON.stringify({
        cpf: '00000000000',
        perfil: 'admin',
        mfaVerified: true,
      }),
    });
    middleware(req);
    expect(mockNextResponse.json).not.toHaveBeenCalled();
    expect(mockNextResponse.next).toHaveBeenCalled();
  });
});

describe('Middleware — Funcionário vs Gestor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test('redireciona gestor RH de /dashboard para /rh', () => {
    const req = makeReq('/dashboard', {
      'bps-session': JSON.stringify({ cpf: '12345678901', perfil: 'rh' }),
    });
    middleware(req);
    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      new URL('/rh', 'http://localhost:3000/dashboard')
    );
  });

  test('redireciona gestor entidade de /dashboard para /entidade', () => {
    const req = makeReq('/dashboard', {
      'bps-session': JSON.stringify({ cpf: '98765432100', perfil: 'gestor' }),
    });
    middleware(req);
    expect(mockNextResponse.redirect).toHaveBeenCalledWith(
      new URL('/entidade', 'http://localhost:3000/dashboard')
    );
  });

  test('permite funcionário acessar /dashboard', () => {
    const req = makeReq('/dashboard', {
      'bps-session': JSON.stringify({ cpf: '55555555555', perfil: 'funcionario' }),
    });
    const result = middleware(req);
    expect(result.status).toBe(200);
    expect(mockNextResponse.redirect).not.toHaveBeenCalled();
  });
});
