import { GET } from '@/app/api/rh/lotes/route';

// Mocks isolados para este teste
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { query } from '@/lib/db';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

describe('/api/rh/lotes - compat v_fila_emissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
    mockRequireRHWithEmpresaAccess.mockResolvedValue(undefined);
  });

  it('usa a view v_fila_emissao na query principal', async () => {
    const mockEmpresa = [{ id: 1, clinica_id: 1 }];
    const mockLotes = [
      {
        id: 1,
        tipo: 'operacional',
        status: 'ativo',
        liberado_em: '2025-12-16T10:00:00Z',
        liberado_por: '11111111111',
        liberado_por_nome: 'RH Teste',
        total_avaliacoes: '5',
        avaliacoes_concluidas: '3',
        avaliacoes_inativadas: '1',
      },
    ];

    // 1) empresaCheck
    mockQuery.mockResolvedValueOnce({ rowCount: 1, rows: mockEmpresa });
    // 2) lotes query
    mockQuery.mockResolvedValueOnce({ rows: mockLotes });
    // 3) validação por lote (fallback)
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // Verificar que alguma das chamadas contém a view v_fila_emissao
    const containsView = mockQuery.mock.calls.some(
      (c) => typeof c[0] === 'string' && c[0].includes('v_fila_emissao')
    );
    expect(containsView).toBe(true);
  });
});
