/**
 * @file __tests__/api/vendedor/dados-codigo.test.ts
 *
 * Testes para GET /api/vendedor/dados incluindo o campo codigo
 * Cobre:
 * - Retorno de codigo quando vendedor tem vendedores_perfil
 * - Retorno de null/undefined quando vendedor não tem perfil estendido
 * - Campo codigo presente na query SQL
 */

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session');

import { GET } from '@/app/api/vendedor/dados/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { NextRequest } from 'next/server';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

const vendedorSession = {
  cpf: '12345678901',
  nome: 'Vendedor Teste',
  perfil: 'vendedor' as const,
};

function makeGetReq() {
  return new NextRequest('http://localhost/api/vendedor/dados');
}

describe('GET /api/vendedor/dados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue(vendedorSession as any);
  });

  it('401 se não autenticado', async () => {
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));
    const res = await GET();
    expect(res.status).toBe(401);
    const d = await res.json();
    expect(d.error).toBeDefined();
  });

  it('404 se vendedor não encontrado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it('200 retorna usuario com codigo quando vendedor_perfil existe', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          cpf: '12345678901',
          nome: 'Vendedor Teste',
          email: 'vendedor@test.com',
          telefone: null,
          ativo: true,
          criado_em: '2026-03-01T10:00:00Z',
          primeira_senha_alterada: true,
          aceite_politica_privacidade: true,
          codigo: 'VND-12345',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.usuario).toBeDefined();
    expect(d.usuario.codigo).toBe('VND-12345');
    expect(d.usuario.nome).toBe('Vendedor Teste');
  });

  it('200 retorna usuario com codigo null quando vendedor_perfil não existe', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          cpf: '12345678901',
          nome: 'Vendedor Novo',
          email: 'novo@test.com',
          telefone: null,
          ativo: true,
          criado_em: '2026-03-22T10:00:00Z',
          primeira_senha_alterada: true,
          aceite_politica_privacidade: true,
          codigo: null,
        },
      ],
      rowCount: 1,
    } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.usuario.codigo).toBeNull();
  });

  it('query SELECT inclui campo codigo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
    await GET();
    const sqlCall = mockQuery.mock.calls[0];
    const sql = sqlCall[0];
    expect(sql).toMatch(/vp\.codigo/i);
  });

  it('200 retorna dados completos do usuario incluindo flags de aceite', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 10,
          cpf: '12345678901',
          nome: 'Vendedor Completo',
          email: 'completo@test.com',
          telefone: '11999999999',
          ativo: true,
          criado_em: '2026-03-01T10:00:00Z',
          primeira_senha_alterada: true,
          aceite_politica_privacidade: true,
          codigo: 'VND-99999',
        },
      ],
      rowCount: 1,
    } as any);
    const res = await GET();
    expect(res.status).toBe(200);
    const d = await res.json();
    expect(d.usuario.id).toBe(10);
    expect(d.usuario.cpf).toBe('12345678901');
    expect(d.usuario.primeira_senha_alterada).toBe(true);
    expect(d.usuario.aceite_politica_privacidade).toBe(true);
    expect(d.usuario.codigo).toBe('VND-99999');
  });
});
