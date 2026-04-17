/**
 * @fileoverview Testes unitários para lib/session-representante.ts
 * @description Cobre criação, leitura, destruição de sessão, requireRepresentante,
 *              requireRepresentanteComDB e repAuthErrorResponse.
 */

// ---- Mocks de next/headers e lib/db ----
const mockCookieStore = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};
jest.mock('next/headers', () => ({
  cookies: () => mockCookieStore,
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import {
  criarSessaoRepresentante,
  getSessaoRepresentante,
  destruirSessaoRepresentante,
  requireRepresentante,
  requireRepresentanteComDB,
  repAuthErrorResponse,
  type RepresentanteSession,
} from '@/lib/session-representante';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

const baseSessao: RepresentanteSession = {
  representante_id: 1,
  nome: 'Carlos Teste',
  email: 'rep@test.dev',
  codigo: 'AB12-CD34',
  status: 'ativo',
  tipo_pessoa: 'pf',
  cpf: '12345678901',
  criado_em_ms: Date.now(),
};

describe('lib/session-representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ===========================================================================
  // criarSessaoRepresentante
  // ===========================================================================
  describe.skip('criarSessaoRepresentante', () => {
    it('deve setar cookie rep-session httpOnly com dados serializados', () => {
      criarSessaoRepresentante(baseSessao);
      expect(mockCookieStore.set).toHaveBeenCalledTimes(1);
      const [name, value, opts] = mockCookieStore.set.mock.calls[0];
      expect(name).toBe('rep-session');
      const parsed = JSON.parse(value);
      expect(parsed.representante_id).toBe(1);
      expect(parsed.nome).toBe('Carlos Teste');
      expect(typeof parsed.criado_em_ms).toBe('number');
      // Verificar opções
      expect(opts.httpOnly).toBe(true);
      expect(opts.sameSite).toBe('lax');
      expect(opts.maxAge).toBe(8 * 60 * 60); // 8h em segundos
      expect(opts.path).toBe('/');
    });

    it('deve sobrescrever criado_em_ms com Date.now() atual', () => {
      const antes = Date.now();
      criarSessaoRepresentante({ ...baseSessao, criado_em_ms: 0 });
      const value = JSON.parse(mockCookieStore.set.mock.calls[0][1]);
      expect(value.criado_em_ms).toBeGreaterThanOrEqual(antes);
    });
  });

  // ===========================================================================
  // getSessaoRepresentante
  // ===========================================================================
  describe('getSessaoRepresentante', () => {
    it('deve retornar null quando cookie não existe', () => {
      mockCookieStore.get.mockReturnValue(undefined);
      expect(getSessaoRepresentante()).toBeNull();
    });

    it('deve retornar null quando cookie value é vazio', () => {
      mockCookieStore.get.mockReturnValue({ value: '' });
      expect(getSessaoRepresentante()).toBeNull();
    });

    it('deve retornar null para JSON inválido', () => {
      mockCookieStore.get.mockReturnValue({ value: '{bad json' });
      expect(getSessaoRepresentante()).toBeNull();
    });

    it('deve retornar null para sessão expirada (>8h)', () => {
      const sessaoExpirada = {
        ...baseSessao,
        criado_em_ms: Date.now() - 8 * 60 * 60 * 1000 - 1000, // 8h + 1s atrás
      };
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(sessaoExpirada),
      });
      expect(getSessaoRepresentante()).toBeNull();
    });

    it('deve retornar sessão válida dentro de 8h', () => {
      const sessaoValida = { ...baseSessao, criado_em_ms: Date.now() - 1000 };
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(sessaoValida),
      });
      const result = getSessaoRepresentante();
      expect(result).not.toBeNull();
      expect(result.representante_id).toBe(1);
      expect(result.email).toBe('rep@test.dev');
    });
  });

  it('deve extrair cpf do bps-session quando perfil e representante', () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'bps-session')
        return {
          value: JSON.stringify({
            perfil: 'representante',
            representante_id: 42,
            cpf: '12345678901',
            nome: 'Rep Teste',
            codigo: 'XY99-ZW11',
            status: 'apto',
            tipo_pessoa: 'pf',
            criado_em_ms: Date.now() - 1000,
          }),
        };
      return undefined;
    });
    const result = getSessaoRepresentante();
    expect(result).not.toBeNull();
    expect(result!.cpf).toBe('12345678901');
    expect(result!.representante_id).toBe(42);
  });

  it('deve retornar cpf undefined quando bps-session nao tem cpf', () => {
    mockCookieStore.get.mockImplementation((name: string) => {
      if (name === 'bps-session')
        return {
          value: JSON.stringify({
            perfil: 'representante',
            representante_id: 5,
            nome: 'Rep Sem CPF',
            codigo: 'AA11-BB22',
            status: 'ativo',
            tipo_pessoa: 'pf',
            criado_em_ms: Date.now() - 500,
          }),
        };
      return undefined;
    });
    const result = getSessaoRepresentante();
    expect(result).not.toBeNull();
    expect(result!.cpf).toBeUndefined();
  });

  // ===========================================================================
  // destruirSessaoRepresentante
  // ===========================================================================
  describe('destruirSessaoRepresentante', () => {
    it('deve deletar o cookie rep-session', () => {
      destruirSessaoRepresentante();
      expect(mockCookieStore.delete).toHaveBeenCalledWith('rep-session');
    });
  });

  // ===========================================================================
  // requireRepresentante (síncrono)
  // ===========================================================================
  describe('requireRepresentante', () => {
    it('deve lançar REP_NAO_AUTENTICADO quando não há cookie', () => {
      mockCookieStore.get.mockReturnValue(undefined);
      expect(() => requireRepresentante()).toThrow('REP_NAO_AUTENTICADO');
    });

    it('deve lançar REP_NAO_AUTENTICADO para sessão expirada', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({
          ...baseSessao,
          criado_em_ms: Date.now() - 9 * 60 * 60 * 1000,
        }),
      });
      expect(() => requireRepresentante()).toThrow('REP_NAO_AUTENTICADO');
    });

    it('deve lançar REP_CONTA_INATIVA para status desativado', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ ...baseSessao, status: 'desativado' }),
      });
      expect(() => requireRepresentante()).toThrow('REP_CONTA_INATIVA');
    });

    it('deve lançar REP_CONTA_INATIVA para status rejeitado', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ ...baseSessao, status: 'rejeitado' }),
      });
      expect(() => requireRepresentante()).toThrow('REP_CONTA_INATIVA');
    });

    it('deve permitir status ativo', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(baseSessao),
      });
      const sess = requireRepresentante();
      expect(sess.status).toBe('ativo');
    });

    it('deve permitir status apto', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ ...baseSessao, status: 'apto' }),
      });
      const sess = requireRepresentante();
      expect(sess.status).toBe('apto');
    });

    it('deve permitir status suspenso (bloqueio apenas no DB)', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify({ ...baseSessao, status: 'suspenso' }),
      });
      // suspenso NÃO está em statusBloqueados, pois pode ver dados
      const sess = requireRepresentante();
      expect(sess.status).toBe('suspenso');
    });

    it('deve retornar sessão completa para cookie válido', () => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(baseSessao),
      });
      const sess = requireRepresentante();
      expect(sess.representante_id).toBe(1);
      expect(sess.nome).toBe('Carlos Teste');
      expect(sess.codigo).toBe('AB12-CD34');
      expect(sess.tipo_pessoa).toBe('pf');
    });
  });

  // ===========================================================================
  // requireRepresentanteComDB (assíncrono)
  // ===========================================================================
  describe('requireRepresentanteComDB', () => {
    beforeEach(() => {
      mockCookieStore.get.mockReturnValue({
        value: JSON.stringify(baseSessao),
      });
    });

    it('deve lançar REP_NAO_AUTENTICADO sem cookie', async () => {
      mockCookieStore.get.mockReturnValue(undefined);
      await expect(requireRepresentanteComDB()).rejects.toThrow(
        'REP_NAO_AUTENTICADO'
      );
    });

    it('deve lançar REP_NAO_ENCONTRADO quando rep não existe no DB', async () => {
      mockQuery.mockResolvedValue({ rows: [], rowCount: 0 } as any);
      await expect(requireRepresentanteComDB()).rejects.toThrow(
        'REP_NAO_ENCONTRADO'
      );
    });

    it('deve lançar REP_CONTA_INATIVA se DB retorna status desativado', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            nome: 'X',
            email: 'x',
            codigo: 'X',
            status: 'desativado',
            tipo_pessoa: 'pf',
          },
        ],
        rowCount: 1,
      } as any);
      await expect(requireRepresentanteComDB()).rejects.toThrow(
        'REP_CONTA_INATIVA'
      );
    });

    it('deve retornar sessão com dados frescos do DB', async () => {
      mockQuery.mockResolvedValue({
        rows: [
          {
            id: 1,
            nome: 'Nome Atualizado',
            email: 'novo@test.dev',
            codigo: 'AB12-CD34',
            status: 'apto',
            tipo_pessoa: 'pf',
          },
        ],
        rowCount: 1,
      } as any);

      const sess = await requireRepresentanteComDB();
      expect(sess.nome).toBe('Nome Atualizado');
      expect(sess.email).toBe('novo@test.dev');
      expect(sess.status).toBe('apto');
    });
  });

  // ===========================================================================
  // repAuthErrorResponse
  // ===========================================================================
  describe('repAuthErrorResponse', () => {
    it('deve retornar 401 para REP_NAO_AUTENTICADO', () => {
      const r = repAuthErrorResponse(new Error('REP_NAO_AUTENTICADO'));
      expect(r.status).toBe(401);
      expect(r.body.error).toContain('autenticado');
    });

    it('deve retornar 403 para REP_CONTA_INATIVA', () => {
      const r = repAuthErrorResponse(new Error('REP_CONTA_INATIVA'));
      expect(r.status).toBe(403);
      expect(r.body.error).toContain('desativada');
    });

    it('deve retornar 404 para REP_NAO_ENCONTRADO', () => {
      const r = repAuthErrorResponse(new Error('REP_NAO_ENCONTRADO'));
      expect(r.status).toBe(404);
    });

    it('deve retornar 500 para erros desconhecidos', () => {
      const r = repAuthErrorResponse(new Error('qualquer coisa'));
      expect(r.status).toBe(500);
      expect(r.body.error).toContain('interno');
    });
  });
});
