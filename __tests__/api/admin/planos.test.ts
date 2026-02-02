/**
 * @fileoverview Testes da API admin de planos
 * @description Testa endpoint protegido GET /api/admin/planos com autenticação de admin
 * @test API admin de gerenciamento de planos
 */

import type { QueryResult } from '@/lib/db';
import { GET } from '@/app/api/admin/planos/route';
import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

/**
 * Interface para sessão de admin mockada
 */
interface MockAdminSession {
  cpf: string;
  nome: string;
  perfil: 'admin';
}

/**
 * Interface para plano retornado pela API
 */
interface MockPlano {
  id: number;
  nome: string;
  tipo: string;
  preco: number;
  caracteristicas: string[];
  ativo: boolean;
}

describe('/api/admin/planos', () => {
  beforeEach(() => {
    // Arrange: Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  /**
   * @test Verifica retorno de planos para admin autenticado (skip MFA)
   * @expected Admin deve ter acesso aos planos sem exigir MFA
   */
  it('deve retornar planos para admin (skip MFA)', async () => {
    // Arrange: Criar sessão de admin mockada
    const adminSession: MockAdminSession = {
      cpf: 'admin123',
      nome: 'Admin',
      perfil: 'admin',
    };
    mockRequireRole.mockResolvedValue(adminSession);

    const mockPlanos: MockPlano[] = [
      {
        id: 1,
        nome: 'Personalizado',
        tipo: 'personalizado',
        preco: 0.0,
        caracteristicas: [],
        ativo: true,
      },
    ];

    mockQuery.mockResolvedValue({
      rows: mockPlanos,
      rowCount: 1,
    } as QueryResult<MockPlano>);

    // Act: Chamar endpoint GET com request mockada
    const res = await GET(new Request('http://localhost'));
    const data = await res.json();

    // Assert: Verificar resposta bem-sucedida
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planos).toHaveLength(1);

    // Assert: Verificar autenticação de admin sem MFA
    expect(mockRequireRole).toHaveBeenCalledWith(['admin'], false);

    // Assert: Query deve incluir contexto de sessão admin
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      [],
      expect.objectContaining({ perfil: 'admin' })
    );
  });

  /**
   * @test Verifica rejeição de acesso para usuários não-admin
   * @expected Deve retornar 403 quando usuário não tem permissão de admin
   */
  it('deve retornar 403 se não for admin', async () => {
    // Arrange: Simular rejeição de autenticação
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    // Act: Tentar acessar endpoint protegido
    const res = await GET(new Request('http://localhost'));
    const data = await res.json();

    // Assert: Verificar resposta de erro 403
    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });
});
