/**
 * @file __tests__/api/avaliacao/save.test.ts
 * Testes: API /api/avaliacao/save
 */

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
  getDatabaseUrl: jest.fn(() => process.env.TEST_DATABASE_URL),
}));
jest.mock('@/lib/session');
jest.mock('@/lib/db-security', () => ({
  queryWithContext: jest.fn(),
}));
jest.mock('@/lib/lotes', () => ({
  recalcularStatusLote: jest.fn(),
}));
jest.mock('@/lib/calculate', () => ({
  calcularResultados: jest.fn(() => [
    { grupo: 1, dominio: 'Demanda', score: 75, categoria: 'medio' },
  ]),
}));
jest.mock('@/lib/avaliacao-conclusao', () => ({
  verificarEConcluirAvaliacao: jest.fn(),
}));
jest.mock('@/lib/questoes', () => ({
  grupos: [
    {
      id: 1,
      itens: [{ id: 'Q1' }, { id: 'Q2' }],
      dominio: 'Demanda',
      tipo: 'normal',
    },
    {
      id: 2,
      itens: [{ id: 'Q3' }, { id: 'Q13' }],
      dominio: 'Controle',
      tipo: 'normal',
    },
  ],
}));

import { POST } from '@/app/api/avaliacao/save/route';
import * as dbSecurity from '@/lib/db-security';
import * as session from '@/lib/session';
import * as avaliacaoConclusao from '@/lib/avaliacao-conclusao';

function mockDbSeq(
  avaliacao: object,
  ...extraCalls: object[]
) {
  const mock = dbSecurity.queryWithContext as jest.Mock;
  mock.mockResolvedValueOnce({ rows: [avaliacao], rowCount: 1 }); // SELECT avaliacao
  extraCalls.forEach((r) => mock.mockResolvedValueOnce(r));       // INSERT respostas / COUNT
  mock.mockResolvedValue({ rows: [], rowCount: 1 });               // DEFAULT
}

describe('API /api/avaliacao/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (avaliacaoConclusao.verificarEConcluirAvaliacao as jest.Mock).mockResolvedValue({
      concluida: false,
    });
  });

  it('deve avançar grupo_atual se todas as respostas do grupo forem preenchidas', async () => {
    // SELECT avaliacao → existe; INSERT Q1 → ok; INSERT Q2 → ok; COUNT → 2; UPDATE → ok
    mockDbSeq(
      { id: 1, lote_id: null },
      { rows: [], rowCount: 1 }, // INSERT Q1
      { rows: [], rowCount: 1 }, // INSERT Q2
      { rows: [{ total: '2' }], rowCount: 1 }, // COUNT
    );

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [
          { item: 'Q1', valor: 1, grupo: 1 },
          { item: 'Q2', valor: 2, grupo: 1 },
        ],
      }),
    };

    const res = await POST(mockRequest as any);
    expect(res.status).toBe(200);

    // grupo avanço: respostas.length (2) >= itens do grupo (2) → grupoAtual = 1+1 = 2
    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      [2, 'em_andamento', 1]
    );
  });

  it('deve manter grupo_atual se grupo está incompleto', async () => {
    mockDbSeq(
      { id: 1, lote_id: null },
      { rows: [], rowCount: 1 }, // INSERT Q1
      { rows: [{ total: '1' }], rowCount: 1 }, // COUNT
    );

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }], // apenas 1 de 2
      }),
    };

    const res = await POST(mockRequest as any);
    expect(res.status).toBe(200);

    // grupo NÃO avança: respostas.length (1) < itens do grupo (2) → grupoAtual = 1
    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      [1, 'em_andamento', 1]
    );
  });

  it('deve atualizar status para em_andamento sempre que salvar', async () => {
    mockDbSeq(
      { id: 1, lote_id: null },
      { rows: [], rowCount: 1 }, // INSERT Q1
      { rows: [{ total: '1' }], rowCount: 1 }, // COUNT
    );

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }],
      }),
    };

    const res = await POST(mockRequest as any);
    expect(res.status).toBe(200);

    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      expect.arrayContaining(['em_andamento', 1])
    );
  });
});
