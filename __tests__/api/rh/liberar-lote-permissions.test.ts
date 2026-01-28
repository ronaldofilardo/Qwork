jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
  requireRHWithEmpresaAccess: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth, requireRHWithEmpresaAccess } from '@/lib/session';
import { POST } from '@/app/api/rh/liberar-lote/route';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

describe('/api/rh/liberar-lote - permissões', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 403 quando requireRHWithEmpresaAccess negar acesso', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '04703084945',
      nome: 'Triagem Curitiba',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    // Empresa existe
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 7, clinica_id: 9 }],
      rowCount: 1,
    } as any);

    mockRequireRHWithEmpresaAccess.mockRejectedValueOnce(
      new Error('Acesso negado')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/rh/liberar-lote',
      {
        method: 'POST',
        body: JSON.stringify({ empresaId: 7 }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe(
      'Você não tem permissão para liberar avaliações nesta empresa'
    );
    expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(7);
  });

  it('deve continuar quando requireRHWithEmpresaAccess autorizar acesso', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '04703084945',
      nome: 'Triagem Curitiba',
      perfil: 'rh',
      clinica_id: 5,
    } as any);

    // Empresa existe
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ id: 7, clinica_id: 9 }],
        rowCount: 1,
      } as any) // empresa check
      .mockResolvedValueOnce({
        rows: [{ numero_ordem: 123 }],
        rowCount: 1,
      } as any) // obter_proximo_numero_ordem
      .mockResolvedValueOnce({ rows: [], rowCount: 0 } as any); // calcular_elegibilidade_lote (rows empty -> will return 400)

    mockRequireRHWithEmpresaAccess.mockResolvedValue({} as any);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/liberar-lote',
      {
        method: 'POST',
        body: JSON.stringify({ empresaId: 7 }),
      }
    );

    const response = await POST(request);
    const data = await response.json();

    // Since no employees returned by elegibilidade, endpoint should return 400
    expect(response.status).toBe(400);
    expect(data.error).toContain('Nenhum funcionário elegível encontrado');
    expect(mockRequireRHWithEmpresaAccess).toHaveBeenCalledWith(7);
  });
});
