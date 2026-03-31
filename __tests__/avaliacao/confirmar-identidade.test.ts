/**
 * Testes unitários: POST /api/avaliacao/confirmar-identidade
 *
 * Cobre:
 * - 401 quando não há sessão ativa
 * - 403 quando CPF do body não corresponde à sessão
 * - 200 no contexto de login (avaliacaoId null) — identidade já validada no auth
 * - 200 no contexto de avaliação (avaliacaoId preenchido)
 * - CPF com máscara é normalizado corretamente
 */

jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));
jest.mock('@/lib/authorization/policies', () => ({
  isApiError: (err: unknown) =>
    err instanceof Error && 'code' in err && 'status' in err,
}));

import { getSession } from '@/lib/session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

function makeRequest(body: object) {
  return new Request('http://localhost:3000/api/avaliacao/confirmar-identidade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function mockFuncionarioSession(cpf = '97687700074') {
  return {
    cpf,
    nome: 'Funcionário Teste',
    perfil: 'funcionario' as const,
  };
}

describe('POST /api/avaliacao/confirmar-identidade', () => {
  let POST: (request: Request) => Promise<Response>;

  beforeAll(async () => {
    const mod = await import('@/app/api/avaliacao/confirmar-identidade/route');
    POST = mod.POST;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Autenticação ─────────────────────────────────────────────────────────

  it('deve retornar 401 quando não há sessão ativa', async () => {
    // Arrange
    mockGetSession.mockReturnValue(null);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: null, cpf: '97687700074', nome: 'Entidade', dataNascimento: '2001-01-01' })
    );

    // Assert
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe('Não autenticado');
  });

  // ─── Autorização ──────────────────────────────────────────────────────────

  it('deve retornar 403 quando CPF do body não corresponde à sessão', async () => {
    // Arrange
    mockGetSession.mockReturnValue(mockFuncionarioSession('11111111111') as any);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: null, cpf: '22222222222', nome: 'Outro', dataNascimento: '2001-01-01' })
    );

    // Assert
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toMatch(/não corresponde/i);
  });

  // ─── Contexto de login (avaliacaoId null) ─────────────────────────────────

  it('deve retornar 200 no contexto de login com avaliacaoId null', async () => {
    // Arrange
    mockGetSession.mockReturnValue(mockFuncionarioSession('97687700074') as any);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: null, cpf: '97687700074', nome: 'Entidade masc', dataNascimento: '2001-01-01' })
    );

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('deve retornar 200 com CPF do body mascarado quando corresponde à sessão', async () => {
    // Arrange — sessão tem CPF limpo, body tem CPF mascarado
    mockGetSession.mockReturnValue(mockFuncionarioSession('97687700074') as any);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: null, cpf: '976.877.000-74', nome: 'Entidade masc', dataNascimento: '2001-01-01' })
    );

    // Assert — máscara é removida antes da comparação
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it('deve retornar 200 com CPF da sessão mascarado quando corresponde ao body', async () => {
    // Arrange — sessão tem CPF mascarado, body tem CPF limpo
    mockGetSession.mockReturnValue(mockFuncionarioSession('976.877.000-74') as any);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: null, cpf: '97687700074', nome: 'Entidade masc', dataNascimento: '2001-01-01' })
    );

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  // ─── Contexto de avaliação (avaliacaoId preenchido) ───────────────────────

  it('deve retornar 200 no contexto de avaliação com avaliacaoId preenchido', async () => {
    // Arrange
    mockGetSession.mockReturnValue(mockFuncionarioSession('97687700074') as any);

    // Act
    const res = await POST(
      makeRequest({ avaliacaoId: 42, cpf: '97687700074', nome: 'Entidade masc', dataNascimento: '2001-01-01' })
    );

    // Assert
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
