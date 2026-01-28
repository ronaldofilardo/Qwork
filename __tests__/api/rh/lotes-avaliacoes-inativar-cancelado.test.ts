import { NextRequest } from 'next/server';
import { POST } from '@/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar/route';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/lotes', () => ({ recalcularStatusLotePorId: jest.fn() }));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQuery = query as jest.MockedFunction<typeof query>;
let mockRecalc: jest.MockedFunction<any>;

describe('POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar - cancelado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRecalc = (require('@/lib/lotes') as any).recalcularStatusLotePorId;
  });

  it('cancela lote quando todas as avaliacoes ficam inativadas', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '111',
      nome: 'RH',
      perfil: 'rh',
    } as any);

    // avaliacao existente
    mockQuery
      .mockResolvedValueOnce({ rows: [{ clinica_id: 1 }], rowCount: 1 }) // lote check in request (unused in current impl, but tests expect)
      .mockResolvedValueOnce({
        rows: [
          {
            id: 55,
            status: 'em_andamento',
            funcionario_cpf: '34369034345',
            funcionario_nome: 'Davi Rezende',
            lote_id: 26,
            lote_codigo: '006-050126',
            lote_ordem: 50,
          },
        ],
        rowCount: 1,
      }) // busca avaliacao
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }) // update da avaliacao
      .mockResolvedValueOnce({
        rows: [{ ativas: '0', concluidas: '0', iniciadas: '0' }],
        rowCount: 1,
      }) // stats: ativas 0
      .mockResolvedValueOnce({ rows: [{ status: 'concluido' }], rowCount: 1 }); // status atual

    mockRecalc.mockResolvedValue({
      novoStatus: 'cancelado',
      loteFinalizado: true,
    } as any);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/26/avaliacoes/55/inativar',
      {
        method: 'POST',
        body: JSON.stringify({ motivo: 'teste motivo longo suficiente' }),
      }
    );

    const response = await POST(request, {
      params: { id: '26', avaliacaoId: '55' },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toMatch(/cancelado automaticamente/);
    expect(data.lote.novoStatus).toBe('cancelado');

    // verificar que a função de recálculo foi chamada
    expect(mockRecalc).toHaveBeenCalledWith(26);
  });
});
