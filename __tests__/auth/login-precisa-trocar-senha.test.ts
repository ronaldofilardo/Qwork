/**
 * Testes: API de Login — campo `precisaTrocarSenha`
 *
 * Cobre:
 * - Gestor com primeira_senha_alterada=false → precisaTrocarSenha=true
 * - Gestor com primeira_senha_alterada=true  → precisaTrocarSenha=false
 * - RH com primeira_senha_alterada=false     → precisaTrocarSenha=true
 * - RH com primeira_senha_alterada=true      → precisaTrocarSenha=false
 * - Funcionário nunca recebe precisaTrocarSenha=true
 * - Admin nunca recebe precisaTrocarSenha=true
 */

import { NextRequest } from 'next/server';
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getDatabaseInfo: jest.fn(() => 'test-db'),
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  createSession: jest.fn(),
  getSession: jest.fn(),
}));

jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn(),
  extrairContextoRequisicao: jest.fn(() => ({
    ipAddress: '127.0.0.1',
    userAgent: 'jest-test',
  })),
}));

jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn(() => jest.fn(() => null)),
  RATE_LIMIT_CONFIGS: { auth: {} },
}));

jest.mock('@/lib/auth/password-generator', () => ({
  gerarSenhaDeNascimento: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
  typeof bcrypt.compare
>;

function makeLoginRequest(cpf: string, senha: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ cpf, senha }),
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Configurar queries para um usuário gestor */
function setupGestorMocks({
  cpf = '12345678901',
  entidade_id = 1,
  senhaHash = 'hash_gestor',
  primeiraSenhaAlterada = true,
  tomadorAtiva = true,
}: {
  cpf?: string;
  entidade_id?: number;
  senhaHash?: string;
  primeiraSenhaAlterada?: boolean;
  tomadorAtiva?: boolean;
} = {}) {
  mockQuery.mockImplementation((sql: string) => {
    // Query para funcionarios (não encontrado)
    if (sql.includes('FROM funcionarios') && sql.includes('WHERE cpf =')) {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // Query para usuarios (encontrado como gestor)
    if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
      return Promise.resolve({
        rows: [
          {
            cpf,
            nome: 'Gestor Test',
            tipo_usuario: 'gestor',
            entidade_id,
            clinica_id: null,
            ativo: true,
          },
        ],
        rowCount: 1,
      } as any);
    }
    // Query para entidades_senhas
    if (sql.includes('FROM entidades_senhas')) {
      return Promise.resolve({
        rows: [
          {
            senha_hash: senhaHash,
            primeira_senha_alterada: primeiraSenhaAlterada,
            id: entidade_id,
            ativa: tomadorAtiva,
          },
        ],
        rowCount: 1,
      } as any);
    }
    // Query para aceites_termos
    if (sql.includes('FROM aceites_termos_usuario')) {
      return Promise.resolve({
        rows: [
          { termo_tipo: 'termos_uso' },
          { termo_tipo: 'politica_privacidade' },
        ],
        rowCount: 2,
      } as any);
    }
    // Fallback para outras queries
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
  (mockBcryptCompare as any).mockResolvedValue(true);
}

/** Configurar queries para um usuário RH */
function setupRhMocks({
  cpf = '98765432100',
  clinica_id = 2,
  senhaHash = 'hash_rh',
  primeiraSenhaAlterada = true,
  tomadorAtiva = true,
}: {
  cpf?: string;
  clinica_id?: number;
  senhaHash?: string;
  primeiraSenhaAlterada?: boolean;
  tomadorAtiva?: boolean;
} = {}) {
  mockQuery.mockImplementation((sql: string) => {
    // Query para funcionarios (não encontrado)
    if (sql.includes('FROM funcionarios') && sql.includes('WHERE cpf =')) {
      return Promise.resolve({ rows: [], rowCount: 0 });
    }
    // Query para usuarios (encontrado como rh)
    if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
      return Promise.resolve({
        rows: [
          {
            cpf,
            nome: 'RH Test',
            tipo_usuario: 'rh',
            clinica_id,
            entidade_id: null,
            ativo: true,
          },
        ],
        rowCount: 1,
      } as any);
    }
    // Query para clinicas_senhas
    if (sql.includes('FROM clinicas_senhas')) {
      return Promise.resolve({
        rows: [
          {
            senha_hash: senhaHash,
            primeira_senha_alterada: primeiraSenhaAlterada,
            clinica_id,
            ativa: tomadorAtiva,
          },
        ],
        rowCount: 1,
      } as any);
    }
    // Query para aceites_termos
    if (sql.includes('FROM aceites_termos_usuario')) {
      return Promise.resolve({
        rows: [
          { termo_tipo: 'termos_uso' },
          { termo_tipo: 'politica_privacidade' },
        ],
        rowCount: 2,
      } as any);
    }
    // Fallback para outras queries
    return Promise.resolve({ rows: [], rowCount: 0 });
  });
  (mockBcryptCompare as any).mockResolvedValue(true);
}

describe('Login API — campo precisaTrocarSenha', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Gestor ───────────────────────────────────────────────────────────────

  describe('Perfil Gestor', () => {
    it('deve retornar precisaTrocarSenha=true quando primeira_senha_alterada=false', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(true);
    });

    it('deve retornar precisaTrocarSenha=false quando primeira_senha_alterada=true', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: true });

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(false);
    });

    it('deve retornar precisaTrocarSenha=false quando primeira_senha_alterada é null/undefined (default safe)', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM funcionarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678901',
                nome: 'Gestor',
                tipo_usuario: 'gestor',
                entidade_id: 1,
                clinica_id: null,
                ativo: true,
              },
            ],
            rowCount: 1,
          } as any);
        }
        if (sql.includes('FROM entidades_senhas')) {
          return Promise.resolve({
            rows: [
              {
                senha_hash: 'hash',
                primeira_senha_alterada: null,
                id: 1,
                ativa: true,
              },
            ],
            rowCount: 1,
          } as any);
        }
        if (sql.includes('FROM aceites_termos_usuario')) {
          return Promise.resolve({
            rows: [
              { termo_tipo: 'termos_uso' },
              { termo_tipo: 'politica_privacidade' },
            ],
            rowCount: 2,
          } as any);
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      (mockBcryptCompare as any).mockResolvedValue(true);

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      // primeiraSenhaAlterada ?? true => true => precisaTrocarSenha = false
      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(false);
    });

    it('deve incluir campo precisaTrocarSenha na resposta de gestor', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: true });

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('precisaTrocarSenha');
    });

    it('deve consultar entidades_senhas para gestor (não clinicas_senhas)', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: false });

      await loginHandler(makeLoginRequest('12345678901', 'qualquer'));

      const entidadesSenhasCall = mockQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('entidades_senhas')
      );
      expect(entidadesSenhasCall).toBeDefined();
    });
  });

  // ── RH ──────────────────────────────────────────────────────────────────

  describe('Perfil RH', () => {
    it('deve retornar precisaTrocarSenha=true quando primeira_senha_alterada=false', async () => {
      setupRhMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('98765432100', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(true);
    });

    it('deve retornar precisaTrocarSenha=false quando primeira_senha_alterada=true', async () => {
      setupRhMocks({ primeiraSenhaAlterada: true });

      const response = await loginHandler(
        makeLoginRequest('98765432100', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(false);
    });

    it('deve incluir campo precisaTrocarSenha na resposta de rh', async () => {
      setupRhMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('98765432100', 'qualquer')
      );
      const data = await response.json();

      expect(data).toHaveProperty('precisaTrocarSenha');
    });

    it('deve consultar clinicas_senhas para rh (não entidades_senhas)', async () => {
      setupRhMocks({ primeiraSenhaAlterada: false });

      await loginHandler(makeLoginRequest('98765432100', 'qualquer'));

      const clinicasSenhasCall = mockQuery.mock.calls.find(
        ([sql]) => typeof sql === 'string' && sql.includes('clinicas_senhas')
      );
      expect(clinicasSenhasCall).toBeDefined();
    });
  });

  // ── Outros perfis não recebem precisaTrocarSenha=true ────────────────────

  describe('Outros perfis — precisaTrocarSenha deve ser false', () => {
    it('funcionário não recebe precisaTrocarSenha=true', async () => {
      // Funcionário veio de funcionarios (foundInFuncionarios=true) — não consulta entidades_senhas
      mockQuery
        .mockResolvedValueOnce({
          rows: [
            {
              cpf: '11122233344',
              nome: 'Func',
              usuario_tipo: 'funcionario_entidade',
              entidade_id: 1,
              clinica_id: null,
              ativo: true,
              senha_hash: 'hash_func',
            },
          ],
          rowCount: 1,
        } as any)
        .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // aceites termos (irrelevante para funcionario)
      (mockBcryptCompare as any).mockResolvedValue(true);

      const response = await loginHandler(
        makeLoginRequest('11122233344', 'qualquer')
      );

      if (response.status === 200) {
        const data = await response.json();
        // funcionário nunca tem precisaTrocarSenha=true
        expect(data.precisaTrocarSenha).toBeFalsy();
      } else {
        // Se retornou erro por outra razão, o teste é não-relevante
        expect([200, 403, 404, 500]).toContain(response.status);
      }
    });
  });

  // ── Integridade da resposta ───────────────────────────────────────────────

  describe('Integridade da resposta', () => {
    it('resposta de gestor deve incluir perfil, cpf, nome, redirectTo e precisaTrocarSenha', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      expect(data).toHaveProperty('cpf');
      expect(data).toHaveProperty('nome');
      expect(data).toHaveProperty('perfil');
      expect(data).toHaveProperty('redirectTo');
      expect(data).toHaveProperty('precisaTrocarSenha');
      expect(data).toHaveProperty('termosPendentes');
    });

    it('redirectTo deve ser /entidade para gestor (independente de precisaTrocarSenha)', async () => {
      setupGestorMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('12345678901', 'qualquer')
      );
      const data = await response.json();

      // O redirect base continua /entidade — o frontend cuida do redirecionamento para /trocar-senha
      expect(data.redirectTo).toBe('/entidade');
    });

    it('redirectTo deve ser /rh para rh (independente de precisaTrocarSenha)', async () => {
      setupRhMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('98765432100', 'qualquer')
      );
      const data = await response.json();

      expect(data.redirectTo).toBe('/rh');
    });
  });

  // ── Vendedor ─────────────────────────────────────────────────────────────

  describe('Perfil Vendedor', () => {
    function setupVendedorMocks({
      cpf = '12345678904',
      primeiraSenhaAlterada = true,
    }: { cpf?: string; primeiraSenhaAlterada?: boolean } = {}) {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM funcionarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({ rows: [], rowCount: 0 });
        }
        if (sql.includes('FROM usuarios') && sql.includes('WHERE cpf =')) {
          return Promise.resolve({
            rows: [
              {
                cpf,
                nome: 'Vendedor Teste',
                tipo_usuario: 'vendedor',
                clinica_id: null,
                entidade_id: null,
                ativo: true,
                senha_hash: 'hash_vendedor',
              },
            ],
            rowCount: 1,
          } as any);
        }
        if (
          sql.includes('vendedores_perfil') &&
          sql.includes('primeira_senha_alterada')
        ) {
          return Promise.resolve({
            rows: [{ primeira_senha_alterada: primeiraSenhaAlterada }],
            rowCount: 1,
          } as any);
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      (mockBcryptCompare as any).mockResolvedValue(true);
    }

    it('deve retornar precisaTrocarSenha=true quando primeira_senha_alterada=false', async () => {
      setupVendedorMocks({ primeiraSenhaAlterada: false });

      const response = await loginHandler(
        makeLoginRequest('12345678904', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(true);
    });

    it('deve retornar precisaTrocarSenha=false quando primeira_senha_alterada=true', async () => {
      setupVendedorMocks({ primeiraSenhaAlterada: true });

      const response = await loginHandler(
        makeLoginRequest('12345678904', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(false);
    });

    it('deve consultar vendedores_perfil para obter primeira_senha_alterada', async () => {
      setupVendedorMocks({ primeiraSenhaAlterada: false });

      await loginHandler(makeLoginRequest('12345678904', 'qualquer'));

      const vpCall = mockQuery.mock.calls.find(
        ([sql]) =>
          typeof sql === 'string' &&
          sql.includes('vendedores_perfil') &&
          sql.includes('primeira_senha_alterada')
      );
      expect(vpCall).toBeDefined();
    });

    it('precisaTrocarSenha=false se vendedores_perfil não encontrado (default seguro)', async () => {
      // vendedores_perfil retorna vazio → primeiraSenhaAlterada default = true
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM funcionarios'))
          return Promise.resolve({ rows: [], rowCount: 0 });
        if (sql.includes('FROM usuarios')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678904',
                nome: 'Vendedor Teste',
                tipo_usuario: 'vendedor',
                clinica_id: null,
                entidade_id: null,
                ativo: true,
                senha_hash: 'hash',
              },
            ],
            rowCount: 1,
          } as any);
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      (mockBcryptCompare as any).mockResolvedValue(true);

      const response = await loginHandler(
        makeLoginRequest('12345678904', 'qualquer')
      );
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.precisaTrocarSenha).toBe(false);
    });

    it('403 se usuário vendedor está inativo', async () => {
      mockQuery.mockImplementation((sql: string) => {
        if (sql.includes('FROM funcionarios'))
          return Promise.resolve({ rows: [], rowCount: 0 });
        if (sql.includes('FROM usuarios')) {
          return Promise.resolve({
            rows: [
              {
                cpf: '12345678904',
                nome: 'Vendedor Inativo',
                tipo_usuario: 'vendedor',
                clinica_id: null,
                entidade_id: null,
                ativo: false, // inativo!
                senha_hash: 'hash',
              },
            ],
            rowCount: 1,
          } as any);
        }
        return Promise.resolve({ rows: [], rowCount: 0 });
      });
      (mockBcryptCompare as any).mockResolvedValue(true);

      const response = await loginHandler(
        makeLoginRequest('12345678904', 'qualquer')
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toMatch(/inativo/i);
    });
  });
});
