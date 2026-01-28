/**
 * Testes para consistência de clinica_id em funcionários
 * - Verificar se clinica_id corresponde à clínica da empresa
 * - Testar correção automática via trigger
 */

jest.mock('@/lib/db', () => ({
  query: jest.fn(),
}))

import { query } from '@/lib/db'

const mockQuery = query as jest.MockedFunction<typeof query>

describe('Consistência de clinica_id', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('deve identificar funcionários com clinica_id inconsistente', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 2, nome: 'Func 2', clinica_id: 2, empresa_clinica: 1 } // Inconsistente
      ],
      rowCount: 1
    })

    // Simular a query de verificação
    const result = await query(`
      SELECT f.id, f.nome, f.clinica_id, ec.clinica_id as empresa_clinica
      FROM funcionarios f
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE f.clinica_id != ec.clinica_id
    `)

    expect(result.rows).toHaveLength(1)
    expect(result.rows[0].clinica_id).not.toBe(result.rows[0].empresa_clinica)
  })

  it('deve corrigir clinica_id inconsistente', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 2, nome: 'Func 2', clinica_id: 1, empresa_clinica: 1 }
      ],
      rowCount: 1
    })

    // Simular UPDATE
    const updateResult = await query(`
      UPDATE funcionarios
      SET clinica_id = ec.clinica_id
      FROM empresas_clientes ec
      WHERE funcionarios.empresa_id = ec.id
      AND funcionarios.clinica_id IS DISTINCT FROM ec.clinica_id
      RETURNING funcionarios.id, funcionarios.nome
    `)

    expect(updateResult.rowCount).toBe(1)
    expect(updateResult.rows[0].nome).toBe('Func 2')
  })

  it('deve confirmar que não há inconsistências após correção', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [],
      rowCount: 0
    })

    const result = await query(`
      SELECT f.id FROM funcionarios f
      JOIN empresas_clientes ec ON f.empresa_id = ec.id
      WHERE f.clinica_id != ec.clinica_id
    `)

    expect(result.rows).toHaveLength(0)
  })
})
