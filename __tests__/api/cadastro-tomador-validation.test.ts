import '@testing-library/jest-dom';

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { POST } from '@/app/api/cadastro/tomadores/route';
import { query } from '@/lib/db';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('API /api/cadastro/tomadores - validação de limite de funcionários', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('retorna 400 quando numero_funcionarios_estimado excede limite do plano', async () => {
    // mock retorno da query que busca limite
    mockQuery.mockResolvedValueOnce({
      rows: [{ limite: '100' }],
      rowCount: 1,
    } as any);

    const fakeRequest: any = {
      formData: () =>
        Promise.resolve({
          get: (k: string) => {
            if (k === 'plano_id') return '1';
            if (k === 'numero_funcionarios_estimado') return '101';
            return null;
          },
        }),
      headers: new Map(),
    };

    const resp: any = await POST(fakeRequest as any);
    expect(resp.status).toBe(400);

    const body = await resp.json();
    expect(body.error).toMatch(/excede o limite/);

    expect(mockQuery).toHaveBeenCalledWith(
      "SELECT caracteristicas->>'limite_funcionarios' as limite FROM planos WHERE id = $1",
      [1]
    );
  });
});
