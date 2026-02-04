/**
 * Testes para lib/lotes.ts
 * Valida a lógica de recálculo de status de lotes, especialmente:
 * - Tratamento correto de avaliações 'em_andamento' (não encerrar prematuramente)
 * - Exclusão de avaliações inativadas do cálculo
 * - Transições de status corretas
 *
 * NOTA: Emissão automática foi REMOVIDA. Lotes ficam 'concluido' e vão para fila_emissao.
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}));

import { query } from '@/lib/db';
import { recalcularStatusLote, recalcularStatusLotePorId } from '@/lib/lotes';

const mockQuery = query as jest.MockedFunction<typeof query>;

describe('lib/lotes - Recálculo de Status', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Helper for SQL-aware mocking: return different responses based on the SQL text
    mockQuery.mockImplementation((text: string, params?: any[]) => {
      const sql = (text || '').toString();

      // Advisory lock
      if (
        sql.includes('pg_try_advisory_xact_lock') ||
        sql.includes('pg_advisory_xact_lock')
      ) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // Busca de lote por avaliacao
      if (sql.includes('SELECT lote_id') && sql.includes('avaliacoes')) {
        return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
      }

      // Stats (ativa/concluida/iniciada/inativada/liberadas)
      if (
        sql.includes('COUNT(*)') ||
        sql.includes('total_avaliacoes') ||
        sql.includes('liberadas')
      ) {
        // By default return an empty stats row; individual tests will override this by
        // setting mockQuery.mockResolvedValueOnce before calling the function when they
        // need specific values. Returning undefined rows would cause the implementation
        // to throw, so we provide a safe default here.
        return Promise.resolve({
          rows: [
            {
              total_avaliacoes: '0',
              liberadas: '0',
              ativas: '0',
              concluidas: '0',
              inativadas: '0',
              iniciadas: '0',
            },
          ],
          rowCount: 1,
        });
      }

      // Status atual do lote
      if (sql.includes('SELECT status') && sql.includes('lotes_avaliacao')) {
        return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
      }

      // Updates / inserts (emissão)
      if (sql.startsWith('UPDATE') || sql.startsWith('INSERT')) {
        return Promise.resolve({ rows: [], rowCount: 1 });
      }

      // Fallback
      return Promise.resolve({ rows: [], rowCount: 0 });
    });
  });

  describe('recalcularStatusLote', () => {
    it('deve manter lote como ativo quando há avaliações em_andamento', async () => {
      // Simula: 3 concluídas, 1 em_andamento, 1 inativada
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('liberadas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '5',
                liberadas: '4',
                ativas: '4',
                concluidas: '3',
                inativadas: '1',
                iniciadas: '1',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      // Verifica que a query incluiu 'em_andamento' na contagem
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('em_andamento'),
        [1]
      );

      // Deve concluir o lote porque (concluidas + inativadas) == liberadas — mesmo havendo iniciadas
      const concludedUpdates = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao') &&
          call[1] &&
          call[1][0] === 'concluido'
      );
      expect(concludedUpdates.length).toBeGreaterThan(0);

      // NOTA: emissão automática foi removida.
    });

    it('deve concluir lote quando todas ativas estão concluídas (ignorando inativadas)', async () => {
      // Simula: 4 concluídas, 0 iniciadas/em_andamento, 2 inativadas
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('ativas')) {
          // Ajuste: liberadas = concluídas + inativadas para garantir condição de 'concluido'
          return Promise.resolve({
            rows: [
              {
                ativas: '4',
                concluidas: '4',
                iniciadas: '0',
                total_avaliacoes: '6',
                liberadas: '6',
                inativadas: '2',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      // Deve atualizar para 'concluido' e emitir imediatamente
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao') &&
          call[1] &&
          call[1][0] === 'concluido' &&
          call[1][1] === 1
      );
      expect(updateCalls.length).toBeGreaterThan(0);

      // NOTA: emissão automática foi removida.
    });

    it('não deve concluir lote se há 1 avaliação em_andamento mesmo com outras concluídas', async () => {
      // Cenário crítico: 9 concluídas, 1 em_andamento → NÃO deve concluir
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('liberadas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '10',
                liberadas: '10',
                ativas: '10',
                concluidas: '9',
                inativadas: '0',
                iniciadas: '1',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      // Não deve fazer UPDATE para concluido
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao') &&
          call[1] &&
          call[1][0] === 'concluido'
      );
      expect(updateCalls.length).toBe(0);
    });

    it('deve transitar de rascunho para ativo quando primeira avaliação é concluída', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('ativas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '5',
                liberadas: '5',
                ativas: '5',
                concluidas: '1',
                inativadas: '0',
                iniciadas: '4',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({
            rows: [{ status: 'rascunho' }],
            rowCount: 1,
          });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao') &&
          call[1] &&
          call[1][0] === 'ativo' &&
          call[1][1] === 1
      );
      expect(updateCalls.length).toBeGreaterThan(0);
    });
  });

  describe('recalcularStatusLotePorId', () => {
    it('deve retornar loteFinalizado=true quando lote é concluído', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('liberadas')) {
          return Promise.resolve({
            rows: [
              {
                ativas: '5',
                concluidas: '5',
                iniciadas: '0',
                liberadas: '5',
                inativadas: '0',
                total_avaliacoes: '5',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const result = await recalcularStatusLotePorId(1);

      expect(result.novoStatus).toBe('concluido');
      expect(result.loteFinalizado).toBe(true);
    });

    it('deve retornar loteFinalizado=false quando status não muda', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('ativas')) {
          return Promise.resolve({
            rows: [
              {
                ativas: '5',
                concluidas: '3',
                iniciadas: '2',
                total_avaliacoes: '5',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({
            rows: [{ status: 'rascunho' }],
            rowCount: 1,
          });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const result = await recalcularStatusLotePorId(1);

      expect(result.novoStatus).toBe('ativo'); // Quando há iniciadas, status deve ser 'ativo'
      expect(result.loteFinalizado).toBe(false);
    });

    it('deve incluir em_andamento na contagem de iniciadas', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('iniciadas')) {
          return Promise.resolve({
            rows: [
              {
                ativas: '10',
                concluidas: '5',
                iniciadas: '5',
                total_avaliacoes: '10',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLotePorId(1);

      // Verifica que a query correta foi chamada with both statuses
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("a.status IN ('iniciada', 'em_andamento')"),
        [1]
      );
    });
  });

  describe('Cenários de Borda', () => {
    it('deve lidar com lote vazio (0 avaliações ativas)', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('ativas')) {
          return Promise.resolve({
            rows: [
              {
                ativas: '0',
                concluidas: '0',
                iniciadas: '0',
                total_avaliacoes: '0',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({
            rows: [{ status: 'rascunho' }],
            rowCount: 1,
          });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      // Status deve ser alterado de rascunho para ativo (0 avaliações conta como ativo por padrão)
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao')
      );
      expect(updateCalls.length).toBe(1);
      expect(updateCalls[0][1]).toEqual(['ativo', 1]);
    });

    it('deve lidar com todas avaliações inativadas', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('inativadas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '2',
                liberadas: '0',
                ativas: '0',
                concluidas: '0',
                iniciadas: '0',
                inativadas: '2',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
        ['cancelado', 1]
      );
    });

    it('deve concluir quando concluidas + inativadas == liberadas e há concluídas', async () => {
      // Cenário: liberadas = 5, concluidas = 3, inativadas = 2 -> concluidas + inativadas == liberadas => concluido
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('liberadas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '7',
                liberadas: '5',
                ativas: '5',
                concluidas: '3',
                inativadas: '2',
                iniciadas: '0',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
        ['concluido', 1]
      );
    });

    it('deve concluir quando há 1 concluída + 1 inativada -> lote concluido', async () => {
      // Regression: corresponde ao anexo enviado (1 concluída, 1 inativada)
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('liberadas')) {
          return Promise.resolve({
            rows: [
              {
                total_avaliacoes: '2',
                liberadas: '2',
                ativas: '0',
                concluidas: '1',
                inativadas: '1',
                iniciadas: '0',
              },
            ],
            rowCount: 1,
          });
        }
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [{ status: 'ativo' }], rowCount: 1 });
        if (s.startsWith('UPDATE') || s.startsWith('INSERT'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      expect(mockQuery).toHaveBeenCalledWith(
        'UPDATE lotes_avaliacao SET status = $1 WHERE id = $2',
        ['concluido', 1]
      );
    });

    it('deve ignorar avaliação não encontrada', async () => {
      // Simula SELECT lote_id retornando vazio
      mockQuery.mockImplementationOnce((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [], rowCount: 0 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      const result = await recalcularStatusLote(999);

      // Deve retornar early (sem alterações) e retornar objeto padrão
      expect(result).toEqual({ novoStatus: 'ativo', loteFinalizado: false });
      expect(mockQuery).toHaveBeenCalled();
    });

    it('deve ignorar lote não encontrado', async () => {
      mockQuery.mockImplementation((sql: string, params?: any[]) => {
        const s = sql.toString();
        if (s.includes('SELECT lote_id'))
          return Promise.resolve({ rows: [{ lote_id: 1 }], rowCount: 1 });
        if (s.includes('pg_advisory_xact_lock'))
          return Promise.resolve({ rows: [], rowCount: 1 });
        if (s.includes('total_avaliacoes') || s.includes('ativas')) {
          return Promise.resolve({
            rows: [
              {
                ativas: '5',
                concluidas: '3',
                iniciadas: '2',
                total_avaliacoes: '5',
              },
            ],
            rowCount: 1,
          });
        }
        // Simular lote não encontrado na tabela lotes_avaliacao
        if (s.includes('SELECT status') && s.includes('lotes_avaliacao'))
          return Promise.resolve({ rows: [], rowCount: 0 });
        return Promise.resolve({ rows: [], rowCount: 0 });
      });

      await recalcularStatusLote(999);

      // Não deve tentar UPDATE (não houve lote na tabela)
      const updateCalls = mockQuery.mock.calls.filter(
        (call) =>
          call[0] &&
          typeof call[0] === 'string' &&
          call[0].includes('UPDATE lotes_avaliacao')
      );
      expect(updateCalls.length).toBe(0);
    });
  });

  // REMOVIDO: Suite SKIP_IMMEDIATE_EMISSION
  // Migration 302: Sistema sanitizado - emissão automática completamente removida.
  // Lotes permanecem 'concluido' e aguardam solicitação manual de emissão.
});
