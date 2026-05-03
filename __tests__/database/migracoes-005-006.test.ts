/**
 * Testes das Migrações 005 e 006 - Sanitização de Banco de Dados
 * Valida correções de FK duplicada e centralização de ENUMs
 */

import { query } from '@/lib/db'

describe('Migração 005: FK Duplicada e Constraints', () => {
  it('não deve ter FK duplicada lotes_avaliacao_liberado_por_fkey1', async () => {
    const result = await query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'lotes_avaliacao'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%liberado_por%'
    `)

    const fkNames = result.rows.map(r => r.constraint_name)
    expect(fkNames).toContain('lotes_avaliacao_liberado_por_fkey')
    expect(fkNames).not.toContain('lotes_avaliacao_liberado_por_fkey1')
  })

  it('deve ter apenas uma FK liberado_por na tabela lotes_avaliacao', async () => {
    const result = await query(`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE table_name = 'lotes_avaliacao'
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%liberado_por%'
    `)

    expect(parseInt(result.rows[0].count)).toBe(1)
  })

  it('todos os registros devem ter status válido em lotes_avaliacao', async () => {
    const result = await query(`
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN status IN ('rascunho', 'ativo', 'concluido', 'cancelado') THEN 1 END) as validos
      FROM lotes_avaliacao
    `)

    const { total, validos } = result.rows[0]
    expect(parseInt(total)).toBe(parseInt(validos))
  })
})

describe('Migração 006: Centralização de ENUMs', () => {
  it('deve ter criado os tipos ENUM corretos', async () => {
    const result = await query(`
      SELECT typname
      FROM pg_type
      WHERE typname IN ('perfil_usuario_enum', 'status_avaliacao_enum', 'status_lote_enum', 'status_laudo_enum', 'tipo_lote_enum')
      ORDER BY typname
    `)

    const enumNames = result.rows.map(r => r.typname).sort()
    expect(enumNames).toEqual([
      'perfil_usuario_enum',
      'status_avaliacao_enum',
      'status_laudo_enum',
      'status_lote_enum',
      'tipo_lote_enum'
    ])
  })

  it('perfil_usuario_enum deve ter valores corretos', async () => {
    const result = await query(`
      SELECT unnest(enum_range(NULL::perfil_usuario_enum)) as valores
      ORDER BY valores
    `)

    const valores = result.rows.map(r => r.valores)
    expect(valores).toEqual(['funcionario', 'rh', 'admin', 'emissor'])
  })

  it('status_avaliacao_enum deve ter valores corretos', async () => {
    const result = await query(`
      SELECT unnest(enum_range(NULL::status_avaliacao_enum)) as valores
      ORDER BY valores
    `)

    const valores = result.rows.map(r => r.valores)
    expect(valores).toEqual(['iniciada', 'em_andamento', 'concluida', 'inativada'])
  })

  it('deve ter função auxiliar para validar perfis', async () => {
    const result = await query(`
      SELECT proname
      FROM pg_proc
      WHERE proname = 'is_valid_perfil'
    `)

    expect(result.rows.length).toBeGreaterThan(0)
  })
})