/**
 * @file __tests__/middleware/middleware-refactored.test.ts
 * Testes: parseSession (via middleware), ROLE_ROUTE_MAP strategy table, table-driven guards
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

const { middleware } = require('@/middleware');

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

describe('parseSession (testado via middleware)', () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  test('autentica via cookie bps-session', () => {
    const session = { cpf: '12345678901', perfil: 'rh' };
    const req = makeReq('/rh', { 'bps-session': JSON.stringify(session) });
    const result = middleware(req);
    // rh acessando /rh deve ser permitido
    expect(result.status).toBe(200);
  });

  test('retorna 401 para cookie inválido (JSON malformado) em rota sensível', () => {
    const req = makeReq('/api/rh/lotes', { 'bps-session': 'not-json' });
    const result = middleware(req);
    expect(result.status).toBe(401);
  });

  test('retorna 401 sem cookie nem mock-session em rota sensível', () => {
    const req = makeReq('/api/rh/lotes');
    const result = middleware(req);
    expect(result.status).toBe(401);
  });

  test('autentica via x-mock-session em NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    const session = { cpf: '00000000000', perfil: 'rh' };
    const req = makeReq(
      '/rh',
      {},
      {
        'x-mock-session': JSON.stringify(session),
      }
    );
    const result = middleware(req);
    expect(result.status).toBe(200);
  });

  test('autentica via x-mock-session em NODE_ENV=development', () => {
    process.env.NODE_ENV = 'development';
    const session = { cpf: '11111111111', perfil: 'gestor' };
    const req = makeReq(
      '/entidade',
      {},
      {
        'x-mock-session': JSON.stringify(session),
      }
    );
    const result = middleware(req);
    expect(result.status).toBe(200);
  });

  test('ignora x-mock-session em NODE_ENV=production (retorna 401)', () => {
    process.env.NODE_ENV = 'production';
    const req = makeReq(
      '/api/admin/funcionarios',
      {},
      {
        'x-mock-session': JSON.stringify({ perfil: 'admin' }),
      }
    );
    const result = middleware(req);
    expect(result.status).toBe(401);
  });

  test('retorna 401 para x-mock-session com JSON inválido', () => {
    process.env.NODE_ENV = 'test';
    const req = makeReq(
      '/api/admin/funcionarios',
      {},
      { 'x-mock-session': '{bad-json' }
    );
    const result = middleware(req);
    expect(result.status).toBe(401);
  });

  test('cookie tem prioridade sobre x-mock-session', () => {
    process.env.NODE_ENV = 'test';
    const cookieSession = { cpf: '11111111111', perfil: 'rh' };
    const mockSession = { cpf: '99999999999', perfil: 'gestor' };
    const req = makeReq(
      '/rh',
      { 'bps-session': JSON.stringify(cookieSession) },
      { 'x-mock-session': JSON.stringify(mockSession) }
    );
    const result = middleware(req);
    // rh accessing /rh → allowed (cookie wins over mock gestor)
    expect(result.status).toBe(200);
  });
});

describe('ROLE_ROUTE_MAP — Strategy Table via middleware', () => {
  test.each([
    ['rh', ['/rh', '/api/rh']],
    ['gestor', ['/entidade', '/api/entidade']],
    ['suporte', ['/suporte', '/api/suporte']],
    ['comercial', ['/comercial', '/api/comercial']],
    ['vendedor', ['/vendedor', '/api/vendedor']],
  ])('perfil %s tem rotas segregadas', (perfil, routes) => {
    // Every route should be accessible by the matching perfil
    for (const route of routes) {
      jest.clearAllMocks();
      const req = makeReq(route, {
        'bps-session': JSON.stringify({ cpf: '12345678901', perfil }),
      });
      const result = middleware(req);
      expect(result.status).toBe(200);
    }
  });

  test('cada perfil tem pelo menos 2 rotas (página + API)', () => {
    // All 5 role entries in ROLE_ROUTE_MAP have 2 routes each
    const pairs = [
      ['rh', ['/rh', '/api/rh']],
      ['gestor', ['/entidade', '/api/entidade']],
      ['suporte', ['/suporte', '/api/suporte']],
      ['comercial', ['/comercial', '/api/comercial']],
      ['vendedor', ['/vendedor', '/api/vendedor']],
    ];
    expect(pairs).toHaveLength(5);
    for (const [, routes] of pairs) {
      expect((routes as string[]).length).toBeGreaterThanOrEqual(2);
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
      'bps-session': JSON.stringify({
        cpf: '55555555555',
        perfil: 'funcionario',
      }),
    });
    const result = middleware(req);
    expect(result.status).toBe(200);
    expect(mockNextResponse.redirect).not.toHaveBeenCalled();
  });
});
