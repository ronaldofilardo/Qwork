/**
 * @file __tests__/api/admin/gestores-rh.test.ts
 * Testes: /api/admin/gestores-rh (desativado)
 */

import { GET, POST } from '@/app/api/admin/gestores-rh/route';
import { requireRole } from '@/lib/session';

jest.mock('@/lib/session');

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/gestores-rh (desativado)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireRole.mockResolvedValue({
      cpf: '000',
      perfil: 'admin' as const,
    } as any);
  });

  it('GET retorna 403 endpoint desativado', async () => {
    const res = await GET();
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('desativado');
  });

  it('POST retorna 403 endpoint desativado', async () => {
    const res = await POST({} as any);
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toContain('desativado');
  });

  it('GET 403 se não admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));
    const res = await GET();
    expect(res.status).toBe(403);
  });
});
