/**
 * @fileoverview Testes da API POST /api/comercial/representantes/[id]/assumir
 * Permite que o comercial logado se auto-atribua como gestor de um representante sem gestor.
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/comercial/representantes/[id]/assumir/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makePost(id: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/comercial/representantes/${id}/assumir`,
    { method: 'POST' }
  );
}

const comercialSession = {
  cpf: '22222222222',
  nome: 'Comercial Teste',
  perfil: 'comercial',
} as any;

const repSemGestor = {
  id: 10,
  nome: 'Rep Alfa LTDA',
  gestor_comercial_cpf: null,
};

const repComGestor = {
  id: 11,
  nome: 'Rep Beta LTDA',
  gestor_comercial_cpf: '11111111111',
};

describe('POST /api/comercial/representantes/[id]/assumir', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession);
  });

  // --- 200 success ---
  it('deve assumir representante sem gestor com sucesso', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [repSemGestor], rowCount: 1 } as any) // SELECT check
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);            // UPDATE

    // Act
    const res = await POST(makePost('10'), { params: { id: '10' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.representante_id).toBe(10);
    expect(data.gestor_comercial_cpf).toBe('22222222222');
  });

  it('deve usar o CPF do comercial logado no UPDATE', async () => {
    // Arrange
    mockQuery
      .mockResolvedValueOnce({ rows: [repSemGestor], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    await POST(makePost('10'), { params: { id: '10' } });

    // Assert: segundo mock = UPDATE deve ter sido chamado com CPF do comercial
    expect(mockQuery).toHaveBeenCalledTimes(2);
    const updateCall = mockQuery.mock.calls[1];
    expect(updateCall[1]).toContain('22222222222');
  });

  // --- 400 ID inválido ---
  it('deve retornar 400 para ID não numérico', async () => {
    // Act
    const res = await POST(makePost('abc'), { params: { id: 'abc' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(400);
    expect(data.error).toMatch(/ID inválido/);
  });

  // --- 404 representante não encontrado ---
  it('deve retornar 404 quando representante não existe ou está inativo', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await POST(makePost('999'), { params: { id: '999' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(404);
    expect(data.error).toMatch(/não encontrado/i);
  });

  // --- 409 representante já tem gestor ---
  it('deve retornar 409 quando representante já possui gestor atribuído', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [repComGestor], rowCount: 1 } as any);

    // Act
    const res = await POST(makePost('11'), { params: { id: '11' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(409);
    expect(data.error).toMatch(/gestor comercial atribuído/i);
  });

  // --- 403 não autenticado ---
  it('deve retornar 403 para usuário não autenticado', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));

    // Act
    const res = await POST(makePost('10'), { params: { id: '10' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBe('Não autenticado');
  });

  it('deve retornar 403 para usuário sem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await POST(makePost('10'), { params: { id: '10' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBe('Sem permissão');
  });

  // --- 500 erro interno ---
  it('deve retornar 500 em erro inesperado de banco', async () => {
    // Arrange
    mockQuery.mockRejectedValueOnce(new Error('Timeout'));

    // Act
    const res = await POST(makePost('10'), { params: { id: '10' } });
    const data = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(data.error).toBe('Erro interno');
  });

  // --- Idempotência e segurança ---
  it('deve verificar ativo=true no SELECT (não assume representantes inativos)', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    await POST(makePost('10'), { params: { id: '10' } });

    // Assert: SELECT deve incluir ativo=true
    const selectCall = mockQuery.mock.calls[0];
    expect(selectCall[0]).toMatch(/ativo\s*=\s*true/i);
  });

  it('deve verificar que gestor_comercial_cpf IS NULL antes de assumir', async () => {
    // Arrange — primeiro SELECT retorna rep sem gestor
    mockQuery
      .mockResolvedValueOnce({ rows: [repSemGestor], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    await POST(makePost('10'), { params: { id: '10' } });

    // Assert: SELECT busca gestor_comercial_cpf
    const selectCall = mockQuery.mock.calls[0];
    expect(selectCall[0]).toMatch(/gestor_comercial_cpf/i);
  });

  // --- Aceitar admin ---
  it('deve aceitar usuário admin como executor', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue({ cpf: '00000000001', nome: 'Admin', perfil: 'admin' } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [repSemGestor], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);

    // Act
    const res = await POST(makePost('10'), { params: { id: '10' } });

    // Assert
    expect(res.status).toBe(200);
    expect(mockRequireRole).toHaveBeenCalledWith(['comercial', 'admin'], false);
  });
});
