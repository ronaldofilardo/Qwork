/**
 * @fileoverview Testes da API POST /api/representante/logout
 */
jest.mock('@/lib/session-representante');

import { POST } from '@/app/api/representante/logout/route';
import { destruirSessaoRepresentante } from '@/lib/session-representante';

const mockDestruir = destruirSessaoRepresentante as jest.MockedFunction<
  typeof destruirSessaoRepresentante
>;

describe('POST /api/representante/logout', () => {
  beforeEach(() => jest.clearAllMocks());

  it('deve retornar 200 e chamar destruirSessaoRepresentante', async () => {
    const res = POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(mockDestruir).toHaveBeenCalledTimes(1);
  });
});
