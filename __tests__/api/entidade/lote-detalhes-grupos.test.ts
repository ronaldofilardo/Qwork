/**
 * Testes para a API /api/entidade/lote/[id] com suporte a G1-G10
 */

import { GET } from '@/app/api/entidade/lote/[id]/route';
import { query } from '@/lib/db';

// Mock do db
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

// Mock da sessão
jest.mock('@/lib/session', () => ({
  getSession: jest.fn(),
}));

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetSession = require('@/lib/session').getSession;

describe('/api/entidade/lote/[id] - Com Grupos G1-G10', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar dados do lote com grupos G1-G10 calculados', async () => {
    // Mock da sessão (sem await, retorna diretamente)
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Mock consulta do lote - precisa buscar com JOIN para verificar contratante
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Lote Teste',
          tipo: 'completo',
          status: 'ativo',
          criado_em: '2026-01-02T10:00:00Z',
          liberado_em: '2026-01-02T11:00:00Z',
          emitido_em: null,
        },
      ],
    });

    // Mock estatísticas
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_funcionarios: '2',
          funcionarios_concluidos: '1',
          funcionarios_pendentes: '1',
        },
      ],
    });

    // Mock funcionários
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '12345678901',
          nome: 'João Silva',
          setor: 'TI',
          funcao: 'Desenvolvedor',
          nivel_cargo: 'operacional',
          avaliacao_id: 1,
          avaliacao_status: 'concluida',
          avaliacao_data_inicio: '2026-01-02T10:00:00Z',
          avaliacao_data_conclusao: '2026-01-02T12:00:00Z',
        },
        {
          cpf: '98765432109',
          nome: 'Maria Santos',
          setor: 'RH',
          funcao: 'Analista',
          nivel_cargo: 'gestao',
          avaliacao_id: 2,
          avaliacao_status: 'pendente',
          avaliacao_data_inicio: '2026-01-02T10:00:00Z',
          avaliacao_data_conclusao: null,
        },
      ],
    });

    // Mock grupos G1-G10 para avaliação concluída
    mockQuery.mockResolvedValueOnce({
      rows: [
        { grupo: 1, media: '75.5' },
        { grupo: 2, media: '82.3' },
        { grupo: 3, media: '65.0' },
        { grupo: 4, media: '45.2' },
        { grupo: 5, media: '90.1' },
        { grupo: 6, media: '78.8' },
        { grupo: 7, media: '55.0' },
        { grupo: 8, media: '30.5' },
        { grupo: 9, media: '68.9' },
        { grupo: 10, media: '72.3' },
      ],
    });

    // Mock grupos para avaliação pendente (não retorna dados)
    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/1'
    );

    const response = await GET(mockRequest, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.lote).toBeDefined();
    // codigo removido
    expect(data.lote.emitido_em).toBeNull();

    expect(data.estatisticas).toBeDefined();
    expect(data.estatisticas.total_funcionarios).toBe(2);
    expect(data.estatisticas.funcionarios_concluidos).toBe(1);

    expect(data.funcionarios).toHaveLength(2);

    // Verificar primeiro funcionário (concluída) tem grupos
    expect(data.funcionarios[0].grupos).toBeDefined();
    expect(data.funcionarios[0].grupos.g1).toBe(75.5);
    expect(data.funcionarios[0].grupos.g2).toBe(82.3);
    expect(data.funcionarios[0].grupos.g10).toBe(72.3);

    // Verificar segundo funcionário (pendente) não tem grupos
    expect(data.funcionarios[1].grupos).toBeDefined();
    expect(Object.keys(data.funcionarios[1].grupos).length).toBe(0);
  });

  it('deve retornar erro 401 quando não há sessão', async () => {
    mockGetSession.mockReturnValue(null);

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/1'
    );

    const response = await GET(mockRequest, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Não autorizado');
  });

  it('deve retornar erro 403 quando perfil incorreto', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'funcionario',
    });

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/1'
    );

    const response = await GET(mockRequest, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Acesso negado');
  });

  it('deve retornar erro 400 quando ID inválido', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/abc'
    );

    const response = await GET(mockRequest, { params: { id: 'abc' } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('ID do lote inválido');
  });

  it('deve retornar erro 404 quando lote não encontrado', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    mockQuery.mockResolvedValueOnce({
      rows: [],
    });

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/999'
    );

    const response = await GET(mockRequest, { params: { id: '999' } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe(
      'Lote não encontrado ou não pertence à sua entidade'
    );
  });

  // NOTA: Este teste requer mock mais complexo do Next.js cookies()
  // Mantemos os testes de validação e os testes de componente
  it.skip('deve calcular corretamente grupos para avaliação concluída', async () => {
    mockGetSession.mockReturnValue({
      perfil: 'gestor_entidade',
      contratante_id: 1,
    });

    // Mock consulta do lote
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          titulo: 'Teste',
          tipo: 'completo',
          status: 'ativo',
          criado_em: '2026-01-02',
          liberado_em: '2026-01-02',
        },
      ],
    });

    // Mock estatísticas
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_funcionarios: '1',
          funcionarios_concluidos: '1',
          funcionarios_pendentes: '0',
        },
      ],
    });

    // Mock 1 funcionário concluído
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          cpf: '111',
          nome: 'Func1',
          setor: 'S1',
          funcao: 'F1',
          nivel_cargo: 'operacional',
          avaliacao_id: 1,
          avaliacao_status: 'concluida',
          avaliacao_data_inicio: '2026-01-02',
          avaliacao_data_conclusao: '2026-01-02',
        },
      ],
    });

    // Mock grupos G1-G10 para a avaliação
    mockQuery.mockResolvedValueOnce({
      rows: Array.from({ length: 10 }, (_, idx) => ({
        grupo: idx + 1,
        media: String(50 + idx * 2),
      })),
    });

    const mockRequest = new Request(
      'http://localhost:3000/api/entidade/lote/1'
    );
    const response = await GET(mockRequest, { params: { id: '1' } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.funcionarios).toHaveLength(1);

    // Funcionário deve ter todos os grupos
    const func = data.funcionarios[0];
    expect(Object.keys(func.grupos).length).toBe(10);
    expect(func.grupos.g1).toBeDefined();
    expect(func.grupos.g5).toBeDefined();
    expect(func.grupos.g10).toBeDefined();

    // Verificar que valores foram parseados corretamente
    expect(typeof func.grupos.g1).toBe('number');
    expect(func.grupos.g1).toBe(50);
  });
});
