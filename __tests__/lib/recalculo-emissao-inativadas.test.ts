/**
 * Testes para recálculo de status de lote
 * Cobre especialmente o caso em que avaliações inativadas são contadas
 * como parte do total.
 *
 * NOTA: Emissão automática foi REMOVIDA do sistema.
 * Lote fica 'concluido' e vai para fila_emissao, mas NÃO emite automaticamente.
 */

import { query } from '@/lib/db';
import { recalcularStatusLote, recalcularStatusLotePorId } from '@/lib/lotes';
import type { QueryResult } from 'pg';

jest.mock('@/lib/db');

const mockQuery = jest.mocked(query, true);

describe('Recalculo de status (sem emissão automática)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve marcar lote como concluído quando ativas=concluidas>0 (inativadas presentes)', async () => {
    // 1) SELECT lote_id FROM avaliacoes WHERE id = $1
    mockQuery.mockResolvedValueOnce({
      rows: [{ lote_id: 42 }],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // 2) stats: total=5, ativas=3, concluidas=3, iniciadas=0 -> concluido
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_avaliacoes: '5',
          ativas: '3',
          concluidas: '3',
          inativadas: '2',
          iniciadas: '0',
        },
      ],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // 3) SELECT status FROM lotes_avaliacao
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'ativo' }],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // 4) UPDATE lotes_avaliacao (status)
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    await recalcularStatusLote(1001);

    expect(mockQuery).toHaveBeenCalled();

    const updateCalls = mockQuery.mock.calls.filter(
      (c) =>
        c[0] &&
        typeof c[0] === 'string' &&
        c[0].includes('UPDATE lotes_avaliacao')
    );
    expect(updateCalls.length).toBeGreaterThan(0);

    // NOTA: emissão automática foi removida. Lote fica 'concluido' apenas.
  });

  it('recalcularStatusLotePorId deve marcar concluído quando (concluidas + inativadas) = total', async () => {
    // stats for loteId 77: total 4, ativas 2, concluidas 2, iniciadas 0 -> concluido
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_avaliacoes: '4',
          ativas: '2',
          concluidas: '2',
          inativadas: '2',
          iniciadas: '0',
        },
      ],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // SELECT status FROM lotes_avaliacao
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'ativo' }],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // UPDATE lotes_avaliacao
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    const res = await recalcularStatusLotePorId(77);
    expect(res.novoStatus).toBe('concluido');
    expect(res.loteFinalizado).toBe(true);
    // NOTA: emissão automática foi removida.
  });

  it('deve cancelar lote se todas avaliações forem inativadas (ativas = 0)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          total_avaliacoes: '3',
          ativas: '0',
          concluidas: '0',
          inativadas: '3',
          iniciadas: '0',
        },
      ],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // SELECT status
    mockQuery.mockResolvedValueOnce({
      rows: [{ status: 'ativo' }],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    // UPDATE to cancel
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    } as unknown as QueryResult<unknown>);

    const res = await recalcularStatusLotePorId(99);
    expect(res.novoStatus).toBe('cancelado');
    expect(res.loteFinalizado).toBe(false);
    // NOTA: emissão automática foi removida.
  });
});
