import { GET } from '@/app/api/rh/lotes/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireAuth: jest.fn(),
}));

import { queryWithContext } from '@/lib/db-security';
import { requireAuth } from '@/lib/session';

const mockQueryWithContext = queryWithContext as jest.MockedFunction<
  typeof queryWithContext
>;
const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;

describe('/api/rh/lotes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Mock consistente seguindo política - sessão com clinica_id obrigatório
    mockRequireAuth.mockResolvedValue({
      cpf: '11111111111',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
  });

  it('deve retornar lotes da empresa com estatísticas completas', async () => {
    const mockEmpresa = [{ id: 1, clinica_id: 1 }];
    const mockLotes = [
      {
        id: 1,
        codigo: 'LOTE-001',
        titulo: 'Avaliação Psicossocial',
        descricao: 'Descrição do lote',
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

    // Mock da verificação de empresa
    mockQueryWithContext.mockResolvedValueOnce({
      rowCount: 1,
      rows: mockEmpresa,
    });
    // Mock da query de lotes
    mockQueryWithContext.mockResolvedValueOnce({ rows: mockLotes });

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.lotes).toHaveLength(1);
    expect(data.lotes[0]).toMatchObject({
      id: 1,
      codigo: 'LOTE-001',
      titulo: 'Avaliação Psicossocial',
      tipo: 'operacional',
      status: 'ativo',
      liberado_em: '2025-12-16T10:00:00Z',
      liberado_por: '11111111111',
      liberado_por_nome: 'RH Teste',
      total_avaliacoes: 5,
      avaliacoes_concluidas: 3,
      avaliacoes_inativadas: 1,
    });
  });

  it('deve retornar erro 400 quando empresa_id não é fornecido', async () => {
    const request = new Request('http://localhost:3000/api/rh/lotes');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('ID da empresa é obrigatório');
  });

  it('deve retornar erro 403 para usuário sem perfil RH', async () => {
    // Mock sessão sem perfil adequado
    mockRequireAuth.mockResolvedValue({
      cpf: '12345678901',
      nome: 'Funcionário Teste',
      perfil: 'funcionario',
      clinica_id: 1,
    });

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar erro 404 quando empresa não existe', async () => {
    // Mock empresa não encontrada
    mockQueryWithContext.mockResolvedValueOnce({ rowCount: 0, rows: [] });

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=999'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Empresa não encontrada');
  });

  it('deve respeitar o parâmetro limit', async () => {
    const mockEmpresa = [{ id: 1, clinica_id: 1 }];
    const mockLotes = [
      {
        id: 1,
        codigo: 'LOTE-001',
        titulo: 'Avaliação 1',
        descricao: 'Descrição 1',
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

    mockQueryWithContext.mockResolvedValueOnce({
      rowCount: 1,
      rows: mockEmpresa,
    });
    mockQueryWithContext.mockResolvedValueOnce({ rows: mockLotes });

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=1&limit=5'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockQueryWithContext).toHaveBeenLastCalledWith(
      expect.stringContaining('LIMIT $2'),
      ['1', 5]
    );
  });

  it('deve retornar erro 500 em caso de falha na query', async () => {
    // Mock falha na query
    mockQueryWithContext.mockRejectedValueOnce(new Error('Erro de conexão'));

    const request = new Request(
      'http://localhost:3000/api/rh/lotes?empresa_id=1'
    );
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Erro interno do servidor');
    expect(data.detalhes).toBe('Erro de conexão');
  });
});
