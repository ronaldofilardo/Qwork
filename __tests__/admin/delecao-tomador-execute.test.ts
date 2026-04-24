/**
 * @file __tests__/admin/delecao-tomador-execute.test.ts
 * @description Testes unitários para POST /api/admin/delecao/execute
 *
 * Cobre:
 *   - 400: CNPJ inválido
 *   - 400: fase inválida (0, 10, string)
 *   - 403: sem permissão
 *   - 404: tomador não encontrado durante execução
 *   - 200: fase 1 executada com sucesso (entidade)
 *   - 200: fase 9 executada com sucesso (insere auditoria)
 *   - 500: erro de banco
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({
  transaction: jest.fn(),
}));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/admin/delecao/execute/route';
import { transaction } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockTransaction = transaction as jest.MockedFunction<typeof transaction>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest('http://localhost/api/admin/delecao/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const fakeAdminSession = {
  cpf: '00000000000',
  nome: 'Admin Teste',
  perfil: 'admin' as const,
};

/** Mock de client que simula transação bem-sucedida retornando 0 rows deletados */
function makeClientMock(tipo: 'entidade' | 'clinica' = 'entidade') {
  return {
    query: jest.fn().mockImplementation((sql: string) => {
      // SELECT tomador
      if (/FROM tomadores/i.test(sql)) {
        return Promise.resolve({
          rows: [
            {
              id: 1,
              nome: 'Tomador Teste',
              cnpj: '12345678000190',
              tipo,
            },
          ],
        });
      }
      // INSERT auditoria
      if (/INSERT INTO audit_delecoes_tomador/i.test(sql)) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }
      // ALTER TABLE … DISABLE/ENABLE TRIGGER
      if (/ALTER TABLE/i.test(sql)) {
        return Promise.resolve({ rows: [], rowCount: 0 });
      }
      // DELETEs e SELECTs de IDs
      return Promise.resolve({ rows: [], rowCount: 0 });
    }),
  };
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('POST /api/admin/delecao/execute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(fakeAdminSession as any);
  });

  // ── 400 ───────────────────────────────────────────────────────────────────

  it('deve retornar 400 quando CNPJ ausente', async () => {
    // Arrange
    const req = makeRequest({ fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/cnpj/i);
  });

  it('deve retornar 400 quando CNPJ tem formato inválido', async () => {
    // Arrange
    const req = makeRequest({ cnpj: '1234', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/14 dígitos/i);
  });

  it('deve retornar 400 quando fase é 0', async () => {
    // Arrange
    const req = makeRequest({ cnpj: '12345678000190', fase: 0 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/fase/i);
  });

  it('deve retornar 400 quando fase é 10', async () => {
    // Arrange
    const req = makeRequest({ cnpj: '12345678000190', fase: 10 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/fase/i);
  });

  it('deve retornar 400 quando fase é string', async () => {
    // Arrange
    const req = makeRequest({ cnpj: '12345678000190', fase: 'um' });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/fase/i);
  });

  // ── 403 ───────────────────────────────────────────────────────────────────

  it('deve retornar 403 quando usuário não tem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const req = makeRequest({ cnpj: '12345678000190', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(json.error).toBe('Sem permissão');
  });

  // ── 404 ───────────────────────────────────────────────────────────────────

  it('deve retornar 404 quando tomador não encontrado na fase', async () => {
    // Arrange
    mockTransaction.mockImplementationOnce(async (fn) => {
      const client = {
        query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
      };
      await fn(client as any);
    });
    const req = makeRequest({ cnpj: '12345678000190', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(json.error).toMatch(/não encontrado/i);
  });

  // ── 200 fase 1 ────────────────────────────────────────────────────────────

  it('deve retornar 200 com ok:true ao executar fase 1 em entidade', async () => {
    // Arrange
    const client = makeClientMock('entidade');
    mockTransaction.mockImplementationOnce(async (fn) => {
      await fn(client as any);
    });
    const req = makeRequest({ cnpj: '12345678000190', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.fase).toBe(1);
    expect(json.deletados).toBeDefined();
  });

  it('deve retornar 200 com ok:true ao executar fase 1 em clínica', async () => {
    // Arrange
    const client = makeClientMock('clinica');
    mockTransaction.mockImplementationOnce(async (fn) => {
      await fn(client as any);
    });
    const req = makeRequest({ cnpj: '50295891000129', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.fase).toBe(1);
  });

  // ── 200 fase 9 ────────────────────────────────────────────────────────────

  it('deve executar fase 9 e chamar INSERT em audit_delecoes_tomador', async () => {
    // Arrange
    const client = makeClientMock('entidade');
    mockTransaction.mockImplementationOnce(async (fn) => {
      await fn(client as any);
    });
    const req = makeRequest({ cnpj: '12345678000190', fase: 9 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(json.fase).toBe(9);

    // Verificar que INSERT de auditoria foi chamado
    const insertCall = client.query.mock.calls.find(([sql]: [string]) =>
      /INSERT INTO audit_delecoes_tomador/i.test(sql)
    );
    expect(insertCall).toBeDefined();
  });

  // ── 500 ───────────────────────────────────────────────────────────────────

  it('deve retornar 500 quando transação lança erro inesperado', async () => {
    // Arrange
    mockTransaction.mockRejectedValueOnce(new Error('deadlock'));
    const req = makeRequest({ cnpj: '12345678000190', fase: 1 });

    // Act
    const res = await POST(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(json.error).toMatch(/erro ao executar/i);
  });
});
