// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis para simular comportamentos diversos (ISSUE #TESTING-001)

import { GET } from '@/app/api/planos/route';
import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('/api/planos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar planos ativos', async () => {
    // Simular sessão ausente (público)
    mockGetSession.mockReturnValue(null);

    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Personalizado',
          descricao: 'Para avaliação de risco psicossocial.',
          preco: 0.0,
          tipo: 'personalizado',
          caracteristicas: ['Entre em contato.'],
          ativo: true,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planos).toHaveLength(1);
    expect(data.planos[0].nome).toBe('Personalizado');

    // Query deve ser chamada sem sessão (GET público)
    expect(mockQuery).toHaveBeenCalledWith(expect.any(String), [], undefined);
  });
});
