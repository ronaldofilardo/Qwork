global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

import { POST } from '@/app/api/avaliacao/save/route';
import * as db from '@/lib/db';
import * as session from '@/lib/session';

jest.mock('@/lib/db');
jest.mock('@/lib/session');
jest.mock('@/lib/questoes', () => ({
  grupos: [
    { id: 1, itens: [{ id: 'Q1' }, { id: 'Q2' }] },
    { id: 2, itens: [{ id: 'Q3' }, { id: 'Q13' }] },
  ],
}));

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
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 }) // Busca avaliação existente
      .mockResolvedValue({}) // Upsert respostas
      .mockResolvedValue({}); // Update final

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

    // Verifica se o UPDATE foi chamado com grupo_atual = 2 (próximo grupo)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE avaliacoes SET grupo_atual = $1, status = $2'
      ),
      [2, 'em_andamento', 1]
    );
  });

  it('deve manter grupo_atual se grupo está incompleto', async () => {
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
      .mockResolvedValue({})
      .mockResolvedValue({});

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }], // Apenas 1 resposta de 2 possíveis
      }),
    };

    await POST(mockRequest as any);

    // Verifica se o UPDATE foi chamado com grupo_atual = 1 (mesmo grupo)
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE avaliacoes SET grupo_atual = $1, status = $2'
      ),
      [1, 'em_andamento', 1]
    );
  });

  it('deve atualizar status para em_andamento sempre que salvar', async () => {
    (session.requireAuth as jest.Mock).mockResolvedValue({
      cpf: '123',
      nome: 'Teste',
      perfil: 'funcionario',
    });
    (db.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 })
      .mockResolvedValue({})
      .mockResolvedValue({});

    const mockRequest = {
      json: jest.fn().mockResolvedValue({
        grupo: 1,
        respostas: [{ item: 'Q1', valor: 1, grupo: 1 }],
      }),
    };

    await POST(mockRequest as any);

    // Verifica se o status sempre é atualizado para 'em_andamento'
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'UPDATE avaliacoes SET grupo_atual = $1, status = $2'
      ),
      expect.arrayContaining([1, 'em_andamento', 1])
    );
  });
});
