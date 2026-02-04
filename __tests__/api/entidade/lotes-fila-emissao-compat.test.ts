import { GET } from '@/app/api/entidade/lotes/route';

// Mocks isolados para este teste
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/session', () => ({ getSession: jest.fn() }));

import { query } from '@/lib/db';
import { getSession } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

describe('/api/entidade/lotes - compat v_fila_emissao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });
  });

  it('usa a view v_fila_emissao na query principal', async () => {
    const mockLotes = [
      {
        id: 1,
        tipo: 'completo',
        status: 'ativo',
        criado_em: '2025-11-29T10:00:00Z',
        liberado_em: '2025-12-01T10:00:00Z',
        liberado_por_nome: 'João Silva',
        total_avaliacoes: 5,
        avaliacoes_concluidas: 3,
        avaliacoes_inativadas: 0,
        laudo_id: null,
        laudo_status: null,
        laudo_emitido_em: null,
        laudo_enviado_em: null,
        laudo_hash: null,
        emissor_nome: null,
        solicitado_por: null,
        solicitado_em: null,
        tipo_solicitante: null,
      },
    ];

    // 1) lotes query
    mockQuery.mockResolvedValueOnce({ rows: mockLotes });
    // 2) validação/fallback
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lotes).toHaveLength(1);

    const containsView = mockQuery.mock.calls.some(
      (c) => typeof c[0] === 'string' && c[0].includes('v_fila_emissao')
    );
    expect(containsView).toBe(true);
  });
});
