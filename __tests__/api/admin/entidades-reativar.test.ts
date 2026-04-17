/**
 * @file __tests__/api/admin/entidades-reativar.test.ts
 *
 * Testes do PATCH /api/admin/entidades/[id]
 *
 * Cobre:
 *   - Reativar sem trocar gestor: deve reativar entidade E usuarios.ativo=true
 *   - Desativar sem trocar gestor: deve desativar entidade E usuarios.ativo=false
 *   - Reativar com troca de gestor: fluxo completo
 *   - Validações de input
 *   - 403 para usuário sem permissão
 */

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/entidades/[id]/route';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));
jest.mock('@/lib/auditoria/auditoria', () => ({
  registrarAuditoria: jest.fn().mockResolvedValue(undefined),
  extrairContextoRequisicao: jest
    .fn()
    .mockReturnValue({ ip_address: '127.0.0.1', user_agent: 'test' }),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('$hash$'),
}));

let mockQuery: jest.MockedFunction<(...args: unknown[]) => unknown>;
let mockRequireRole: jest.MockedFunction<(...args: unknown[]) => unknown>;

beforeAll(async () => {
  const db = await import('@/lib/db');
  const session = await import('@/lib/session');
  mockQuery = db.query as jest.MockedFunction<typeof db.query>;
  mockRequireRole = (session as any).requireRole as jest.MockedFunction<
    typeof session.requireRole
  >;
});

const adminSession = {
  cpf: '12345678901',
  nome: 'Admin',
  perfil: 'admin' as const,
};

const makeRequest = (id: string, body: Record<string, unknown>) =>
  new NextRequest(`http://localhost/api/admin/entidades/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeParams = (id: string) => ({ params: { id } });

describe('PATCH /api/admin/entidades/[id]', () => {
  beforeEach(() => jest.clearAllMocks());

  // ── Validações de input ──────────────────────────────────────────────────

  it('retorna 400 para ID inválido', async () => {
    mockRequireRole.mockResolvedValue(adminSession);

    const res = await PATCH(
      makeRequest('abc', { ativa: true }),
      makeParams('abc')
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/inválido/i);
  });

  it('retorna 400 quando ativa não é boolean', async () => {
    mockRequireRole.mockResolvedValue(adminSession);

    const res = await PATCH(makeRequest('1', { ativa: 1 }), makeParams('1'));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/boolean/i);
  });

  it('retorna 403 se usuário não tem permissão', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    const res = await PATCH(makeRequest('1', { ativa: true }), makeParams('1'));
    expect(res.status).toBe(403);
  });

  // ── Fluxo padrão: reativar sem trocar gestor ────────────────────────────

  it('reativar sem trocar gestor: reativa entidade E usuarios (ativo=true)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery
      // UPDATE entidades
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            nome: 'Entidade Teste',
            cnpj: '12345678000190',
            ativa: true,
          },
        ],
        rowCount: 1,
      } as any)
      // UPDATE usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(
      makeRequest('10', { ativa: true }),
      makeParams('10')
    );

    // Assert
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // Primeira query: UPDATE entidades SET ativa = true
    const primeiraQuery = (mockQuery.mock.calls[0] as unknown[])[0] as string;
    expect(primeiraQuery).toMatch(/UPDATE entidades/i);
    expect((mockQuery.mock.calls[0] as unknown[])[1]).toEqual([true, 10]);

    // Segunda query: UPDATE usuarios SET ativo = true WHERE entidade_id = 10 AND tipo_usuario = 'gestor'
    const segundaQuery = (mockQuery.mock.calls[1] as unknown[])[0] as string;
    expect(segundaQuery).toMatch(/UPDATE usuarios/i);
    expect(segundaQuery).toMatch(/tipo_usuario = 'gestor'/i);
    const segundaParams = (
      mockQuery.mock.calls[1] as unknown[]
    )[1] as unknown[];
    expect(segundaParams[0]).toBe(true);
    expect(segundaParams[1]).toBe(10);
  });

  it('desativar sem trocar gestor: desativa entidade E usuarios (ativo=false)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            nome: 'Entidade Teste',
            cnpj: '12345678000190',
            ativa: false,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(
      makeRequest('10', { ativa: false }),
      makeParams('10')
    );

    // Assert
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // Segunda query deve passar ativo=false
    const segundaParams = (
      mockQuery.mock.calls[1] as unknown[]
    )[1] as unknown[];
    expect(segundaParams[0]).toBe(false);
  });

  it('retorna 404 quando entidade não existe (fluxo padrão)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await PATCH(
      makeRequest('999', { ativa: true }),
      makeParams('999')
    );

    // Assert
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrada/i);

    // NÃO deve executar UPDATE usuarios quando entidade não existe
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // ── Fluxo com troca de gestor ────────────────────────────────────────────

  it('reativar com novo gestor: retorna novo_gestor no response', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    // 1. SELECT entidade
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          cnpj: '11222333000181',
          responsavel_cpf: '11111111111',
          responsavel_nome: 'Antigo',
        },
      ],
    } as any);
    // 2. UPDATE entidades (ativa=true + dados responsável)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 3. UPDATE usuarios (desativar antigo)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 4. DELETE entidades_senhas antigo
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 5. SELECT usuarios (verificar se novo existe)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 6. INSERT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 7. INSERT/UPDATE entidades_senhas
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(
      makeRequest('7', {
        ativa: true,
        trocar_gestor: {
          cpf: '22222222222',
          nome: 'Novo Gestor',
          email: 'novo@email.com',
        },
      }),
      makeParams('7')
    );

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.novo_gestor).toBeDefined();
    expect(data.novo_gestor.cpf).toBe('22222222222');
  });

  it('reativar com gestor cujo CPF tem menos de 11 dígitos: retorna 400', async () => {
    mockRequireRole.mockResolvedValue(adminSession);

    const res = await PATCH(
      makeRequest('7', {
        ativa: true,
        trocar_gestor: { cpf: '12345', nome: 'Novo', email: 'novo@email.com' },
      }),
      makeParams('7')
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/CPF/i);
  });
});
