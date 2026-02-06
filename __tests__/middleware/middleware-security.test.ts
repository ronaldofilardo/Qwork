// Jest globals available by default

// Mock completo do next/server ANTES de qualquer import
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
  redirect: jest.fn(() => ({ status: 302 })),
};

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: Object.assign(MockNextResponse, mockNextResponse),
}));

// Agora importar o middleware
const { middleware } = require('@/middleware');

describe('Middleware de Segurança', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment
    delete process.env.AUTHORIZED_ADMIN_IPS;
  });

  test('middleware deve ser uma função', () => {
    expect(typeof middleware).toBe('function');
  });

  test('deve permitir acesso a rotas não sensíveis', () => {
    const mockRequest = {
      nextUrl: { pathname: '/login' },
      headers: new Map(),
      cookies: { get: jest.fn() },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(200);
  });

  test('deve bloquear acesso a /api/admin sem IP autorizado', () => {
    process.env.AUTHORIZED_ADMIN_IPS = '192.168.1.1,10.0.0.1';

    const mockRequest = {
      nextUrl: { pathname: '/api/admin/funcionarios' },
      headers: new Map([['x-forwarded-for', '192.168.1.100']]),
      cookies: { get: jest.fn() },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(403);
  });

  test('deve permitir acesso a /api/admin com IP autorizado', () => {
    process.env.AUTHORIZED_ADMIN_IPS = '192.168.1.1,10.0.0.1';
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });

    const mockHeaders = new Map([
      ['x-forwarded-for', '192.168.1.1'],
      [
        'x-mock-session',
        JSON.stringify({ cpf: '00000000000', perfil: 'admin', clinica_id: 1 }),
      ],
    ]);
    const mockRequest = {
      nextUrl: { pathname: '/api/admin/funcionarios' },
      headers: {
        get: (key: string) => mockHeaders.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(200);
  });

  test('deve bloquear acesso a rotas sensíveis sem cookie de sessão', () => {
    const mockRequest = {
      nextUrl: { pathname: '/api/rh/lotes' },
      headers: new Map(),
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(401);
  });

  test('deve permitir acesso a rotas sensíveis com cookie de sessão', () => {
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
    const mockRequest = {
      nextUrl: { pathname: '/api/rh/lotes' },
      headers: {
        get: (key: string) => mockHeaders.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(200);
  });

  test('deve permitir acesso a /api/emissor com sessão', () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });
    const mockHeaders = new Map([
      [
        'x-mock-session',
        JSON.stringify({
          cpf: '33333333333',
          perfil: 'emissor',
          clinica_id: 1,
        }),
      ],
    ]);
    const mockRequest = {
      nextUrl: { pathname: '/api/emissor/lotes' },
      headers: {
        get: (key: string) => mockHeaders.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };
    const result = middleware(mockRequest as any);

    expect(result.status).toBe(200);
  });

  test('deve funcionar com diferentes headers de IP', () => {
    process.env.AUTHORIZED_ADMIN_IPS = '10.0.0.1';
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'test',
      writable: true,
    });

    // Teste com x-real-ip
    const mockHeaders1 = new Map([
      ['x-real-ip', '10.0.0.1'],
      [
        'x-mock-session',
        JSON.stringify({ cpf: '00000000000', perfil: 'admin', clinica_id: 1 }),
      ],
    ]);
    const mockRequest1 = {
      nextUrl: { pathname: '/api/admin/funcionarios' },
      headers: {
        get: (key: string) => mockHeaders1.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: undefined,
    };
    const result1 = middleware(mockRequest1 as any);
    expect(result1.status).toBe(200);

    // Teste com request.ip
    const mockHeaders2 = new Map([
      [
        'x-mock-session',
        JSON.stringify({ cpf: '00000000000', perfil: 'admin', clinica_id: 1 }),
      ],
    ]);
    const mockRequest2 = {
      nextUrl: { pathname: '/api/admin/funcionarios' },
      headers: {
        get: (key: string) => mockHeaders2.get(key) || null,
      },
      cookies: { get: jest.fn(() => null) },
      ip: '10.0.0.1',
    };
    const result2 = middleware(mockRequest2 as any);
    expect(result2.status).toBe(200);
  });

  describe('Segregação de Funções - Gestores vs Funcionários', () => {
    test('deve redirecionar gestor RH que tenta acessar /dashboard', () => {
      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
          href: 'http://localhost:3000/dashboard',
        },
        url: 'http://localhost:3000/dashboard',
        headers: new Map(),
        cookies: {
          get: jest.fn(() => ({
            value: JSON.stringify({
              cpf: '12345678901',
              perfil: 'rh',
              nome: 'Gestor RH',
            }),
          })),
        },
        ip: '192.168.1.1',
      };

      const result = middleware(mockRequest as any);
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/rh', 'http://localhost:3000/dashboard')
      );
    });

    test('deve redirecionar gestor de entidade que tenta acessar /dashboard', () => {
      const mockRequest = {
        nextUrl: {
          pathname: '/dashboard',
          href: 'http://localhost:3000/dashboard',
        },
        url: 'http://localhost:3000/dashboard',
        headers: new Map(),
        cookies: {
          get: jest.fn(() => ({
            value: JSON.stringify({
              cpf: '98765432100',
              perfil: 'gestor',
              nome: 'Gestor Entidade',
            }),
          })),
        },
        ip: '192.168.1.1',
      };

      const result = middleware(mockRequest as any);
      expect(mockNextResponse.redirect).toHaveBeenCalledWith(
        new URL('/entidade', 'http://localhost:3000/dashboard')
      );
    });

    test('deve permitir funcionário acessar /dashboard', () => {
      const mockRequest = {
        nextUrl: { pathname: '/dashboard' },
        headers: new Map(),
        cookies: {
          get: jest.fn(() => ({
            value: JSON.stringify({
              cpf: '11111111111',
              perfil: 'funcionario',
              nome: 'Funcionário',
            }),
          })),
        },
        ip: '192.168.1.1',
      };

      const result = middleware(mockRequest as any);
      expect(result.status).toBe(200);
    });

    test('deve bloquear funcionário tentando acessar /rh', () => {
      const mockRequest = {
        nextUrl: { pathname: '/rh' },
        headers: new Map(),
        cookies: {
          get: jest.fn(() => ({
            value: JSON.stringify({
              cpf: '11111111111',
              perfil: 'funcionario',
              nome: 'Funcionário',
            }),
          })),
        },
        ip: '192.168.1.1',
      };

      const result = middleware(mockRequest as any);
      expect(result.status).toBe(403);
    });

    test('deve bloquear funcionário tentando acessar /entidade', () => {
      const mockRequest = {
        nextUrl: { pathname: '/entidade' },
        headers: new Map(),
        cookies: {
          get: jest.fn(() => ({
            value: JSON.stringify({
              cpf: '11111111111',
              perfil: 'funcionario',
              nome: 'Funcionário',
            }),
          })),
        },
        ip: '192.168.1.1',
      };

      const result = middleware(mockRequest as any);
      expect(result.status).toBe(403);
    });
  });
});
