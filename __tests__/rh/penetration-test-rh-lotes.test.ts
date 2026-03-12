/**
 * @file __tests__/rh/penetration-test-rh-lotes.test.ts
 * Testes: Penetration Test: Acesso não autorizado a /api/rh/lotes
 */

// Jest globals available by default
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/rh/lotes/route';

// Mock das dependências
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  getSession: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Usar import dinâmico para obter as funções mockadas
let mockRequireAuth: any;
let mockGetSession: any;
let mockRequireRHWithEmpresaAccess: any;
let mockQuery: any;

beforeAll(async () => {
  const sessionModule = await import('@/lib/session');
  const dbModule = await import('@/lib/db');

  mockRequireAuth = sessionModule.requireAuth;
  mockGetSession = sessionModule.getSession;
  mockRequireRHWithEmpresaAccess = (sessionModule as any)
    .requireRHWithEmpresaAccess;
  mockQuery = dbModule.query;
});

describe('Penetration Test: Acesso não autorizado a /api/rh/lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Funcionário não deve acessar lotes RH', async () => {
    // Simular sessão de funcionário
    mockGetSession.mockResolvedValue({
      cpf: '22222222222',
      perfil: 'funcionario',
      clinica_id: 1,
    });

    // requireAuth deve lançar erro para perfil incorreto
    mockRequireAuth.mockRejectedValue(
      new Error('Acesso negado: perfil insuficiente')
    );

    const request = new NextRequest('http://localhost:3000/api/rh/lotes');

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403); // Acesso negado
    expect(data.error).toContain('Acesso negado');
  });

  test('RH deve acessar lotes de sua clínica', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '33333333333',
      perfil: 'rh',
      clinica_id: 1,
    });

    mockRequireAuth.mockResolvedValue({
      cpf: '33333333333',
      perfil: 'rh',
      clinica_id: 1,
    });

    mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);

    // Primeira query: empresaCheck
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 1, clinica_id: 1 }],
        rowCount: 1,
      })
      // Segunda query: lotesQuery
      .mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    // A rota retorna { lotes: [...] } (sem campo success no 200)
    expect(data.lotes).toBeDefined();
    expect(mockQuery).toHaveBeenCalled();
  });

  test('Admin deve ter acesso restrito', async () => {
    mockGetSession.mockResolvedValue({
      cpf: '11111111111',
      perfil: 'admin',
      clinica_id: null, // Admin não tem clínica específica
    });

    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      perfil: 'admin',
      clinica_id: null,
    });

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );

    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Acesso negado');
  });
});
