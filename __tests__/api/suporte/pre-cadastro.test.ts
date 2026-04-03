/**
 * @file __tests__/api/suporte/pre-cadastro.test.ts
 * @description Testes unitários para GET /api/suporte/pre-cadastro
 *
 * Cobre:
 *   - 200: lista pré-cadastros corretamente
 *   - 200 com filtro de tipo
 *   - 200 com lista vazia
 *   - 400: query param inválida
 *   - 401: sem autenticação
 *   - 403: role sem permissão
 *   - 500: erro de banco
 */

// ──────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/authorization/policies', () => ({
  assertRoles: jest.fn(),
  ROLES: { SUPORTE: 'suporte' },
  isApiError: (
    e: unknown
  ): e is { message: string; code: string; status: number } =>
    typeof e === 'object' && e !== null && 'status' in e && 'code' in e,
}));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/suporte/pre-cadastro/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';
import { assertRoles } from '@/lib/authorization/policies';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockAssertRoles = assertRoles as jest.MockedFunction<typeof assertRoles>;

function makeRequest(searchParams = ''): NextRequest {
  return new NextRequest(
    `http://localhost/api/suporte/pre-cadastro${searchParams ? `?${searchParams}` : ''}`
  );
}

const fakeSuorteSession = {
  cpf: '99999999999',
  nome: 'Operador Suporte',
  perfil: 'suporte' as const,
};

const fakePreCadastros = [
  {
    id: 1,
    nome: 'Clínica Teste',
    cnpj: '12345678000190',
    email: 'clinica@teste.com',
    telefone: '11999999999',
    status: 'aguardando_aceite_contrato',
    criado_em: '2026-01-01T10:00:00.000Z',
    tipo: 'clinica',
    contrato_id: 99,
    contrato_criado_em: '2026-01-01T11:00:00.000Z',
    responsavel_nome: 'João Silva',
    responsavel_cargo: 'Gestor',
    responsavel_celular: '11988887777',
  },
  {
    id: 2,
    nome: 'Empresa Beta',
    cnpj: '98765432000199',
    email: 'empresa@beta.com',
    telefone: null,
    status: 'pendente',
    criado_em: '2026-01-02T09:00:00.000Z',
    tipo: 'entidade',
    contrato_id: 100,
    contrato_criado_em: '2026-01-02T10:00:00.000Z',
    responsavel_nome: 'Maria Souza',
    responsavel_cargo: 'RH',
    responsavel_celular: '21977776666',
  },
];

describe('GET /api/suporte/pre-cadastro', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue(fakeSuorteSession as any);
    mockAssertRoles.mockImplementation(() => undefined);
  });

  // ────────────────────────────────────────────
  // 200 — casos de sucesso
  // ────────────────────────────────────────────

  describe('200 — sucesso', () => {
    it('deve retornar lista de pré-cadastros com total', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({
        rows: fakePreCadastros,
        rowCount: fakePreCadastros.length,
      } as any);

      // Act
      const response = await GET(makeRequest());
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.total).toBe(2);
      expect(body.pre_cadastros).toHaveLength(2);
      expect(body.pre_cadastros[0].nome).toBe('Clínica Teste');
    });

    it('deve retornar lista vazia quando não há pendentes', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

      // Act
      const response = await GET(makeRequest());
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.total).toBe(0);
      expect(body.pre_cadastros).toEqual([]);
    });

    it('deve filtrar por tipo clinica quando especificado', async () => {
      // Arrange
      const clinicaOnly = [fakePreCadastros[0]];
      mockQuery.mockResolvedValueOnce({
        rows: clinicaOnly,
        rowCount: 1,
      } as any);

      // Act
      const response = await GET(makeRequest('tipo=clinica'));
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.total).toBe(1);
      expect(body.pre_cadastros[0].tipo).toBe('clinica');

      // A query deve ter recebido o parâmetro 'clinica'
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('AND e.tipo = $1'),
        ['clinica']
      );
    });

    it('deve filtrar por tipo entidade quando especificado', async () => {
      // Arrange
      const entidadeOnly = [fakePreCadastros[1]];
      mockQuery.mockResolvedValueOnce({
        rows: entidadeOnly,
        rowCount: 1,
      } as any);

      // Act
      const response = await GET(makeRequest('tipo=entidade'));
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.pre_cadastros[0].tipo).toBe('entidade');
      expect(mockQuery).toHaveBeenCalledWith(expect.any(String), ['entidade']);
    });

    it('deve retornar todos quando tipo=todos', async () => {
      // Arrange
      mockQuery.mockResolvedValueOnce({
        rows: fakePreCadastros,
        rowCount: 2,
      } as any);

      // Act
      const response = await GET(makeRequest('tipo=todos'));
      const body = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(body.total).toBe(2);
      // Sem filtro de tipo na query
      expect(mockQuery).toHaveBeenCalledWith(
        expect.not.stringContaining('e.tipo = $1'),
        []
      );
    });
  });

  // ────────────────────────────────────────────
  // 400 — validação
  // ────────────────────────────────────────────

  describe('400 — input inválido', () => {
    it('deve retornar 400 quando tipo é valor não permitido', async () => {
      // Act
      const response = await GET(makeRequest('tipo=invalido'));
      const body = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(body.error).toBeDefined();
      expect(mockQuery).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────
  // 401 / 403 — autenticação e autorização
  // ────────────────────────────────────────────

  describe('401 / 403 — autenticação e autorização', () => {
    it('deve retornar 401 quando não há sessão', async () => {
      // Arrange
      mockGetSession.mockReturnValue(null as any);
      mockAssertRoles.mockImplementation(() => {
        const error = new Error('Autenticação requerida') as any;
        error.status = 401;
        error.code = 'UNAUTHORIZED';
        throw error;
      });

      // Act
      const response = await GET(makeRequest());
      const body = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(body.error).toBeTruthy();
    });

    it('deve retornar 403 quando sessão tem role errada', async () => {
      // Arrange
      mockGetSession.mockReturnValue({
        ...fakeSuorteSession,
        perfil: 'gestor',
      } as any);
      mockAssertRoles.mockImplementation(() => {
        const error = new Error('Acesso negado') as any;
        error.status = 403;
        error.code = 'FORBIDDEN';
        throw error;
      });

      // Act
      const response = await GET(makeRequest());
      const body = await response.json();

      // Assert
      expect(response.status).toBe(403);
      expect(body.error).toBeTruthy();
    });
  });

  // ────────────────────────────────────────────
  // 500 — erro interno
  // ────────────────────────────────────────────

  describe('500 — erro interno', () => {
    it('deve retornar 500 quando banco lança exceção genérica', async () => {
      // Arrange
      mockQuery.mockRejectedValueOnce(new Error('connection timeout'));

      // Act
      const response = await GET(makeRequest());
      const body = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(body.error).toBe('Erro interno ao listar pré-cadastros');
    });
  });
});
