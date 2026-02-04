import { NextRequest } from 'next/server';
import { POST } from '@/app/api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar/route';
import { requireAuth } from '@/lib/session';
import { query } from '@/lib/db';

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));
jest.mock('@/lib/db', () => ({ query: jest.fn() }));
jest.mock('@/lib/db-gestor', () => ({ queryAsGestorRH: jest.fn() }));

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryAsGestorRH = (require('@/lib/db-gestor') as any)
  .queryAsGestorRH as jest.MockedFunction<any>;

describe('POST /api/rh/lotes/[id]/avaliacoes/[avaliacaoId]/inativar - cancelado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cancela lote quando todas as avaliacoes ficam inativadas', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '111',
      nome: 'RH',
      perfil: 'rh',
    } as any);

    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 26, empresa_id: 1, status: 'ativo', emitido_em: null }],
        rowCount: 1,
      }) // lote check
      .mockResolvedValueOnce({ rows: [{ count: '0' }], rowCount: 1 }) // emissão não solicitada
      .mockResolvedValueOnce({
        rows: [
          {
            id: 55,
            status: 'em_andamento',
            funcionario_cpf: '34369034345',
            funcionario_nome: 'Davi Rezende',
          },
        ],
        rowCount: 1,
      }) // avaliação check
      .mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '3',
            ativas: '0',
            concluidas: '0',
            inativadas: '3',
            liberadas: '3',
          },
        ],
        rowCount: 1,
      }) // stats para recálculo
      .mockResolvedValueOnce({ rows: [{ status: 'ativo' }], rowCount: 1 }) // status atual
      .mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE status do lote

    mockQueryAsGestorRH.mockResolvedValueOnce({ rows: [], rowCount: 1 }); // UPDATE avaliação

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
  });
});
