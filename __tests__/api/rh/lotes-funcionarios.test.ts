/**
 * @file __tests__/api/rh/lotes-funcionarios.test.ts
 * Testes: /api/rh/lotes/[id]/funcionarios - GET
 */

import { NextRequest } from 'next/server';

// Mock das dependências conforme MOCKS_POLICY.md
const mockQuery = jest.fn();
const mockRequireAuth = jest.fn();
const mockRequireRHWithEmpresaAccess = jest.fn();
const mockGetFuncionariosPorLote = jest.fn();
const mockGetLoteInfo = jest.fn();
const mockGetLoteEstatisticas = jest.fn();
const mockTransactionWithContext = jest.fn();

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

jest.mock('@/lib/db-security', () => ({
  transactionWithContext: mockTransactionWithContext,
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

  it('deve retornar total_respostas para cada funcionário na coleta', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({
      clinica_id: 1,
    } as any);
    mockGetLoteInfo.mockResolvedValue({
      id: 30,
      descricao: 'Lote Março 2026',
      tipo: 'completo',
      status: 'ativo',
      empresa_nome: 'Empresa Teste',
    });

    const mockFuncionarios = [
      {
        cpf: '99977387052',
        nome: 'Eliana Ferreira',
        setor: 'Produção',
        funcao: 'Operadora',
        matricula: null,
        nivel_cargo: 'operacional',
        turno: null,
        escala: null,
        avaliacao_id: 63,
        status_avaliacao: 'em_andamento',
        data_inicio: '2026-03-09T10:00:00Z',
        data_conclusao: null,
      },
      {
        cpf: '12512243001',
        nome: 'Paulo Ribeiro',
        setor: 'Gestão',
        funcao: 'Gerente',
        matricula: null,
        nivel_cargo: 'gestao',
        turno: null,
        escala: null,
        avaliacao_id: 64,
        status_avaliacao: 'iniciada',
        data_inicio: '2026-03-09T09:00:00Z',
        data_conclusao: null,
      },
    ];
    mockGetFuncionariosPorLote.mockResolvedValue(mockFuncionarios);

    const mockQueryTx = jest
      .fn()
      // 1ª call: COUNT avaliacoes (estatísticas)
      .mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '2',
            avaliacoes_concluidas: '0',
            avaliacoes_inativadas: '0',
            avaliacoes_pendentes: '2',
          },
        ],
      })
      // 2ª call: dados de inativação
      .mockResolvedValueOnce({ rows: [] })
      // 3ª call: total_respostas bulk
      .mockResolvedValueOnce({
        rows: [
          { avaliacao_id: 63, total: '12' },
          { avaliacao_id: 64, total: '1' },
        ],
      });

    mockTransactionWithContext.mockImplementation(
      async (callback: (q: typeof mockQueryTx) => Promise<void>) => {
        await callback(mockQueryTx);
      }
    );

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/30/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '30' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.funcionarios).toHaveLength(2);

    // Eliana: 12 respostas em andamento
    const eliana = data.funcionarios.find(
      (f: { cpf: string }) => f.cpf === '99977387052'
    );
    expect(eliana.avaliacao.total_respostas).toBe(12);
    expect(eliana.avaliacao.status).toBe('em_andamento');

    // Paulo: 1 resposta — iniciada
    const paulo = data.funcionarios.find(
      (f: { cpf: string }) => f.cpf === '12512243001'
    );
    expect(paulo.avaliacao.total_respostas).toBe(1);
    expect(paulo.avaliacao.status).toBe('iniciada');
  });

  it('deve retornar total_respostas = 0 para funcionário que ainda não respondeu', async () => {
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
    mockRequireRHWithEmpresaAccess.mockResolvedValueOnce({
      clinica_id: 1,
    } as any);
    mockGetLoteInfo.mockResolvedValue({
      id: 30,
      tipo: 'completo',
      status: 'ativo',
      empresa_nome: 'Empresa Teste',
    });

    mockGetFuncionariosPorLote.mockResolvedValue([
      {
        cpf: '06382790036',
        nome: 'Quelen Torres',
        setor: 'RH',
        funcao: 'Analista',
        matricula: null,
        nivel_cargo: 'gestao',
        turno: null,
        escala: null,
        avaliacao_id: 65,
        status_avaliacao: 'iniciada',
        data_inicio: '2026-03-09T08:00:00Z',
        data_conclusao: null,
      },
    ]);

    const mockQueryTx = jest
      .fn()
      .mockResolvedValueOnce({
        rows: [
          {
            total_avaliacoes: '1',
            avaliacoes_concluidas: '0',
            avaliacoes_inativadas: '0',
            avaliacoes_pendentes: '1',
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      // bulk total_respostas: avaliacao 65 não tem respostas (ausente no resultado)
      .mockResolvedValueOnce({ rows: [] });

    mockTransactionWithContext.mockImplementation(
      async (callback: (q: typeof mockQueryTx) => Promise<void>) => {
        await callback(mockQueryTx);
      }
    );

    const request = new NextRequest(
      'http://localhost:3000/api/rh/lotes/30/funcionarios?empresa_id=100'
    );
    const context = { params: { id: '30' } };

    const response = await GET(request, context);
    const data = await response.json();

    expect(response.status).toBe(200);
    const quelen = data.funcionarios[0];
    expect(quelen.avaliacao.total_respostas).toBe(0);
  });
});
