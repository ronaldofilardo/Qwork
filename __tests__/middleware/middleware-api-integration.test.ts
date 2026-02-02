// Jest globals available by default
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/rh/lotes/route';
import { middleware } from '@/middleware';

// Mock do next/server
jest.mock('next/server', () => {
  class MockNextRequest {
    url: string;
    method: string;
    headers: Map<string, string>;
    constructor(url?: string) {
      this.url = url || 'http://localhost/';
      this.method = 'GET';
      this.headers = new Map();
    }
  }
  function NextResponse(body?: any, options?: any) {
    return { status: options?.status || 200, body };
  }
  NextResponse.next = () => ({ status: 200 });
  NextResponse.json = (data: any, options?: any) => ({
    status: options?.status || 200,
    json: () => Promise.resolve(data),
  });
  NextResponse.redirect = () => ({ status: 302 });
  return { NextRequest: MockNextRequest, NextResponse };
});

// Agora importar o middleware
const { middleware: middlewareFunc } = require('@/middleware');

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

const mockRequireAuth = require('@/lib/session').requireAuth;
const mockQueryWithContext = require('@/lib/db-security').queryWithContext;

describe('Integração Middleware + API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test('middleware deve bloquear acesso direto a rota sensível sem sessão', () => {
    const request = {
      nextUrl: { pathname: '/api/rh/lotes' },
      headers: new Map(),
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };

    const result = middlewareFunc(request as any);

    expect(result.status).toBe(401);
  });

  test('middleware deve permitir acesso a rota sensível com sessão', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });
    const mockHeaders = new Map([
      [
        'x-mock-session',
        JSON.stringify({ cpf: '11111111111', perfil: 'rh', clinica_id: 1 }),
      ],
    ]);
    const request = {
      nextUrl: { pathname: '/api/rh/lotes' },
      headers: {
        get: (key: string) => mockHeaders.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };

    const result = middlewareFunc(request as any);

    expect(result.status).toBe(200);
  });

  test('middleware deve bloquear admin sem IP autorizado', () => {
    process.env.AUTHORIZED_ADMIN_IPS = '10.0.0.1';

    const request = {
      nextUrl: { pathname: '/api/admin/funcionarios' },
      headers: new Map([['x-forwarded-for', '192.168.1.1']]),
      cookies: {
        get: jest.fn((name) =>
          name === 'bps-session' ? { value: 'valid-session' } : null
        ),
      },
      ip: undefined,
    };

    const result = middlewareFunc(request as any);

    expect(result.status).toBe(403);
  });

  test('fluxo completo: middleware permite + API processa com auth válida', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });
    // 1. Middleware permite acesso
    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );
    const mockHeaders = new Map([
      [
        'x-mock-session',
        JSON.stringify({ cpf: '12345678901', perfil: 'rh', clinica_id: 1 }),
      ],
    ]);
    Object.defineProperty(request, 'cookies', {
      value: { get: jest.fn(() => null) },
      writable: false,
    });
    Object.defineProperty(request, 'headers', {
      value: {
        get: (key: string) => mockHeaders.get(key) || null,
      },
      writable: false,
    });

    const middlewareResult = middlewareFunc(request as any);
    expect(middlewareResult.status).toBe(200);

    // 2. API processa normalmente
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      perfil: 'rh',
      clinica_id: 1,
    });

    mockQueryWithContext.mockResolvedValue({
      rows: [
        { id: 1, clinica_id: 1, empresa_id: 1 },
        { id: 2, clinica_id: 1, empresa_id: 1 },
      ],
      rowCount: 2,
    });

    const apiResponse = await GET(request);
    const data = await apiResponse.json();

    expect(apiResponse.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRequireAuth).toHaveBeenCalled();
    expect(mockQueryWithContext).toHaveBeenCalled();
  });

  test('fluxo completo: middleware bloqueia + API nem é chamada', async () => {
    // 1. Middleware bloqueia acesso
    const request = new NextRequest('http://localhost:3000/api/rh/lotes');
    Object.defineProperty(request, 'cookies', {
      value: { get: jest.fn(() => null) },
      writable: false,
    });

    const middlewareResult = middlewareFunc(request as any);
    expect(middlewareResult.status).toBe(401);

    // 2. API não deveria ser chamada (mas vamos testar se ela falha graciosamente)
    mockRequireAuth.mockRejectedValue(new Error('No session'));

    const apiResponse = await GET(request);
    const data = await apiResponse.json();

    expect(apiResponse.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  test('middleware permite rotas não sensíveis', () => {
    const routesNaoSensiveis = [
      '/login',
      '/api/auth/login',
      '/api/auth/session',
      '/dashboard',
      '/avaliacao',
    ];

    routesNaoSensiveis.forEach((route) => {
      const request = {
        nextUrl: { pathname: route },
        headers: new Map(),
        cookies: { get: jest.fn() },
        ip: undefined,
      };
      const result = middleware(request as any);
      expect(result.status).toBe(200);
    });
  });

  test('middleware bloqueia todas as rotas sensíveis sem sessão', () => {
    const rotasSensiveis = [
      '/api/admin/funcionarios',
      '/api/rh/lotes',
      '/api/emissor/laudos',
      '/admin/dashboard',
      '/rh/empresa/1',
    ];

    rotasSensiveis.forEach((route) => {
      const request = {
        nextUrl: { pathname: route },
        headers: new Map(),
        cookies: { get: jest.fn(() => null) },
        ip: undefined,
      };

      const result = middlewareFunc(request as any);
      expect(result.status).toBe(401);
    });
  });
});
