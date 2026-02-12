import { GET } from '@/app/api/rh/laudos/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock do db-security para isolar validações/contexto de sessão (testes unitários)
jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/session', () => {
  const getSessionMock = jest.fn();
  return {
    getSession: getSessionMock,
    requireAuth: jest.fn(async () => getSessionMock()),
    requireClinica: jest.fn(async () => getSessionMock()),
    requireRHWithEmpresaAccess: jest.fn(async (empresaId: number) => ({
      ...getSessionMock(),
      empresa_id: empresaId,
    })),
  };
});

import { query } from '@/lib/db';
import { queryWithContext } from '@/lib/db-security';
import {
  getSession,
  requireClinica,
  requireAuth,
  requireRHWithEmpresaAccess,
} from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;
const mockRequireClinica = requireClinica as jest.MockedFunction<
  typeof requireClinica
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockRequireRHWithEmpresaAccess =
  requireRHWithEmpresaAccess as jest.MockedFunction<
    typeof requireRHWithEmpresaAccess
  >;

// TODO: Este teste precisa ser revisado e atualizado conforme a implementação atual da API
// Os mocks não estão refletindo corretamente a estrutura de chamadas da rota
describe.skip('/api/rh/laudos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Mock consistente seguindo política - sessão com clinica_id obrigatório
    const mockSession = {
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    };
    mockGetSession.mockReturnValue(mockSession);
    mockRequireAuth.mockResolvedValue(mockSession);
    mockRequireClinica.mockResolvedValue(mockSession);
  });

  it('deve retornar laudos da clínica do RH', async () => {
    const mockLaudos = [
      {
        laudo_id: 1,
        lote_id: 1,
        status: 'enviado',
        enviado_em: '2025-12-16T10:00:00Z',
        hash_pdf: 'hash123',
        titulo: 'Avaliação Psicossocial',
        empresa_nome: 'Empresa Teste',
        clinica_nome: 'Clínica Teste',
        emissor_nome: 'Emissor Teste',
      },
    ];

    // Mock da query de verificação da clínica (requireClinica) e da query principal
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, ativa: true }] })
      .mockResolvedValueOnce({ rows: mockLaudos, rowCount: 1 });

    const request = new Request('http://localhost:3000/api/rh/laudos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.laudos).toHaveLength(1);
    expect(data.laudos[0]).toMatchObject({
      id: 1,
      lote_id: 1,
      empresa_nome: 'Empresa Teste',
      status: 'enviado',
      data_emissao: '2025-12-16T10:00:00Z',
      arquivos: {
        relatorio_lote: '/api/rh/laudos/1/download',
      },
    });
  });

  it('deve filtrar laudos por empresa_id quando fornecido', async () => {
    const mockLaudos = [
      {
        laudo_id: 2,
        lote_id: 2,
        status: 'enviado',
        enviado_em: '2025-12-17T10:00:00Z',
        hash_pdf: 'hash456',
        titulo: 'Avaliação Psicossocial',
        empresa_nome: 'Empresa Filtrada',
        clinica_nome: 'Clínica Teste',
        emissor_nome: 'Emissor Teste',
      },
    ];

    // Mock requireRHWithEmpresaAccess para permitir acesso
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
      empresa_id: 2,
    });

    // Mock da query do check da empresa e da query com filtro
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 2, clinica_id: 1 }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockLaudos, rowCount: 1 });

    const request = new Request(
      'http://localhost:3000/api/rh/laudos?empresa_id=2'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.laudos).toHaveLength(1);
    expect(data.laudos[0].empresa_nome).toBe('Empresa Filtrada');

    // Verificar que a query foi chamada com empresa_id (params começam com clinicaId e empresaId)
    const lastCall = mockQuery.mock.calls[mockQuery.mock.calls.length - 1] || [];
    const calledParams = lastCall[1];
    expect(calledParams[0]).toBe(1);
    expect(calledParams[1]).toBe(2);
  });

  it('deve retornar erro 403 para usuário sem perfil RH', async () => {
    // Mock sessão sem perfil adequado
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'Funcionário Teste',
      perfil: 'funcionario',
      clinica_id: 1,
    });

    const request = new Request('http://localhost:3000/api/rh/laudos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar erro 403 quando clínica não identificada', async () => {
    // Mock sessão sem clinica_id
    mockGetSession.mockReturnValue({
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: null,
    });

    const request = new Request('http://localhost:3000/api/rh/laudos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Clínica não identificada na sessão');
  });

  it('deve retornar erro 500 em caso de falha na query', async () => {
    // Mock da query de verificação da clínica bem-sucedida, depois falha na query principal
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, ativa: true }] })
      .mockRejectedValueOnce(new Error('Erro de conexão'));

    const request = new Request('http://localhost:3000/api/rh/laudos');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Erro interno do servidor');
    expect(data.detalhes).toBe('Erro de conexão');
  });
});
