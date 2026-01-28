import { GET } from '@/app/api/admin/planos/route';
import { query, QueryResult } from '@/lib/db';
import { requireRole } from '@/lib/session';

// @ts-nocheck - Justificativa: Mocks de teste requerem tipos flexíveis para simular comportamentos diversos (ISSUE #TESTING-001)

jest.mock('@/lib/db');
jest.mock('@/lib/session');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/admin/planos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar planos para admin (skip MFA)', async () => {
    const adminSession = {
      cpf: 'admin123',
      nome: 'Admin',
      perfil: 'admin',
    } as any;
    mockRequireRole.mockResolvedValue(adminSession);

    mockQuery.mockResolvedValue({
      rows: [
        {
          id: 1,
          nome: 'Personalizado',
          tipo: 'personalizado',
          preco: 0.0,
          caracteristicas: [],
          ativo: true,
        },
      ],
      rowCount: 1,
    } as any);

    const res = await GET(new Request('http://localhost'));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.planos).toHaveLength(1);

    expect(mockRequireRole).toHaveBeenCalledWith(['admin'], false);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.any(String),
      [],
      expect.objectContaining({ perfil: 'admin' })
    );
  });

  it('deve retornar 403 se não for admin', async () => {
    mockRequireRole.mockRejectedValue(new Error('Sem permissão'));

    const res = await GET(new Request('http://localhost'));
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });
});
