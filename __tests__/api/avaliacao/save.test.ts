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
import * as db from '@/lib/db';
import * as dbSecurity from '@/lib/db-security';
import * as session from '@/lib/session';

describe('API /api/avaliacao/save', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve avançar grupo_atual se todas as respostas do grupo forem preenchidas', async () => {
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: null }], rowCount: 1 }) // Busca avaliação existente
      .mockResolvedValue({ rows: [], rowCount: 1 }) // INSERT respostas
      .mockResolvedValueOnce({ rows: [{ total: '2' }], rowCount: 1 }); // COUNT respostas (< 37)

    (dbSecurity.queryWithContext as jest.Mock).mockResolvedValue({
      rows: [],
      rowCount: 1,
    }); // UPDATE com context

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [
          { item: 'Q1', valor: 1, grupo: 1 },
          { item: 'Q2', valor: 2, grupo: 1 },
        ],
      }),
    };

    await POST(mockRequest as any);

    // Verifica se o queryWithContext foi chamado para UPDATE
    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      [2, 'em_andamento', 1],
      expect.objectContaining({ cpf: '123' })
    );
  });

  it('deve manter grupo_atual se grupo está incompleto', async () => {
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: null }], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    (dbSecurity.queryWithContext as jest.Mock).mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }], // Apenas 1 resposta de 2 possíveis
      }),
    };

    await POST(mockRequest as any);

    // Verifica se o queryWithContext foi chamado mantendo o mesmo grupo
    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      [1, 'em_andamento', 1],
      expect.objectContaining({ cpf: '123' })
    );
  });

  it('deve atualizar status para em_andamento sempre que salvar', async () => {
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1, lote_id: null }], rowCount: 1 })
      .mockResolvedValue({ rows: [], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: '1' }], rowCount: 1 });

    (dbSecurity.queryWithContext as jest.Mock).mockResolvedValue({
      rows: [],
      rowCount: 1,
    });

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }],
      }),
    };

    await POST(mockRequest as any);

    // Verifica se o status sempre é atualizado para 'em_andamento'
    expect(dbSecurity.queryWithContext).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE avaliacoes SET grupo_atual'),
      expect.arrayContaining([1, 'em_andamento', 1]),
      expect.objectContaining({ cpf: '123' })
    );
  });
});
