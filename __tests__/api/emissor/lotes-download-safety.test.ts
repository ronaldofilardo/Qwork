import { GET } from '@/app/api/emissor/lotes/route';
import { requireRole } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('Lotes route - não expõe laudos antes de lote concluído', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve ignorar laudo se lote não estiver concluído e não expor hash', async () => {
    mockRequireRole.mockResolvedValue({ cpf: '53051173991', perfil: 'emissor' } as any);

    // totalQuery
    mockQuery.mockResolvedValueOnce({ rows: [{ total: 1 }], rowCount: 1 } as any);

    // lotesQuery: retorna um lote com laudo_id mas status 'ativo'
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 3,
          codigo: '003-290126',
          titulo: 'Lote 1',
          tipo: 'padrao',
          lote_status: 'ativo',
          liberado_em: null,
          auto_emitir_em: null,
          modo_emergencia: false,
          empresa_nome: 'Empresa X',
          clinica_nome: 'Clinica Y',
          total_avaliacoes: 2,
          observacoes: null,
          status_laudo: 'enviado',
          laudo_id: 42,
          emitido_em: null,
          enviado_em: null,
          hash_pdf: null,
        },
      ],
      rowCount: 1,
    } as any);

    // The invalid laudos detection query (SELECT l.id AS laudo_id ... la.status NOT IN (...))
    mockQuery.mockImplementation(async (sql: string, params?: any[]) => {
      if (sql && sql.includes('WHERE la.id = ANY')) {
        return { rows: [{ laudo_id: 42, lote_id: 3, lote_status: 'ativo' }], rowCount: 1 } as any;
      }
      return { rows: [], rowCount: 0 } as any;
    });

    const req = new Request('http://localhost/api/emissor/lotes?page=1');
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.lotes)).toBe(true);
    expect(data.lotes.length).toBeGreaterThan(0);
    const lote = data.lotes[0];

    // Como o lote não está concluído, não devemos expor a propriedade laudo (ou deve ser null)
    expect(lote.laudo).toBeNull();
  });
});