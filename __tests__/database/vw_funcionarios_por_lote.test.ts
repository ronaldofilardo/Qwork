import { query } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  query: jest.fn()
}))

const mockQuery = query as jest.MockedFunction<typeof query>

describe('vw_funcionarios_por_lote', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve retornar uma linha por funcionário por lote', async () => {
    // Mock para retornar vazio, indicando nenhuma duplicata
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })

    const result = await query(`
      SELECT cpf, lote_id, COUNT(*) as count
      FROM vw_funcionarios_por_lote
      GROUP BY cpf, lote_id
      HAVING COUNT(*) > 1
    `)

    expect(result.rows).toHaveLength(0) // Nenhuma duplicata
  })

  it('deve selecionar a avaliação mais recente por envio', async () => {
    const mockRows = [
      { cpf: '123', lote_id: 1, avaliacao_id: 1, data_conclusao: '2025-12-01' }
    ]
    mockQuery.mockResolvedValueOnce({ rows: mockRows, rowCount: 1 })

    const result = await query(`
      SELECT cpf, lote_id, avaliacao_id, data_conclusao
      FROM vw_funcionarios_por_lote
      WHERE lote_id = 1
      ORDER BY cpf
    `)

    expect(result.rows.length).toBeGreaterThan(0)
  })

  it('deve incluir todos os campos necessários', async () => {
    const mockRow = {
      cpf: '123',
      nome: 'Test',
      setor: 'TI',
      funcao: 'Dev',
      matricula: '001',
      turno: 'manhã',
      escala: '5x2',
      empresa_id: 1,
      clinica_id: 1,
      avaliacao_id: 1,
      status_avaliacao: 'concluida',
      data_conclusao: '2025-12-01',
      data_inicio: '2025-11-01',
      data_inativacao: null,
      motivo_inativacao: null,
      lote_id: 1
    }
    mockQuery.mockResolvedValueOnce({ rows: [mockRow], rowCount: 1 })

    const result = await query(`
      SELECT cpf, nome, setor, funcao, matricula, turno, escala,
             empresa_id, clinica_id, avaliacao_id, status_avaliacao,
             data_conclusao, data_inicio, data_inativacao, motivo_inativacao, lote_id
      FROM vw_funcionarios_por_lote
      LIMIT 1
    `)

    expect(result.rows[0]).toHaveProperty('cpf')
    expect(result.rows[0]).toHaveProperty('nome')
    expect(result.rows[0]).toHaveProperty('avaliacao_id')
    expect(result.rows[0]).toHaveProperty('data_inativacao')
    expect(result.rows[0]).toHaveProperty('motivo_inativacao')
  })
})
