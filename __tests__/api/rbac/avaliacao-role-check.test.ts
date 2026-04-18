/**
 * @file __tests__/api/rbac/avaliacao-role-check.test.ts
 *
 * Verifica que rotas /api/avaliacao/* exigem perfil='funcionario'.
 * Qualquer outro perfil autenticado deve receber 403 Forbidden.
 */

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  getSession: jest.fn(),
}));
jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
  transactionWithContext: jest.fn(),
}));
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/questoes', () => ({
  grupos: [{ id: 1, itens: [{ id: 'Q1' }], dominio: 'D', tipo: 'normal' }],
}));
jest.mock('@/lib/avaliacao-conclusao', () => ({
  verificarEConcluirAvaliacao: jest.fn(),
}));
jest.mock('@/lib/calculate', () => ({ calcularResultados: jest.fn() }));
jest.mock('@/lib/lotes', () => ({ recalcularStatusLote: jest.fn() }));
jest.mock('@/lib/types/avaliacao-status', () => ({
  validarTransicaoStatusAvaliacao: jest.fn(() => true),
}));

import * as sessionLib from '@/lib/session';

const mockRequireAuth = sessionLib.requireAuth as jest.MockedFunction<
  typeof sessionLib.requireAuth
>;
const mockGetSession = sessionLib.getSession as jest.MockedFunction<
  typeof sessionLib.getSession
>;

function makeRequest(url = 'http://localhost/', body?: object): Request {
  return {
    url,
    json: jest.fn().mockResolvedValue(body ?? {}),
  } as unknown as Request;
}

function sessionFor(perfil: string) {
  return { cpf: '99999999999', nome: 'Test', perfil } as any;
}

const BLOCKED_PERFIS = ['admin', 'rh', 'gestor', 'emissor', 'suporte', 'comercial', 'vendedor', 'representante'];

describe('RBAC: /api/avaliacao/* exige perfil=funcionario', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /api/avaliacao/todas', () => {
    const { GET } = require('@/app/api/avaliacao/todas/route');

    it('200 para funcionario', async () => {
      mockRequireAuth.mockResolvedValue(sessionFor('funcionario'));
      const { queryWithContext } = require('@/lib/db-security');
      (queryWithContext as jest.Mock).mockResolvedValue({ rows: [], rowCount: 0 });
      const res = await GET();
      expect(res.status).toBe(200);
    });

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockRequireAuth.mockResolvedValue(sessionFor(perfil));
      const res = await GET();
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/avaliacao/save', () => {
    const { POST } = require('@/app/api/avaliacao/save/route');

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockRequireAuth.mockResolvedValue(sessionFor(perfil));
      const res = await POST(makeRequest());
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/avaliacao/cascata', () => {
    const { POST } = require('@/app/api/avaliacao/cascata/route');

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockRequireAuth.mockResolvedValue(sessionFor(perfil));
      const res = await POST(makeRequest());
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/avaliacao/resultados', () => {
    const { GET } = require('@/app/api/avaliacao/resultados/route');

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockRequireAuth.mockResolvedValue(sessionFor(perfil));
      const res = await GET(makeRequest('http://localhost/api/avaliacao/resultados'));
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/avaliacao/respostas-all', () => {
    const { GET } = require('@/app/api/avaliacao/respostas-all/route');

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockRequireAuth.mockResolvedValue(sessionFor(perfil));
      const res = await GET(makeRequest('http://localhost/api/avaliacao/respostas-all'));
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/avaliacao/confirmar-identidade', () => {
    const { POST } = require('@/app/api/avaliacao/confirmar-identidade/route');

    it('200/400/404 para funcionario (depende de mock DB)', async () => {
      mockGetSession.mockReturnValue(sessionFor('funcionario'));
      const { query } = require('@/lib/db');
      (query as jest.Mock).mockResolvedValue({ rows: [], rowCount: 1 });
      const req = makeRequest(undefined, {
        avaliacaoId: 1,
        nome: 'Test User',
        cpf: '99999999999',
        dataNascimento: '1990-01-01',
      });
      const res = await POST(req);
      // Qualquer resposta que não seja 403 ou 401 indica que o role check passou
      expect(res.status).not.toBe(403);
      expect(res.status).not.toBe(401);
    });

    it.each(BLOCKED_PERFIS)('403 para perfil=%s', async (perfil) => {
      mockGetSession.mockReturnValue(sessionFor(perfil));
      const res = await POST(makeRequest());
      expect(res.status).toBe(403);
    });
  });
});
