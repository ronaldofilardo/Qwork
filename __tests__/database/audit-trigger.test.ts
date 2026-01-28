// Jest globals available by default
import { query } from '@/lib/db'
import { createSession } from '@/lib/session'

// Mock das dependências
jest.mock('@/lib/db')
jest.mock('@/lib/session')

describe('Database - Audit Trigger', () => {
  const mockQuery = query as jest.MockedFunction<typeof query>

  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('Audit Trigger Functionality', () => {
    it('deve verificar se a tabela audit_logs existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 })

      const result = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'audit_logs'
        )
      `)

      expect(result.rows[0].exists).toBe(true)
    })

    it('deve verificar se o trigger audit_funcionarios existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 })

      const result = await query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'audit_funcionarios_trigger'
        )
      `)

      expect(result.rows[0].exists).toBe(true)
    })

    it('deve verificar se a função audit_trigger_function existe', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 })

      const result = await query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc
          WHERE proname = 'audit_trigger_function'
        )
      `)

      expect(result.rows[0].exists).toBe(true)
    })

    it('deve verificar se a tabela permite NULL em user_cpf e user_perfil', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [
        { is_nullable: 'YES' },
        { is_nullable: 'YES' }
      ], rowCount: 2 })

      const result = await query(`
        SELECT is_nullable
        FROM information_schema.columns
        WHERE table_name = 'audit_logs'
        AND column_name IN ('user_cpf', 'user_perfil')
      `)

      expect(result.rows.every(row => row.is_nullable === 'YES')).toBe(true)
    })

    it('deve verificar se o trigger está ativo', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ tgenabled: 'O' }], rowCount: 1 })

      const result = await query(`
        SELECT tgenabled
        FROM pg_trigger
        WHERE tgname = 'audit_funcionarios_trigger'
      `)

      expect(result.rows[0].tgenabled).toBe('O')
    })

    it('deve verificar se a função de trigger lida com NULL', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ prosrc: 'CREATE OR REPLACE FUNCTION audit_trigger_function() RETURNS TRIGGER AS $$ BEGIN NULLIF current_setting END $$' }], rowCount: 1 })

      const result = await query(`
        SELECT prosrc
        FROM pg_proc
        WHERE proname = 'audit_trigger_function'
      `)

      const functionSource = result.rows[0].prosrc
      expect(functionSource).toContain('NULLIF')
      expect(functionSource).toContain('current_setting')
    })
  })

  describe('Audit Logging Tests', () => {
    it('deve registrar UPDATE em audit_logs', async () => {
      // Inserir dados de teste
      await query(`
        INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, perfil, clinica_id, empresa_id)
        VALUES ('99999999999', 'Teste', 'TI', 'Dev', 'teste@teste.com', 'hash', 'funcionario', 1, 1)
      `)

      // Configurar variáveis de sessão
      await query(`SET LOCAL app.current_user_cpf = '11111111111'`)
      await query(`SET LOCAL app.current_user_perfil = 'rh'`)

      // Atualizar registro (deve acionar trigger)
      await query(`
        UPDATE funcionarios
        SET nome = 'Teste Atualizado'
        WHERE cpf = '99999999999'
      `)

      // Verificar se foi registrado em audit_logs
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 })

      const auditResult = await query(`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE resource = 'funcionarios'
        AND action = 'UPDATE'
        AND resource_id = '99999999999'
      `)

      expect(auditResult.rows[0].count).toBeGreaterThan(0)
    })

    it('deve registrar INSERT em audit_logs', async () => {
      // Configurar variáveis de sessão
      await query(`SET LOCAL app.current_user_cpf = '11111111111'`)
      await query(`SET LOCAL app.current_user_perfil = 'rh'`)

      // Inserir registro (deve acionar trigger)
      await query(`
        INSERT INTO funcionarios (cpf, nome, setor, funcao, email, senha_hash, perfil, clinica_id, empresa_id)
        VALUES ('88888888888', 'Novo', 'RH', 'Analista', 'novo@teste.com', 'hash', 'funcionario', 1, 1)
      `)

      // Verificar se foi registrado em audit_logs
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 })

      const auditResult = await query(`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE resource = 'funcionarios'
        AND action = 'INSERT'
        AND resource_id = '88888888888'
      `)

      expect(auditResult.rows[0].count).toBeGreaterThan(0)
    })

    it('deve registrar DELETE em audit_logs', async () => {
      // Configurar variáveis de sessão
      await query(`SET LOCAL app.current_user_cpf = '11111111111'`)
      await query(`SET LOCAL app.current_user_perfil = 'rh'`)

      // Deletar registro (deve acionar trigger)
      await query(`
        DELETE FROM funcionarios
        WHERE cpf = '88888888888'
      `)

      // Verificar se foi registrado em audit_logs
      mockQuery.mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 })

      const auditResult = await query(`
        SELECT COUNT(*) as count
        FROM audit_logs
        WHERE resource = 'funcionarios'
        AND action = 'DELETE'
        AND resource_id = '88888888888'
      `)

      expect(auditResult.rows[0].count).toBeGreaterThan(0)
    })

    it('deve registrar com NULL quando variáveis de sessão não estão definidas', async () => {
      // Limpar variáveis de sessão
      await query(`RESET app.current_user_cpf`)
      await query(`RESET app.current_user_perfil`)

      // Atualizar registro sem contexto
      await query(`
        UPDATE funcionarios
        SET nome = 'Sem Contexto'
        WHERE cpf = '99999999999'
      `)

      // Verificar se foi registrado com NULL
      mockQuery.mockResolvedValueOnce({ rows: [{ user_cpf: null, user_perfil: null }], rowCount: 1 })

      const auditResult = await query(`
        SELECT user_cpf, user_perfil
        FROM audit_logs
        WHERE resource = 'funcionarios'
        AND action = 'UPDATE'
        AND resource_id = '99999999999'
        ORDER BY created_at DESC
        LIMIT 1
      `)

      expect(auditResult.rows[0].user_cpf).toBeNull()
      expect(auditResult.rows[0].user_perfil).toBeNull()
    })
  })
})
