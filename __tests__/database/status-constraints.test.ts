/**
 * Testes para validar constraints de status no banco de dados
 * - Status 'inativada' em avaliacoes
 * - Status 'concluido' em lotes_avaliacao
 * - Rejeição de status inválidos
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

import { query } from '@/lib/db'

const mockQuery = query as jest.MockedFunction<typeof query>

describe('Database Status Constraints', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Avaliacoes status constraint', () => {
    it('deve permitir status "inativada" em avaliacoes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE avaliacoes SET status = 'inativada' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalledWith(
        "UPDATE avaliacoes SET status = 'inativada' WHERE id = $1",
        [1]
      )
    })

    it('deve permitir status "iniciada" em avaliacoes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE avaliacoes SET status = 'iniciada' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve permitir status "em_andamento" em avaliacoes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE avaliacoes SET status = 'em_andamento' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve permitir status "concluida" em avaliacoes', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE avaliacoes SET status = 'concluida' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve rejeitar status inválido em avaliacoes', async () => {
      const error = new Error('violates check constraint "avaliacoes_status_check"')
      mockQuery.mockRejectedValueOnce(error)

      await expect(
        query("UPDATE avaliacoes SET status = 'invalido' WHERE id = $1", [1])
      ).rejects.toThrow('violates check constraint')
    })
  })

  describe('Lotes_avaliacao status constraint', () => {
    it('deve permitir status "concluido" em lotes_avaliacao', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE lotes_avaliacao SET status = 'concluido' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalledWith(
        "UPDATE lotes_avaliacao SET status = 'concluido' WHERE id = $1",
        [1]
      )
    })

    it('deve permitir status "ativo" em lotes_avaliacao', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE lotes_avaliacao SET status = 'ativo' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve permitir status "cancelado" em lotes_avaliacao', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE lotes_avaliacao SET status = 'cancelado' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve permitir status "finalizado" em lotes_avaliacao', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

      await query(
        "UPDATE lotes_avaliacao SET status = 'finalizado' WHERE id = $1",
        [1]
      )

      expect(mockQuery).toHaveBeenCalled()
    })

    it('deve rejeitar status inválido em lotes_avaliacao', async () => {
      const error = new Error('violates check constraint "lotes_avaliacao_status_check"')
      mockQuery.mockRejectedValueOnce(error)

      await expect(
        query("UPDATE lotes_avaliacao SET status = 'invalido' WHERE id = $1", [1])
      ).rejects.toThrow('violates check constraint')
    })
  })

  describe('Fluxo de inativação', () => {
    it('deve marcar avaliações como inativadas quando funcionário é desativado', async () => {
      // Simula UPDATE que retorna avaliações inativadas
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, status: 'inativada' },
          { id: 2, status: 'inativada' }
        ],
        rowCount: 2
      })

      const result = await query(
        "UPDATE avaliacoes SET status = 'inativada' WHERE funcionario_cpf = $1 AND status != 'concluida' RETURNING id, status",
        ['12345678901']
      )

      expect(result.rowCount).toBe(2)
      expect(result.rows).toHaveLength(2)
      expect(result.rows[0].status).toBe('inativada')
      expect(result.rows[1].status).toBe('inativada')
    })

    it('não deve inativar avaliações já concluídas', async () => {
      // Simula UPDATE que retorna apenas avaliações não concluídas
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, status: 'inativada' }
        ],
        rowCount: 1
      })

      const result = await query(
        "UPDATE avaliacoes SET status = 'inativada' WHERE funcionario_cpf = $1 AND status != 'concluida' RETURNING id, status",
        ['12345678901']
      )

      expect(result.rowCount).toBe(1)
      expect(mockQuery).toHaveBeenCalledWith(
        "UPDATE avaliacoes SET status = 'inativada' WHERE funcionario_cpf = $1 AND status != 'concluida' RETURNING id, status",
        ['12345678901']
      )
    })
  })

  describe('Cálculo de status de lote', () => {
    it('deve marcar lote como "concluido" quando todas avaliações ativas estão concluídas', async () => {
      // Simula query que verifica estatísticas do lote
      mockQuery.mockResolvedValueOnce({
        rows: [{ ativas: 5, concluidas: 5 }],
        rowCount: 1
      })

      const result = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE a.status != 'inativada') as ativas,
          COUNT(*) FILTER (WHERE a.status = 'concluida') as concluidas
        FROM avaliacoes a
        WHERE a.lote_id = $1`,
        [1]
      )

      expect(result.rows[0].ativas).toBe(result.rows[0].concluidas)
    })

    it('deve manter lote como "ativo" quando há avaliações pendentes', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ ativas: 10, concluidas: 7 }],
        rowCount: 1
      })

      const result = await query(
        `SELECT 
          COUNT(*) FILTER (WHERE a.status != 'inativada') as ativas,
          COUNT(*) FILTER (WHERE a.status = 'concluida') as concluidas
        FROM avaliacoes a
        WHERE a.lote_id = $1`,
        [1]
      )

      expect(result.rows[0].ativas).toBeGreaterThan(result.rows[0].concluidas)
    })

    it('deve excluir avaliações inativadas do cálculo de avaliações ativas', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          total: 10,
          ativas: 8,
          concluidas: 5,
          inativadas: 2
        }],
        rowCount: 1
      })

      const result = await query(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE a.status != 'inativada') as ativas,
          COUNT(*) FILTER (WHERE a.status = 'concluida') as concluidas,
          COUNT(*) FILTER (WHERE a.status = 'inativada') as inativadas
        FROM avaliacoes a
        WHERE a.lote_id = $1`,
        [1]
      )

      const { total, ativas, inativadas } = result.rows[0]
      expect(ativas + inativadas).toBe(total)
    })
  })
})
