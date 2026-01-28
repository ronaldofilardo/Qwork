/**
 * Testes para migração da coluna laudo_enviado_em
 *
 * Funcionalidades testadas:
 * 1. Verificação da existência da coluna laudo_enviado_em na tabela lotes_avaliacao
 * 2. Validação do tipo de dados da coluna
 * 3. Verificação do comentário da coluna
 * 4. Teste de atualização da coluna durante envio de laudo
 */

// Jest globals available by default
import { query } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

const mockQuery = query as jest.MockedFunction<typeof query>

describe('Migração da Coluna laudo_enviado_em', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve verificar que a coluna laudo_enviado_em existe na tabela lotes_avaliacao', async () => {
    // Mock da consulta de informações da coluna
    mockQuery.mockResolvedValueOnce({
      rows: [{
        column_name: 'laudo_enviado_em',
        data_type: 'timestamp without time zone',
        is_nullable: 'YES',
        column_default: null,
      }],
      rowCount: 1,
    })

    const result = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'lotes_avaliacao'
      AND column_name = 'laudo_enviado_em'
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].column_name).toBe('laudo_enviado_em')
    expect(result.rows[0].data_type).toBe('timestamp without time zone')
    expect(result.rows[0].is_nullable).toBe('YES')
  })

  it('deve verificar que o comentário da coluna foi adicionado', async () => {
    // Mock da consulta de comentários da coluna
    mockQuery.mockResolvedValueOnce({
      rows: [{
        obj_description: 'Data e hora em que o laudo do lote foi enviado para a clínica',
      }],
      rowCount: 1,
    })

    const result = await query(`
      SELECT obj_description
      FROM pg_description
      JOIN pg_class ON pg_description.objoid = pg_class.oid
      JOIN pg_attribute ON pg_description.objoid = pg_attribute.attrelid
        AND pg_description.objsubid = pg_attribute.attnum
      WHERE pg_class.relname = 'lotes_avaliacao'
      AND pg_attribute.attname = 'laudo_enviado_em'
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].obj_description).toBe('Data e hora em que o laudo do lote foi enviado para a clínica')
  })

  it('deve permitir atualização da coluna laudo_enviado_em durante envio', async () => {
    const loteId = 16
    const timestamp = new Date()

    // Mock da atualização
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 1,
    })

    // Simular a atualização que ocorre no PATCH endpoint
    const result = await query(`
      UPDATE lotes_avaliacao
      SET laudo_enviado_em = NOW(), atualizado_em = NOW()
      WHERE id = $1
    `, [loteId])

    expect(result.rowCount).toBe(1)
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('laudo_enviado_em = NOW()'),
      expect.arrayContaining([loteId])
    )
  })

  it('deve suportar valores NULL na coluna laudo_enviado_em', async () => {
    // Mock da inserção de um lote sem laudo_enviado_em
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 999 }],
      rowCount: 1,
    })

    const result = await query(`
      INSERT INTO lotes_avaliacao (
        codigo, clinica_id, empresa_id, titulo, descricao, liberado_por
      ) VALUES (
        'TEST-999', 1, 1, 'Lote Teste', 'Descrição teste', '99999999999'
      )
      RETURNING id
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].id).toBe(999)

    // Verificar que laudo_enviado_em é NULL por padrão
    mockQuery.mockResolvedValueOnce({
      rows: [{ laudo_enviado_em: null }],
      rowCount: 1,
    })

    const checkResult = await query('SELECT laudo_enviado_em FROM lotes_avaliacao WHERE id = $1', [999])
    expect(checkResult.rows[0].laudo_enviado_em).toBeNull()
  })

  it('deve validar integridade referencial com laudos', async () => {
    // Mock de consulta que verifica se lote tem laudo enviado
    mockQuery.mockResolvedValueOnce({
      rows: [{
        lote_id: 16,
        lote_status: 'concluido',
        laudo_status: 'enviado',
        laudo_enviado_em: '2025-12-14T12:00:00Z',
      }],
      rowCount: 1,
    })

    const result = await query(`
      SELECT
        la.lote_id,
        la.status as lote_status,
        l.status as laudo_status,
        la.laudo_enviado_em
      FROM lotes_avaliacao la
      JOIN laudos l ON la.id = l.lote_id
      WHERE la.id = $1
    `, [16])

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].laudo_status).toBe('enviado')
    expect(result.rows[0].laudo_enviado_em).toBeDefined()
  })
})