import { GET } from '@/app/api/rh/dashboard/route';

// Mock do módulo de banco de dados
jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

jest.mock('@/lib/session', () => ({
  requireRole: jest.fn(),
}));

jest.mock('next/cache', () => ({
  unstable_cache: jest.fn((fn) => fn),
}));

import { query } from '@/lib/db';
import { requireRole } from '@/lib/session';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockRequireRole = requireRole as jest.MockedFunction<typeof requireRole>;

describe('/api/rh/dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // ✅ Mock consistente seguindo política - mockResolvedValueOnce para controle preciso
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
  });

  it('deve retornar dados do dashboard RH com estatísticas corretas', async () => {
    const mockStats = {
      total_avaliacoes: 15,
      concluidas: 12,
      funcionarios_avaliados: 8,
    };

    // 10 grupos reais, nomes conforme banco
    const mockResultados = [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        media_score: '65.91',
        categoria: 'medio',
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0,
      },
      {
        grupo: 2,
        dominio: 'Organização e Conteúdo do Trabalho',
        media_score: '90.63',
        categoria: 'alto',
        total: 2,
        baixo: 0,
        medio: 0,
        alto: 2,
      },
      {
        grupo: 3,
        dominio: 'Relações Interpessoais e Liderança',
        media_score: '70.00',
        categoria: 'alto',
        total: 2,
        baixo: 0,
        medio: 0,
        alto: 2,
      },
      {
        grupo: 4,
        dominio: 'Interface Trabalho-Indivíduo',
        media_score: '60.00',
        categoria: 'medio',
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0,
      },
      {
        grupo: 5,
        dominio: 'Valores no Trabalho',
        media_score: '80.00',
        categoria: 'alto',
        total: 2,
        baixo: 0,
        medio: 0,
        alto: 2,
      },
      {
        grupo: 6,
        dominio: 'Personalidade (Opcional)',
        media_score: '75.00',
        categoria: 'alto',
        total: 2,
        baixo: 0,
        medio: 0,
        alto: 2,
      },
      {
        grupo: 7,
        dominio: 'Saúde e Bem-Estar',
        media_score: '55.00',
        categoria: 'medio',
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0,
      },
      {
        grupo: 8,
        dominio: 'Comportamentos Ofensivos',
        media_score: '40.00',
        categoria: 'medio',
        total: 2,
        baixo: 0,
        medio: 2,
        alto: 0,
      },
      {
        grupo: 9,
        dominio: 'Jogos de Apostas',
        media_score: '33.33',
        categoria: 'baixo',
        total: 2,
        baixo: 2,
        medio: 0,
        alto: 0,
      },
      {
        grupo: 10,
        dominio: 'Endividamento',
        media_score: '33.33',
        categoria: 'baixo',
        total: 2,
        baixo: 2,
        medio: 0,
        alto: 0,
      },
    ];

    const mockDistribuicao = [
      { categoria: 'baixo', total: 4 },
      { categoria: 'medio', total: 6 },
      { categoria: 'alto', total: 10 },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [mockStats], rowCount: 1 }) // Stats
      .mockResolvedValueOnce({ rows: mockResultados, rowCount: 10 }) // Resultados
      .mockResolvedValueOnce({ rows: mockDistribuicao, rowCount: 3 }); // Distribuição

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats).toEqual(mockStats);
    expect(data.resultados).toHaveLength(10);
    expect(data.distribuicao).toHaveLength(3);

    // Verifica se media_score é tratado corretamente como string
    expect(typeof data.resultados[0].media_score).toBe('string');
    expect(data.resultados[0].media_score).toBe('65.91');
  });

  it('deve converter media_score para number quando necessário', async () => {
    const mockStats = {
      total_avaliacoes: 5,
      concluidas: 3,
      funcionarios_avaliados: 2,
    };

    const mockResultados = [
      {
        grupo: 1,
        dominio: 'Test',
        media_score: '75.5',
        categoria: 'alto',
        total: 1,
        baixo: 0,
        medio: 0,
        alto: 1,
      },
    ];

    mockQuery
      .mockResolvedValueOnce({ rows: [mockStats], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockResultados, rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);

    // Verifica se o valor pode ser convertido para number sem erro
    const mediaScore = Number(data.resultados[0].media_score);
    expect(mediaScore).toBe(75.5);
    expect(mediaScore.toFixed(1)).toBe('75.5');
  });

  it('deve retornar dados vazios quando não há avaliações', async () => {
    const mockStats = {
      total_avaliacoes: 0,
      concluidas: 0,
      funcionarios_avaliados: 0,
    };

    mockQuery
      .mockResolvedValueOnce({ rows: [mockStats], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.stats.total_avaliacoes).toBe(0);
    expect(data.resultados).toHaveLength(0);
    expect(data.distribuicao).toHaveLength(0);
  });

  it('deve retornar erro 500 quando requireRole falha', async () => {
    mockRequireRole.mockRejectedValue(new Error('Acesso negado'));

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Erro ao buscar dados' });
  });

  it('deve retornar erro 500 quando query falha', async () => {
    mockRequireRole.mockResolvedValue({
      cpf: '12345678901',
      nome: 'RH Teste',
      perfil: 'rh',
      clinica_id: 1,
    });
    mockQuery.mockRejectedValue(new Error('Erro de banco'));

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Erro ao buscar dados' });
  });

  it('deve incluir todos os grupos do COPSOQ III nos resultados', async () => {
    const mockStats = {
      total_avaliacoes: 10,
      concluidas: 10,
      funcionarios_avaliados: 1,
    };

    // Mock com todos os 10 grupos
    const mockResultadosCompletos = [
      {
        grupo: 1,
        dominio: 'Demandas no Trabalho',
        media_score: '65.91',
        categoria: 'medio',
        total: 1,
        baixo: 0,
        medio: 1,
        alto: 0,
      },
      {
        grupo: 2,
        dominio: 'Organização e Conteúdo',
        media_score: '90.63',
        categoria: 'alto',
        total: 1,
        baixo: 0,
        medio: 0,
        alto: 1,
      },
      {
        grupo: 3,
        dominio: 'Relações e Liderança',
        media_score: '75.00',
        categoria: 'alto',
        total: 1,
        baixo: 0,
        medio: 0,
        alto: 1,
      },
      {
        grupo: 4,
        dominio: 'Conflito Trabalho-Família',
        media_score: '33.33',
        categoria: 'baixo',
        total: 1,
        baixo: 1,
        medio: 0,
        alto: 0,
      },
      {
        grupo: 5,
        dominio: 'Saúde e Bem-Estar',
        media_score: '62.50',
        categoria: 'medio',
        total: 1,
        baixo: 0,
        medio: 1,
        alto: 0,
      },
      {
        grupo: 6,
        dominio: 'Comportamentos Ofensivos',
        media_score: '50.00',
        categoria: 'medio',
        total: 1,
        baixo: 0,
        medio: 1,
        alto: 0,
      },
      {
        grupo: 7,
        dominio: 'Personalidade',
        media_score: '34.38',
        categoria: 'baixo',
        total: 1,
        baixo: 1,
        medio: 0,
        alto: 0,
      },
      {
        grupo: 8,
        dominio: 'Suporte Organizacional',
        media_score: '33.33',
        categoria: 'baixo',
        total: 1,
        baixo: 1,
        medio: 0,
        alto: 0,
      },
      {
        grupo: 9,
        dominio: 'Comportamento de Jogo',
        media_score: '33.33',
        categoria: 'baixo',
        total: 1,
        baixo: 1,
        medio: 0,
        alto: 0,
      },
      {
        grupo: 10,
        dominio: 'Endividamento Financeiro',
        media_score: '33.33',
        categoria: 'baixo',
        total: 1,
        baixo: 1,
        medio: 0,
        alto: 0,
      },
    ];

    mockQuery

      .mockResolvedValueOnce({ rows: [mockStats], rowCount: 1 })
      .mockResolvedValueOnce({ rows: mockResultadosCompletos, rowCount: 10 })
      .mockResolvedValueOnce({
        rows: [
          { categoria: 'baixo', total: 5 },
          { categoria: 'medio', total: 3 },
          { categoria: 'alto', total: 2 },
        ],
        rowCount: 3,
      });

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.resultados).toHaveLength(10);

    // Verifica grupos específicos
    const grupoJogos = data.resultados.find((r: any) => r.grupo === 9);
    const grupoEndividamento = data.resultados.find((r: any) => r.grupo === 10);

    expect(grupoJogos).toBeDefined();
    expect(grupoJogos.dominio).toBe('Comportamento de Jogo');
    expect(grupoEndividamento).toBeDefined();
    expect(grupoEndividamento.dominio).toBe('Endividamento Financeiro');
  });

  it('deve validar consultas SQL corretas', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [
          { total_avaliacoes: 1, concluidas: 1, funcionarios_avaliados: 1 },
        ],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const mockRequest = {
      nextUrl: { searchParams: { get: () => null } },
    } as any;
    await GET(mockRequest);

    // Verifica se as queries corretas foram chamadas
    expect(mockQuery).toHaveBeenCalledTimes(3);

    // Query de estatísticas
    expect(mockQuery.mock.calls[0][0]).toContain(
      "FILTER (WHERE a.status != 'inativada')"
    );
    expect(mockQuery.mock.calls[0][0]).toContain('total_avaliacoes');
    expect(mockQuery.mock.calls[0][0]).toContain('concluidas');
    expect(mockQuery.mock.calls[0][0]).toContain('funcionarios_avaliados');

    // Query de resultados
    expect(mockQuery.mock.calls[1][0]).toContain('AVG(r.score)');
    expect(mockQuery.mock.calls[1][0]).toContain('media_score');
    expect(mockQuery.mock.calls[1][0]).toContain('GROUP BY r.grupo, r.dominio');

    // Query de distribuição
    expect(mockQuery.mock.calls[2][0]).toContain('categoria');
    expect(mockQuery.mock.calls[2][0]).toContain('GROUP BY r.categoria');
  });
});
