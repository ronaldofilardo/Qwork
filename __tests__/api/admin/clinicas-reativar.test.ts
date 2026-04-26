/**
 * @file __tests__/api/admin/clinicas-reativar.test.ts
 *
 * Testes do PATCH /api/admin/clinicas/[id]
 *
 * Cobre:
 *   - Reativar sem trocar gestor: deve reativar clinica E usuarios.ativo=true
 *   - Desativar sem trocar gestor: deve desativar clinica E usuarios.ativo=false
 *   - Reativar com troca de gestor: fluxo completo (gestor novo)
 *   - Validações de input
 *   - 403 para usuário sem permissão
 */

import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/admin/clinicas/[id]/route';

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
  new NextRequest(`http://localhost/api/admin/clinicas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const makeParams = (id: string) => ({ params: { id } });

describe('PATCH /api/admin/clinicas/[id]', () => {
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

    const res = await PATCH(
      makeRequest('1', { ativa: 'true' }),
      makeParams('1')
    );
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

  it('reativar sem trocar gestor: reativa clinica E usuarios (ativo=true)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery
      // UPDATE clinicas
      .mockResolvedValueOnce({
        rows: [
          {
            id: 39,
            nome: 'Clínica Teste',
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
      makeRequest('39', { ativa: true }),
      makeParams('39')
    );

    // Assert
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledTimes(2);

    // Primeira query: UPDATE clinicas SET ativa = true
    const primeiraQuery = (mockQuery.mock.calls[0] as unknown[])[0] as string;
    expect(primeiraQuery).toMatch(/UPDATE clinicas/i);
    expect((mockQuery.mock.calls[0] as unknown[])[1]).toEqual([true, 39]);

    // Segunda query: UPDATE usuarios SET ativo = true WHERE clinica_id = 39
    const segundaQuery = (mockQuery.mock.calls[1] as unknown[])[0] as string;
    expect(segundaQuery).toMatch(/UPDATE usuarios/i);
    expect(segundaQuery).toMatch(/tipo_usuario = 'rh'/i);
    const segundaParams = (
      mockQuery.mock.calls[1] as unknown[]
    )[1] as unknown[];
    expect(segundaParams[0]).toBe(true);
    expect(segundaParams[1]).toBe(39);
  });

  it('desativar sem trocar gestor: desativa clinica E usuarios (ativo=false)', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 39,
            nome: 'Clínica Teste',
            cnpj: '12345678000190',
            ativa: false,
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(
      makeRequest('39', { ativa: false }),
      makeParams('39')
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

  it('retorna 404 quando clínica não existe (fluxo padrão)', async () => {
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

    // NÃO deve executar UPDATE usuarios quando a clínica não existe
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  // ── Fluxo com troca de gestor ────────────────────────────────────────────

  it('reativar com novo gestor: retorna novo_gestor no response', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue(adminSession);
    // 1. SELECT clinica
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 5,
          cnpj: '11222333000181',
          responsavel_cpf: '11111111111',
          responsavel_nome: 'Antigo',
        },
      ],
    } as any);
    // 2. SELECT id FROM usuarios (busca usuário atual para ignorarUsuarioId) — novo
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 3-7. checkCpfUnicoSistema Promise.all (5 queries) — CPF disponível
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep.cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // rep.cpf_responsavel_pj
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // leads.cpf
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // leads.cpf_responsavel
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuarios (vendedor/gestor/rh)
    // 8. UPDATE clinicas (ativa=true + dados responsável)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 9. UPDATE usuarios (desativar antigo)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 10. DELETE clinicas_senhas antigo
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 11. SELECT usuarios (verificar se novo existe)
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    // 12. INSERT usuarios
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    // 13. INSERT/UPDATE clinicas_senhas
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await PATCH(
      makeRequest('5', {
        ativa: true,
        trocar_gestor: {
          cpf: '22222222222',
          nome: 'Novo Gestor',
          email: 'novo@email.com',
        },
      }),
      makeParams('5')
    );

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.novo_gestor).toBeDefined();
    expect(data.novo_gestor.cpf).toBe('22222222222');
  });

  it('reativar com gestor inválido (CPF < 11 dígitos): retorna 400', async () => {
    mockRequireRole.mockResolvedValue(adminSession);

    const res = await PATCH(
      makeRequest('5', {
        ativa: true,
        trocar_gestor: { cpf: '12345', nome: 'Novo', email: 'novo@email.com' },
      }),
      makeParams('5')
    );

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/CPF/i);
  });
});
