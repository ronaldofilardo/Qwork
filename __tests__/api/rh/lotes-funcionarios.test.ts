import { NextRequest } from 'next/server';

// Mock das dependências conforme MOCKS_POLICY.md
const mockQuery = jest.fn();
const mockRequireAuth = jest.fn();
const mockRequireRHWithEmpresaAccess = jest.fn();
const mockGetFuncionariosPorLote = jest.fn();
const mockGetLoteInfo = jest.fn();
const mockGetLoteEstatisticas = jest.fn();

jest.mock('@/lib/db', () => ({
  query: mockQuery,
}));

jest.mock('@/lib/session', () => ({
  requireAuth: mockRequireAuth,
  requireRHWithEmpresaAccess: mockRequireRHWithEmpresaAccess,
}));

jest.mock('@/lib/queries', () => ({
  getFuncionariosPorLote: mockGetFuncionariosPorLote,
  getLoteInfo: mockGetLoteInfo,
  getLoteEstatisticas: mockGetLoteEstatisticas,
}));

describe('/api/rh/lotes/[id]/funcionarios - GET', () => {
  let GET: (
    request: NextRequest,
    context: { params: { id: string } }
  ) => Promise<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  beforeAll(async () => {
    const module = await import('@/app/api/rh/lotes/[id]/funcionarios/route');
    GET = module.GET;
  });

  it('deve validar perfil RH obrigatório', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'Funcionário Teste',
      perfil: 'funcionario', // Não é RH
      clinica_id: 1,
    };

    mockRequireAuth.mockResolvedValue(mockSession);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/1/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '1' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve validar parâmetros obrigatórios', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    };

    mockRequireAuth.mockResolvedValue(mockSession);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/1/funcionarios'
    );
    const context = { params: { id: '1' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Parâmetros empresa_id e lote_id são obrigatórios');
  });

  it('deve retornar 404 quando lote não for encontrado (após autorização)', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    };

    mockRequireAuth.mockResolvedValue(mockSession);

    // Simular autorização bem sucedida
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({
      clinica_id: 1,
    } as any);

    // Mock lote não encontrado
    mockGetLoteInfo.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/1/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '1' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe(
      'Lote não encontrado ou não pertence a esta empresa'
    );
  });

  it('deve validar permissão de acesso à empresa', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    };

    mockRequireAuth.mockResolvedValue(mockSession);

    // Simular requireRHWithEmpresaAccess negando acesso
    mockRequireRHWithEmpresaAccess.mockRejectedValueOnce(
      new Error('Acesso negado')
    );

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/1/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '1' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe(
      'Empresa não encontrada ou você não tem permissão para acessá-la'
    );
  });

  it('deve validar lote encontrado', async () => {
    const mockSession = {
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    };

    mockRequireAuth.mockResolvedValue(mockSession);

    // Simular requireRHWithEmpresaAccess autorizando acesso e retornando clinica_id
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({
      clinica_id: 1,
    } as any);

    // Mock lote não encontrado
    mockGetLoteInfo.mockResolvedValue(null);

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/1/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '1' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe(
      'Lote não encontrado ou não pertence a esta empresa'
    );
  });
});
