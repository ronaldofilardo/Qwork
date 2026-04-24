/**
 * @file __tests__/admin/delecao-tomador-historico.test.ts
 * @description Testes unitários para GET /api/admin/delecao/historico
 *
 * Cobre:
 *   - 200: retorna lista de histórico
 *   - 200: retorna lista vazia quando sem registros
 *   - 403: sem permissão
 *   - 500: erro de banco
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { GET } from '@/app/api/admin/delecao/historico/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /api/admin/delecao/historico', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined as any);
  });

  // ── 200 ───────────────────────────────────────────────────────────────────

  it('deve retornar 200 com lista de histórico', async () => {
    // Arrange
    const fakeRegistro = {
      id: 1,
      cnpj: '12345678000190',
      nome: 'Entidade Teste',
      tipo: 'entidade',
      tomador_id: 42,
      admin_cpf: '00000000000',
      admin_nome: 'Admin',
      resumo: { entidades: 1, funcionarios: 3 },
      criado_em: '2026-04-10T10:00:00Z',
    };
    mockQuery.mockResolvedValueOnce({ rows: [fakeRegistro] } as any);

    // Act
    const res = await GET();
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.historico).toHaveLength(1);
    expect(json.historico[0]).toMatchObject({
      cnpj: '12345678000190',
      nome: 'Entidade Teste',
      tipo: 'entidade',
    });
  });

  it('deve retornar 200 com lista vazia quando sem registros', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    // Act
    const res = await GET();
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.historico).toEqual([]);
  });

  it('deve incluir query com LIMIT 100 e ORDER BY criado_em DESC', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [] } as any);

    // Act
    await GET();

    // Assert
    const callArgs = mockQuery.mock.calls[0][0] as string;
    expect(callArgs).toMatch(/ORDER BY criado_em DESC/i);
    expect(callArgs).toMatch(/LIMIT 100/i);
  });

  // ── 403 ───────────────────────────────────────────────────────────────────

  it('deve retornar 403 quando usuário não tem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await GET();
    const json = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(json.error).toBe('Sem permissão');
  });

  // ── 500 ───────────────────────────────────────────────────────────────────

  it('deve retornar 500 quando banco lança erro', async () => {
    // Arrange
    mockQuery.mockRejectedValueOnce(new Error('timeout'));

    // Act
    const res = await GET();
    const json = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(json.error).toBe('Erro interno');
  });
});
