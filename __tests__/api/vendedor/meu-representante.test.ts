/**
 * @file __tests__/api/vendedor/meu-representante.test.ts
 *
 * Testes para GET /api/vendedor/meu-representante
 * Retorna dados de comissionamento do representante vinculado ao vendedor logado,
 * usado pelo modal "Novo Lead" para exibir simulação de comissão.
 */

import { NextRequest } from 'next/server';

jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ requireRole: jest.fn() }));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';
import { GET } from '@/app/api/vendedor/meu-representante/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

function makeReq(): NextRequest {
  return new NextRequest('http://localhost/api/vendedor/meu-representante');
}

describe('GET /api/vendedor/meu-representante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna 401 quando não autenticado', async () => {
    // Arrange
    mockRequireRole.mockRejectedValueOnce(new Error('Não autenticado'));

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/autorizado/i);
  });

  it('retorna 404 quando usuário não encontrado no banco', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // usuarios não encontrado

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/não encontrado/i);
  });

  it('retorna { representante: null } quando sem vínculo ativo', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // hierarquia_comercial vazio

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).toBeNull();
  });

  it('retorna dados de comissionamento do representante vinculado', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 15,
            percentual_comissao_comercial: 5,
            modelo_comissionamento: 'percentual',
            valor_custo_fixo_entidade: null,
            valor_custo_fixo_clinica: null,
          },
        ],
        rowCount: 1,
      } as any); // hierarquia + representantes

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante).not.toBeNull();
    expect(data.representante.percentual_comissao).toBe(15);
    expect(data.representante.percentual_comissao_comercial).toBe(5);
    expect(data.representante.modelo_comissionamento).toBe('percentual');
  });

  it('retorna dados de custo fixo quando modelo é custo_fixo', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any) // usuarios
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 0,
            percentual_comissao_comercial: 0,
            modelo_comissionamento: 'custo_fixo',
            valor_custo_fixo_entidade: 12.0,
            valor_custo_fixo_clinica: 10.0,
          },
        ],
        rowCount: 1,
      } as any); // hierarquia + representantes

    // Act
    const res = await GET();

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.representante.modelo_comissionamento).toBe('custo_fixo');
    expect(data.representante.valor_custo_fixo_entidade).toBe(12.0);
    expect(data.representante.valor_custo_fixo_clinica).toBe(10.0);
  });

  it('busca apenas vínculo ativo em hierarquia_comercial', async () => {
    // Arrange
    mockRequireRole.mockResolvedValueOnce({
      cpf: '11122233344',
      nome: 'Vendedor',
      perfil: 'vendedor',
    } as any);
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 108 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({
        rows: [
          {
            percentual_comissao: 10,
            percentual_comissao_comercial: 2,
            modelo_comissionamento: 'percentual',
            valor_custo_fixo_entidade: null,
            valor_custo_fixo_clinica: null,
          },
        ],
        rowCount: 1,
      } as any);

    await GET();

    // Verifica que a query filtra por ativo = true
    const hierQuery = mockQuery.mock.calls.find(
      ([sql]) =>
        typeof sql === 'string' &&
        /hierarquia_comercial/.test(sql) &&
        /ativo.*true/i.test(sql)
    );
    expect(hierQuery).toBeDefined();
    expect(hierQuery![1]).toContain(108); // vendedor_id
  });
});
