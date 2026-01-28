/**
 * Testes para recálculo de status de lote e emissão imediata
 * Cobre especialmente o caso em que avaliações inativadas são contadas
 * como parte do total, e a emissão deve ocorrer quando (concluídas + inativadas) = total
 */

import { query } from '@/lib/db';
import { recalcularStatusLote, recalcularStatusLotePorId } from '@/lib/lotes';
import type { QueryResult } from 'pg';
import { emitirLaudoImediato } from '@/lib/laudo-auto';

jest.mock('@/lib/db');
jest.mock('@/lib/laudo-auto', () => ({
  emitirLaudoImediato: jest.fn().mockResolvedValue(true),
}));

const mockQuery = jest.mocked(query, true);

describe('Recalculo de status e emissão imediata (inativadas)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve marcar lote como concluído e chamar emitirLaudoImediato quando ativas=concluidas>0 (inativadas presentes)', async () => {
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

    // emitirLaudoImediato will be dynamically imported and should be called
    await recalcularStatusLote(1001);

    expect(mockQuery).toHaveBeenCalled();

    const updateCalls = mockQuery.mock.calls.filter(
      (c) =>
        c[0] &&
        typeof c[0] === 'string' &&
        c[0].includes('UPDATE lotes_avaliacao')
    );
    expect(updateCalls.length).toBeGreaterThan(0);

    expect(emitirLaudoImediato).toHaveBeenCalledWith(42);
  });

  it('recalcularStatusLotePorId deve marcar concluído e emitir quando (concluidas + inativadas) = total', async () => {
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
    expect(emitirLaudoImediato).toHaveBeenCalledWith(77);
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
    expect(emitirLaudoImediato).not.toHaveBeenCalledWith(99);
  });
});
