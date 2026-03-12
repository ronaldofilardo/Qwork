/**
 * @fileoverview Testes do middleware para rotas de representante
 */

// Mock next/server before any import
const mockNextResponseNext = jest.fn(() => ({
  status: 200,
  headers: new Map(),
}));
const mockNextResponseRedirect = jest.fn((url: URL) => ({
  status: 307,
  headers: new Map([['location', url.toString()]]),
}));
const mockNextResponseJson = jest.fn((data: any, options?: any) => ({
  status: options?.status || 200,
  json: () => Promise.resolve(data),
  headers: new Map(),
}));

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: Object.assign(jest.fn(), {
    next: mockNextResponseNext,
    redirect: mockNextResponseRedirect,
    json: mockNextResponseJson,
  }),
}));

const { middleware } = require('@/middleware');

function makeReq(pathname: string, cookies: Record<string, string> = {}) {
  const headerMap = new Map([['x-forwarded-for', '127.0.0.1']]);
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

describe('Middleware — Rotas de Representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  // ─── Rotas públicas (não exigem auth) ──────────────────────────

  it('deve permitir /api/representante/login sem auth', () => {
    middleware(makeReq('/api/representante/login'));
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  it('deve permitir /api/representante/logout sem auth', () => {
    middleware(makeReq('/api/representante/logout'));
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  it('deve permitir /api/representante/cadastro sem auth', () => {
    middleware(makeReq('/api/representante/cadastro'));
    expect(mockNextResponseNext).toHaveBeenCalled();
  });

  // ─── Rotas protegidas do portal (/representante/*) ─────────────

  it('deve redirecionar /representante/dashboard sem rep-session para /login', () => {
    middleware(makeReq('/representante/dashboard'));
    expect(mockNextResponseRedirect).toHaveBeenCalled();
    const redirectUrl = mockNextResponseRedirect.mock.calls[0][0];
    expect(redirectUrl.toString()).toContain('/login');
    expect(redirectUrl.toString()).not.toContain('/representante/login');
  });

  it('deve redirecionar /representante/leads sem rep-session', () => {
    middleware(makeReq('/representante/leads'));
    expect(mockNextResponseRedirect).toHaveBeenCalled();
  });

  it('deve permitir /representante/dashboard com rep-session válida', () => {
    const repSession = JSON.stringify({ representante_id: 1, nome: 'Teste' });
    middleware(
      makeReq('/representante/dashboard', { 'rep-session': repSession })
    );
    // Should not redirect — should call next()
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it('deve permitir /representante/dashboard com bps-session de representante', () => {
    const bpsSession = JSON.stringify({
      representante_id: 2,
      perfil: 'representante',
    });
    middleware(
      makeReq('/representante/dashboard', { 'bps-session': bpsSession })
    );
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it('deve permitir /representante/login sem auth (rota legada — redireciona server-side)', () => {
    middleware(makeReq('/representante/login'));
    // A página legada não exige rep-session no middleware (é excluída)
    // A própria página faz o redirect server-side para /login
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });

  it('deve permitir /representante/cadastro sem auth (página pública)', () => {
    middleware(makeReq('/representante/cadastro'));
    expect(mockNextResponseRedirect).not.toHaveBeenCalled();
  });
});
