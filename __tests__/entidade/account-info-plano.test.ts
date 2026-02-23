/**
 * Testes para GET /api/entidade/account-info
 *
 * NOTA ARQUITETURAL: Os mocks devem usar `requireEntity` (nao `getSession`)
 * pois a rota utiliza `requireEntity()` do @/lib/session, e o banco e acessado
 * via `queryAsGestorEntidade` do @/lib/db-gestor (nao `query` do @/lib/db).
 */

import { GET } from '@/app/api/entidade/account-info/route';
import '@testing-library/jest-dom';

// Mock de sessao: requireEntity e o que a rota chama diretamente
jest.mock('@/lib/session', () => ({
  requireEntity: jest.fn().mockResolvedValue({
    perfil: 'gestor',
    entidade_id: 99,
    cpf: '12345678901',
  }),
  getSession: jest.fn().mockReturnValue({
    perfil: 'gestor',
    entidade_id: 99,
    cpf: '12345678901',
  }),
}));

// Mock do db-gestor: isola queryAsGestorEntidade da cadeia interna de validacao
jest.mock('@/lib/db-gestor', () => ({
  queryAsGestorEntidade: jest.fn(),
}));

import { queryAsGestorEntidade } from '@/lib/db-gestor';

const mockEntidade = {
  id: 99,
  nome: 'Entidade Teste X',
  cnpj: '12345678000100',
  email: 'contato@entidadex.com',
  telefone: '11987654321',
  endereco: 'Rua das Flores, 123',
  cidade: 'Sao Paulo',
  estado: 'SP',
  responsavel_nome: 'Joao Responsavel',
  criado_em: new Date('2025-01-01').toISOString(),
};

describe('Entidade account-info route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna informacoes basicas da conta quando entidade existe', async () => {
    (queryAsGestorEntidade as jest.Mock).mockResolvedValueOnce({
      rows: [mockEntidade],
      rowCount: 1,
    });

    const resp = await GET();
    const data = await resp.json();

    expect(resp.status).toBe(200);
    expect(data).toBeDefined();

    // A rota retorna os campos basicos da entidade (source of truth: account-info/route.ts)
    expect(data.nome).toBe('Entidade Teste X');
    expect(data.cnpj).toBe('12345678000100');
    expect(data.email).toBe('contato@entidadex.com');
    expect(data.telefone).toBe('11987654321');
    expect(data.endereco).toBe('Rua das Flores, 123');
    expect(data.cidade).toBe('Sao Paulo');
    expect(data.estado).toBe('SP');
    expect(data.responsavel_nome).toBe('Joao Responsavel');
  });

  it('retorna 404 quando a entidade nao e encontrada no banco', async () => {
    (queryAsGestorEntidade as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    const resp = await GET();
    const data = await resp.json();

    expect(resp.status).toBe(404);
    expect(data.error).toBeDefined();
  });

  it('retorna 500 quando ocorre erro na autenticacao da sessao', async () => {
    const { requireEntity } = jest.requireMock('@/lib/session');
    (requireEntity as jest.Mock).mockRejectedValueOnce(
      new Error('Sessao invalida ou expirada')
    );

    const resp = await GET();
    const data = await resp.json();

    expect(resp.status).toBe(500);
    expect(data.error).toBeDefined();
  });
});
