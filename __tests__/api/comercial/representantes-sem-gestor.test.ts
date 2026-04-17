/**
 * @fileoverview Testes da API GET /api/comercial/representantes/sem-gestor
 * Listagem de representantes ativos sem gestor_comercial_cpf atribuído.
 */
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/comercial/representantes/sem-gestor/route';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeGet(url = 'http://localhost/api/comercial/representantes/sem-gestor'): NextRequest {
  return new NextRequest(url);
}

const comercialSession = {
  cpf: '22222222222',
  nome: 'Comercial Teste',
  perfil: 'comercial',
} as any;

const repsSemGestor = [
  {
    id: 10,
    nome: 'Rep Alfa LTDA',
    email: 'alfa@test.dev',
    status: 'ativo',
    codigo: 'PJ00-0010',
    tipo_pessoa: 'pj',
    criado_em: '2026-01-01T00:00:00.000Z',
    leads_ativos: '2',
    vinculos_ativos: '1',
  },
  {
    id: 11,
    nome: 'Rep Beta LTDA',
    email: 'beta@test.dev',
    status: 'aguardando_senha',
    codigo: 'PJ00-0011',
    tipo_pessoa: 'pj',
    criado_em: '2026-02-01T00:00:00.000Z',
    leads_ativos: '0',
    vinculos_ativos: '0',
  },
];

describe('GET /api/comercial/representantes/sem-gestor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(comercialSession);
  });

  // --- 200 success ---
  it('deve retornar lista de representantes sem gestor', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: repsSemGestor, rowCount: 2 } as any);

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.representantes).toHaveLength(2);
    expect(data.representantes[0].id).toBe(10);
    expect(data.representantes[0].nome).toBe('Rep Alfa LTDA');
    expect(data.representantes[0].leads_ativos).toBe(2);
    expect(data.representantes[0].vinculos_ativos).toBe(1);
  });

  it('deve converter strings numéricas para número', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: repsSemGestor, rowCount: 2 } as any);

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(typeof data.representantes[0].leads_ativos).toBe('number');
    expect(typeof data.representantes[0].vinculos_ativos).toBe('number');
  });

  it('deve retornar lista vazia quando todos têm gestor atribuído', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(200);
    expect(data.representantes).toHaveLength(0);
  });

  // --- 403 não autenticado ---
  it('deve retornar 403 para usuário não autenticado', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBe('Não autenticado');
  });

  it('deve retornar 403 para usuário sem permissão', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Sem permissão'));

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(403);
    expect(data.error).toBe('Sem permissão');
  });

  // --- 500 erro interno ---
  it('deve retornar 500 em erro inesperado de banco', async () => {
    // Arrange
    mockQuery.mockRejectedValueOnce(new Error('Conexão recusada'));

    // Act
    const res = await GET(makeGet());
    const data = await res.json();

    // Assert
    expect(res.status).toBe(500);
    expect(data.error).toBe('Erro interno');
  });

  // --- Conteúdo dos campos retornados ---
  it('deve retornar campos id, nome, email, status, codigo, tipo_pessoa, criado_em', async () => {
    // Arrange
    mockQuery.mockResolvedValueOnce({ rows: [repsSemGestor[0]], rowCount: 1 } as any);

    // Act
    const res = await GET(makeGet());
    const data = await res.json();
    const rep = data.representantes[0];

    // Assert
    expect(rep).toHaveProperty('id');
    expect(rep).toHaveProperty('nome');
    expect(rep).toHaveProperty('email');
    expect(rep).toHaveProperty('status');
    expect(rep).toHaveProperty('codigo');
    expect(rep).toHaveProperty('tipo_pessoa');
    expect(rep).toHaveProperty('criado_em');
    expect(rep).toHaveProperty('leads_ativos');
    expect(rep).toHaveProperty('vinculos_ativos');
  });

  // --- Verificações de acesso ---
  it('deve aceitar usuário com perfil admin', async () => {
    // Arrange
    mockRequireRole.mockResolvedValue({ cpf: '00000000001', nome: 'Admin', perfil: 'admin' } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    // Act
    const res = await GET(makeGet());

    // Assert
    expect(res.status).toBe(200);
    expect(mockRequireRole).toHaveBeenCalledWith(['comercial', 'admin'], false);
  });
});
