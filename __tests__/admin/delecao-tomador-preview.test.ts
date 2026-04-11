/**
 * @file __tests__/admin/delecao-tomador-preview.test.ts
 * @description Testes unitários para GET /api/admin/delecao/preview
 *
 * Cobre:
 *   - 200: entidade encontrada com contagens
 *   - 200: clínica encontrada com contagens
 *   - 400: CNPJ ausente
 *   - 400: CNPJ com formato inválido
 *   - 403: sem permissão (requireRole lança erro)
 *   - 404: tomador não encontrado
 *   - 500: erro de banco
 */

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/admin/delecao/preview/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(cnpj?: string): NextRequest {
  const urlStr = cnpj
    ? `http://localhost/api/admin/delecao/preview?cnpj=${cnpj}`
    : `http://localhost/api/admin/delecao/preview`;
  const url = new URL(urlStr);
  return {
    url: url.toString(),
    nextUrl: url,
  } as unknown as NextRequest;
}

function zeroCount(): { rows: [{ cnt: string }] } {
  return { rows: [{ cnt: '0' }] } as unknown as { rows: [{ cnt: string }] };
}

function emptyRows(): { rows: never[] } {
  return { rows: [] } as unknown as { rows: never[] };
}

/**
 * Monta sequência de queries para entidade sem registros filho.
 *
 * Sequência exata (loteIds=[], funcCpfs=[] → sem queries de avaliação/laudo):
 * 1. tomadores lookup
 * 2. lotes_avaliacao (entidade_id)       → vazio
 * 3. funcionarios_entidades JOIN         → vazio
 * 4. funcionarios_entidades COUNT        → 0
 * 5. vinculos_comissao (entidade)        → 0
 * 6. comissoes_laudo (entidade)          → 0
 * 7. contratos (entidade)                → 0
 * 8. pagamentos via contratos            → 0
 * 9. recibos via contratos               → 0
 * 10. entidades_senhas                   → 0
 * 11. usuarios (entidade)               → 0
 * 12. leads_representante               → 0
 */
function mockEntidadeSemFilhos(id = 1): void {
  mockQuery
    // 1. tomadores lookup
    .mockResolvedValueOnce({
      rows: [
        {
          id,
          nome: 'Entidade Teste',
          cnpj: '12345678000190',
          tipo: 'entidade',
          responsavel_cpf: '00000000000',
          status: 'ativo',
        },
      ],
    } as any)
    // 2. lotes
    .mockResolvedValueOnce(emptyRows() as any)
    // 3. funcionários
    .mockResolvedValueOnce(emptyRows() as any)
    // 4. funcionarios_entidades COUNT
    .mockResolvedValueOnce(zeroCount() as any)
    // 5. vinculos_comissao
    .mockResolvedValueOnce(zeroCount() as any)
    // 6. comissoes_laudo (entidade)
    .mockResolvedValueOnce(zeroCount() as any)
    // 7. contratos
    .mockResolvedValueOnce(zeroCount() as any)
    // 8. pagamentos
    .mockResolvedValueOnce(zeroCount() as any)
    // 9. recibos
    .mockResolvedValueOnce(zeroCount() as any)
    // 10. entidades_senhas
    .mockResolvedValueOnce(zeroCount() as any)
    // 11. usuarios
    .mockResolvedValueOnce(zeroCount() as any)
    // 12. leads_representante
    .mockResolvedValueOnce(zeroCount() as any);
}

// ── Testes ────────────────────────────────────────────────────────────────────

describe('GET /api/admin/delecao/preview', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(undefined as any);
  });

  // ── 400 ───────────────────────────────────────────────────────────────────

  it('deve retornar 400 quando CNPJ ausente', async () => {
    // Arrange
    const req = makeRequest();

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/cnpj/i);
  });

  it('deve retornar 400 quando CNPJ tem menos de 14 dígitos', async () => {
    // Arrange
    const req = makeRequest('1234567890');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/14 dígitos/i);
  });

  it('deve retornar 400 quando CNPJ contém letras', async () => {
    // Arrange
    const req = makeRequest('1234567890ABCD');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(json.error).toMatch(/14 dígitos/i);
  });

  // ── 403 ───────────────────────────────────────────────────────────────────

  it('deve retornar 403 quando usuário não tem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));
    const req = makeRequest('12345678000190');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(json.error).toBe('Sem permissão');
  });

  // ── 404 ───────────────────────────────────────────────────────────────────

  it('deve retornar 404 quando tomador não encontrado', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce(emptyRows() as any);
    const req = makeRequest('12345678000190');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(json.error).toMatch(/não encontrado/i);
  });

  // ── 200 ───────────────────────────────────────────────────────────────────

  it('deve retornar 200 com preview de entidade sem registros filho', async () => {
    // Arrange
    mockEntidadeSemFilhos(42);
    const req = makeRequest('12345678000190');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.tomador).toMatchObject({
      id: 42,
      nome: 'Entidade Teste',
      tipo: 'entidade',
    });
    expect(json.contagens).toBeDefined();
    expect(typeof json.contagens).toBe('object');
    expect(json.contagens.avaliacoes).toBe(0);
    expect(json.contagens.lotes_avaliacao).toBe(0);
  });

  it('deve retornar 200 com preview de clínica', async () => {
    // Arrange — clínica sem filhos
    // Sequência: tomadores, empresas_clientes, lotes, funcionarios_clinicas JOIN,
    // funcionarios_clinicas COUNT, vinculos_comissao, contratos, pagamentos,
    // recibos, clinicas_senhas, usuarios, notificacoes_admin
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          {
            id: 10,
            nome: 'Clínica Teste',
            cnpj: '50295891000129',
            tipo: 'clinica',
            responsavel_cpf: '11111111111',
            status: 'ativo',
          },
        ],
      } as any)
      .mockResolvedValueOnce(emptyRows() as any) // empresas_clientes
      .mockResolvedValueOnce(emptyRows() as any) // lotes
      .mockResolvedValueOnce(emptyRows() as any) // funcionarios_clinicas JOIN
      .mockResolvedValueOnce(zeroCount() as any) // funcionarios_clinicas COUNT
      .mockResolvedValueOnce(zeroCount() as any) // vinculos_comissao
      .mockResolvedValueOnce(zeroCount() as any) // contratos
      .mockResolvedValueOnce(zeroCount() as any) // pagamentos
      .mockResolvedValueOnce(zeroCount() as any) // recibos
      .mockResolvedValueOnce(zeroCount() as any) // clinicas_senhas
      .mockResolvedValueOnce(zeroCount() as any) // usuarios
      .mockResolvedValueOnce(zeroCount() as any); // notificacoes_admin

    const req = makeRequest('50295891000129');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(json.tomador.tipo).toBe('clinica');
    expect(json.contagens).toBeDefined();
    expect(json.contagens.lotes_avaliacao).toBe(0);
  });

  // ── 500 ───────────────────────────────────────────────────────────────────

  it('deve retornar 500 quando banco lança erro inesperado', async () => {
    // Arrange
    mockQuery.mockRejectedValueOnce(new Error('conexão perdida'));
    const req = makeRequest('12345678000190');

    // Act
    const res = await GET(req);
    const json = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(json.error).toBeDefined();
  });
});
