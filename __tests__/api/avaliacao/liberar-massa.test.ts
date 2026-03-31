/**
 * @file __tests__/api/avaliacao/liberar-massa.test.ts
 * Testes: POST /api/avaliacao/liberar-massa
 */

import { POST } from '@/app/api/avaliacao/liberar-massa/route';
import { requireAuth } from '@/lib/session';
import { queryWithContext } from '@/lib/db-security';

jest.mock('@/lib/session');
jest.mock('@/lib/db-security');

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQueryCtx = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;

describe('POST /api/avaliacao/liberar-massa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('200 com erro se não é rh', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '111', perfil: 'gestor' } as any);
    const res = await POST({} as Request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error).toBe('Acesso negado');
  });

  it('retorna 0 criadas se nenhum funcionário ativo', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '222', perfil: 'rh' } as any);
    mockQueryCtx.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);

    const res = await POST({} as Request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.criadas).toBe(0);
  });

  it('cria avaliações para todos os funcionários ativos', async () => {
    mockRequireAuth.mockResolvedValue({ cpf: '222', perfil: 'rh' } as any);
    mockQueryCtx
      .mockResolvedValueOnce({
        rows: [{ cpf: 'F1' }, { cpf: 'F2' }],
        rowCount: 2,
      } as any)
      .mockResolvedValue({ rowCount: 1 } as any); // INSERTs

    const res = await POST({} as Request);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.criadas).toBe(2);
    expect(json.total).toBe(2);
    expect(json.detalhes).toHaveLength(2);
  });
});
