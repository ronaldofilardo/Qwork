/**
 * @fileoverview Testes da API pública de planos
 * @description Testa endpoint público GET /api/planos que retorna planos ativos
 * @test API pública de consulta de planos disponíveis
 */

import type { QueryResult } from '@/lib/db';
import { GET } from '@/app/api/planos/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

/**
 * Interface para estrutura de plano retornado pela API
 */
interface MockPlano {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  tipo: string;
  caracteristicas: string[];
  ativo: boolean;
}

describe('/api/planos', () => {
  beforeEach(() => {
    // Arrange: Limpar todos os mocks antes de cada teste
    jest.clearAllMocks();
  });

  /**
   * @test Verifica retorno de planos ativos para usuários não autenticados
   * @expected API pública deve retornar planos sem exigir autenticação
   */
  it('deve retornar planos ativos', async () => {
    // Arrange: Simular sessão ausente (acesso público)
    mockGetSession.mockReturnValue(null);

    const mockPlanos: MockPlano[] = [
      {
        id: 1,
        nome: 'Personalizado',
        descricao: 'Para avaliação de risco psicossocial.',
        preco: 0.0,
        tipo: 'personalizado',
        caracteristicas: ['Entre em contato.'],
        ativo: true,
      },
    ];

    mockQuery.mockResolvedValue({
      rows: mockPlanos,
      rowCount: 1,
    } as QueryResult<MockPlano>);

    // Act: Chamar endpoint GET
    const res = await GET();
    const data = await res.json();

    // Assert: Verificar resposta bem-sucedida
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planos).toHaveLength(1);
    expect(data.planos[0].nome).toBe('Personalizado');

    // Assert: Query deve ser chamada sem sessão (GET público)
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [], undefined);
  });
});
